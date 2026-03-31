use std::sync::Arc;

use async_trait::async_trait;
use axum::body::{to_bytes, Body};
use axum::http::{Request, StatusCode};
use chrono::{Duration, Utc};
use lib_authz::{PermissionCheck, RoleBasedPerms};
use openproof_api_server::auth;
use openproof_api_server::blink::BlinkClient;
use openproof_api_server::mailer::EmailSender;
use openproof_api_server::rate_limit::RateLimiter;
use openproof_api_server::routes::api_router;
use openproof_api_server::{
    AppState, AuthSettings, BillingSettings, RateLimitSettings, RuntimeSettings, StorageSettings,
};
use openproof_app::sessions;
use openproof_app::users;
use serde_json::{json, Value};
use sqlx::PgPool;
use tower::util::ServiceExt;
use uuid::Uuid;

struct StubMailer;

#[async_trait]
impl EmailSender for StubMailer {
    async fn send_verification_email(
        &self,
        _email: &str,
        _name: &str,
        _token: &str,
    ) -> Result<(), String> {
        Ok(())
    }

    async fn send_password_reset_email(
        &self,
        _email: &str,
        _name: &str,
        _token: &str,
    ) -> Result<(), String> {
        Ok(())
    }

    async fn send_document_anchored_email(
        &self,
        _email: &str,
        _name: &str,
        _filename: &str,
        _transaction_id: &str,
        _proof_url: &str,
        _file_url: &str,
    ) -> Result<(), String> {
        Ok(())
    }
}

struct StubBitcoinNode;

#[async_trait]
impl core_notarization::BitcoinNodePort for StubBitcoinNode {
    async fn send_op_return(&self, _payload: &[u8]) -> Result<String, core_notarization::BitcoinNodeError> {
        Ok("stub-txid".to_string())
    }

    async fn get_transaction(
        &self,
        _txid: &str,
    ) -> Result<core_notarization::TransactionInfo, core_notarization::BitcoinNodeError> {
        Err(core_notarization::BitcoinNodeError::InvalidTxid("stub".to_string()))
    }

    async fn get_wallet_info(
        &self,
    ) -> Result<core_notarization::WalletInfo, core_notarization::BitcoinNodeError> {
        Ok(core_notarization::WalletInfo {
            wallet_name: "default".to_string(),
            loaded: true,
            primary_address: "bcrt1qexamplewalletaddress".to_string(),
            balance_sats: 125_000,
            confirmed_balance_sats: 125_000,
            unconfirmed_balance_sats: 0,
            tx_count: 3,
            network: core_notarization::NetworkName::Regtest,
        })
    }
}

fn test_state(pool: PgPool, rate_limits: RateLimitSettings) -> Arc<AppState> {
    Arc::new(AppState {
        pool,
        bitcoin: Arc::new(StubBitcoinNode),
        blink: Arc::new(
            BlinkClient::new(
                "https://api.staging.blink.sv/graphql".to_string(),
                None,
                None,
            )
            .expect("blink client"),
        ),
        perms: Arc::new(RoleBasedPerms) as Arc<dyn PermissionCheck>,
        mailer: Arc::new(StubMailer),
        auth: AuthSettings {
            session_cookie_name: "openproof_session".to_string(),
            session_ttl_hours: 24,
            verification_token_ttl_hours: 24,
            password_reset_token_ttl_hours: 2,
            secure_cookies: false,
            expose_dev_auth_tokens: true,
        },
        billing: BillingSettings {
            credit_price_sats: 10_000,
            document_registration_credit_cost: 1,
        },
        storage: StorageSettings {
            document_storage_dir: "tmp/test-document-storage".to_string(),
            document_upload_max_bytes: 20 * 1024 * 1024,
        },
        runtime: RuntimeSettings {
            app_env: "test".to_string(),
            app_base_url: "http://localhost:3000".to_string(),
        },
        rate_limits,
        rate_limiter: Arc::new(RateLimiter::default()),
    })
}

async fn create_user(pool: &PgPool, email: &str, password: &str, role: &str, verified: bool) -> Uuid {
    let password_hash = auth::hash_password(password).expect("password hash");
    let user = users::create_user_with_password(pool, "Test User", email, &password_hash)
        .await
        .expect("create user");

    sqlx::query(
        r#"
        UPDATE users
        SET role = $2, email_verified_at = $3, updated_at = NOW()
        WHERE id = $1
        "#,
    )
    .bind(user.id)
    .bind(role)
    .bind(verified.then_some(Utc::now()))
    .execute(pool)
    .await
    .expect("update user role");

    user.id
}

async fn create_session_cookie(pool: &PgPool, state: &AppState, user_id: Uuid) -> String {
    let token = auth::generate_token();
    let token_hash = auth::hash_token(&token);
    sessions::create_session(
        pool,
        user_id,
        &token_hash,
        Utc::now() + Duration::hours(state.auth.session_ttl_hours),
    )
    .await
    .expect("create session");

    format!("{}={}", state.auth.session_cookie_name, token)
}

async fn response_json(response: axum::response::Response) -> Value {
    let bytes = to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("read body");
    serde_json::from_slice(&bytes).expect("json body")
}

#[sqlx::test(migrations = "../app/migrations")]
async fn admin_routes_require_admin_role(pool: PgPool) {
    let state = test_state(
        pool.clone(),
        RateLimitSettings {
            auth_requests: 20,
            auth_window_seconds: 300,
            verify_requests: 30,
            verify_window_seconds: 60,
            webhook_requests: 120,
            webhook_window_seconds: 60,
        },
    );
    let app = api_router(state.clone());
    let user_id = create_user(&pool, "member@example.com", "password123", "user", true).await;
    let cookie = create_session_cookie(&pool, state.as_ref(), user_id).await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/admin/overview")
                .header("cookie", cookie)
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
    let body = response_json(response).await;
    assert_eq!(body["success"], Value::Bool(false));
    assert_eq!(body["error"], Value::String("admin role required".to_string()));
}

#[sqlx::test(migrations = "../app/migrations")]
async fn admin_credit_adjustment_is_audited(pool: PgPool) {
    let state = test_state(
        pool.clone(),
        RateLimitSettings {
            auth_requests: 20,
            auth_window_seconds: 300,
            verify_requests: 30,
            verify_window_seconds: 60,
            webhook_requests: 120,
            webhook_window_seconds: 60,
        },
    );
    let app = api_router(state.clone());
    let admin_id = create_user(&pool, "admin@example.com", "password123", "admin", true).await;
    let target_user_id = create_user(&pool, "target@example.com", "password123", "user", true).await;
    let cookie = create_session_cookie(&pool, state.as_ref(), admin_id).await;

    let adjust_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/admin/credits/adjust")
                .header("content-type", "application/json")
                .header("cookie", cookie.clone())
                .body(Body::from(
                    json!({
                        "userId": target_user_id,
                        "deltaCredits": 5,
                        "reason": "staging top-up"
                    })
                    .to_string(),
                ))
                .expect("request"),
        )
        .await
        .expect("response");

    assert_eq!(adjust_response.status(), StatusCode::OK);

    let audit_response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/admin/audit-events?limit=10")
                .header("cookie", cookie)
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");

    assert_eq!(audit_response.status(), StatusCode::OK);
    let body = response_json(audit_response).await;
    let events = body["data"].as_array().expect("audit event array");
    let matched_event = events.iter().find(|event| {
        event["action"] == Value::String("admin.adjust_credits".to_string())
            && event["targetId"] == Value::String(target_user_id.to_string())
    });

    let event = matched_event.expect("matching audit event");
    assert_eq!(event["status"], Value::String("success".to_string()));
    assert_eq!(event["message"], Value::String("staging top-up".to_string()));
    assert_eq!(event["metadata"]["deltaCredits"], Value::Number(5.into()));
}

#[sqlx::test(migrations = "../app/migrations")]
async fn auth_login_is_rate_limited(pool: PgPool) {
    let state = test_state(
        pool.clone(),
        RateLimitSettings {
            auth_requests: 1,
            auth_window_seconds: 300,
            verify_requests: 30,
            verify_window_seconds: 60,
            webhook_requests: 120,
            webhook_window_seconds: 60,
        },
    );
    let app = api_router(state);
    let _user_id = create_user(&pool, "rate@example.com", "password123", "user", true).await;

    let login_body = json!({
        "email": "rate@example.com",
        "password": "password123"
    })
    .to_string();

    let first_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/auth/login")
                .header("content-type", "application/json")
                .header("x-forwarded-for", "203.0.113.10")
                .body(Body::from(login_body.clone()))
                .expect("request"),
        )
        .await
        .expect("response");

    assert_eq!(first_response.status(), StatusCode::OK);

    let second_response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/auth/login")
                .header("content-type", "application/json")
                .header("x-forwarded-for", "203.0.113.10")
                .body(Body::from(login_body))
                .expect("request"),
        )
        .await
        .expect("response");

    assert_eq!(second_response.status(), StatusCode::TOO_MANY_REQUESTS);
    let body = response_json(second_response).await;
    assert_eq!(body["success"], Value::Bool(false));
    assert_eq!(body["error"], Value::String("rate limit exceeded for auth".to_string()));
}