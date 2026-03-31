use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::Json;
use openproof_app::{admin, audit, sessions, users};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

use crate::auth;
use crate::error::{err_json, ok_json};
use crate::handlers::auth::{AuthUserResponse, SessionResponse};
use crate::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminQuery {
    pub limit: Option<i64>,
    pub failed_only: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserRoleRequest {
    pub role: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdjustCreditsRequest {
    pub user_id: String,
    pub delta_credits: i64,
    pub reason: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInitialAdminRequest {
    pub name: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminLoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminSetupStatusResponse {
    pub admin_exists: bool,
    pub registration_enabled: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminOverviewResponse {
    pub environment: String,
    pub stats: AdminStatsResponse,
    pub wallet: AdminWalletResponse,
    pub pricing: AdminPricingResponse,
    pub blink: AdminBlinkResponse,
    pub alerts: Vec<String>,
    pub users: Vec<AdminUserResponse>,
    pub documents: Vec<AdminDocumentResponse>,
    pub ledger: Vec<CreditLedgerEntryResponse>,
    pub payments: Vec<AdminPaymentIntentResponse>,
    pub webhook_events: Vec<WebhookEventResponse>,
    pub audit_events: Vec<AuditEventResponse>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminStatsResponse {
    pub total_users: i64,
    pub verified_users: i64,
    pub admin_users: i64,
    pub total_credit_balance: i64,
    pub total_documents: i64,
    pub pending_documents: i64,
    pub processing_documents: i64,
    pub confirmed_documents: i64,
    pub failed_documents: i64,
    pub pending_payment_intents: i64,
    pub stale_pending_payment_intents: i64,
    pub failed_webhook_events: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWalletResponse {
    pub wallet_name: String,
    pub loaded: bool,
    pub primary_address: String,
    pub balance_sats: i64,
    pub confirmed_balance_sats: i64,
    pub unconfirmed_balance_sats: i64,
    pub tx_count: u64,
    pub network: core_notarization::NetworkName,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminPricingResponse {
    pub credit_price_sats: i64,
    pub document_registration_credit_cost: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminBlinkResponse {
    pub api_configured: bool,
    pub webhook_configured: bool,
    pub api_url: String,
    pub webhook_url: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUserResponse {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email_verified_at: Option<chrono::DateTime<chrono::Utc>>,
    pub balance_credits: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminDocumentResponse {
    pub id: String,
    pub user_id: String,
    pub user_email: String,
    pub filename: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub block_height: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confirmations: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreditLedgerEntryResponse {
    pub id: String,
    pub user_id: String,
    pub user_email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_intent_id: Option<String>,
    pub kind: String,
    pub delta_credits: i64,
    pub balance_after_credits: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_id: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminPaymentIntentResponse {
    pub id: String,
    pub user_id: String,
    pub user_email: String,
    pub package_code: String,
    pub package_name: String,
    pub amount_sats: i64,
    pub credits: i64,
    pub status: String,
    pub blink_invoice_status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_hash: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub paid_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WebhookEventResponse {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub webhook_message_id: Option<String>,
    pub event_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_hash: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub processed_at: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub processing_error: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditEventResponse {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actor_user_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actor_email: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actor_role: Option<String>,
    pub action: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_id: Option<String>,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn setup_status(State(state): State<Arc<AppState>>) -> axum::response::Response {
    let admin_exists = match users::admin_user_exists(&state.pool).await {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    };

    ok_json(AdminSetupStatusResponse {
        admin_exists,
        registration_enabled: !admin_exists,
    })
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(body): Json<AdminLoginRequest>,
) -> axum::response::Response {
    let Some(email) = auth::normalize_email(&body.email) else {
        return err_json(StatusCode::BAD_REQUEST, "valid email is required");
    };

    let Some(auth_record) = (match users::find_auth_by_email(&state.pool, &email).await {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    }) else {
        return err_json(StatusCode::UNAUTHORIZED, "invalid credentials");
    };

    if !auth::verify_password(&body.password, &auth_record.password_hash) {
        return err_json(StatusCode::UNAUTHORIZED, "invalid credentials");
    }

    if auth_record.user.role != "admin" {
        return err_json(StatusCode::FORBIDDEN, "admin role required");
    }

    if !auth_record.user.is_email_verified() {
        return err_json(StatusCode::FORBIDDEN, "email verification required");
    }

    let session_token = auth::generate_token();
    let session_token_hash = auth::hash_token(&session_token);
    if let Err(error) = sessions::create_session(
        &state.pool,
        auth_record.user.id,
        &session_token_hash,
        auth::session_expires_at(state.as_ref()),
    )
    .await
    {
        return auth::internal_error(error);
    }

    auth::json_with_cookie(
        StatusCode::OK,
        SessionResponse {
            user: map_auth_user(&auth_record.user),
        },
        Some(auth::session_cookie(state.as_ref(), &session_token)),
    )
}

pub async fn create_initial_admin(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateInitialAdminRequest>,
) -> axum::response::Response {
    let admin_exists = match users::admin_user_exists(&state.pool).await {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    };
    if admin_exists {
        return err_json(StatusCode::CONFLICT, "an admin user already exists");
    }

    let Some(name) = auth::normalize_user_name(&body.name) else {
        return err_json(StatusCode::BAD_REQUEST, "name is required");
    };
    let Some(email) = auth::normalize_email(&body.email) else {
        return err_json(StatusCode::BAD_REQUEST, "valid email is required");
    };
    if let Err(message) = auth::validate_password(&body.password) {
        return err_json(StatusCode::BAD_REQUEST, message);
    }

    let password_hash = match auth::hash_password(&body.password) {
        Ok(value) => value,
        Err(message) => return err_json(StatusCode::INTERNAL_SERVER_ERROR, message),
    };

    let user = match users::create_initial_admin_with_password(&state.pool, &name, &email, &password_hash).await {
        Ok(value) => value,
        Err(sqlx::Error::Database(error)) if error.code().as_deref() == Some("23505") => {
            return err_json(StatusCode::CONFLICT, "email already exists");
        }
        Err(error) => return auth::internal_error(error),
    };

    let session_token = auth::generate_token();
    let session_token_hash = auth::hash_token(&session_token);
    if let Err(error) = sessions::create_session(
        &state.pool,
        user.id,
        &session_token_hash,
        auth::session_expires_at(state.as_ref()),
    )
    .await
    {
        return auth::internal_error(error);
    }

    auth::json_with_cookie(
        StatusCode::CREATED,
        SessionResponse {
            user: map_auth_user(&user),
        },
        Some(auth::session_cookie(state.as_ref(), &session_token)),
    )
}

pub async fn overview(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> axum::response::Response {
    if let Err(response) = auth::require_admin_session(&headers, &state).await {
        return response;
    }

    let stats = match admin::get_overview_stats(&state.pool).await {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };
    let wallet = match state.bitcoin.get_wallet_info().await {
        Ok(value) => value,
        Err(error) => return wallet_error_response(error),
    };
    let users = match admin::list_users(&state.pool, 10).await {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };
    let documents = match admin::list_documents(&state.pool, 12).await {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };
    let ledger = match admin::list_credit_ledger_entries(&state.pool, 12).await {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };
    let payments = match admin::list_payment_intents(&state.pool, 12).await {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };
    let webhook_events = match admin::list_blink_webhook_events(&state.pool, 12, false).await {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };
    let audit_events = match audit::list_audit_events(&state.pool, 12).await {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    };
    let blink = map_blink(&state);

    ok_json(AdminOverviewResponse {
        environment: state.runtime.app_env.clone(),
        stats: AdminStatsResponse {
            total_users: stats.total_users,
            verified_users: stats.verified_users,
            admin_users: stats.admin_users,
            total_credit_balance: stats.total_credit_balance,
            total_documents: stats.total_documents,
            pending_documents: stats.pending_documents,
            processing_documents: stats.processing_documents,
            confirmed_documents: stats.confirmed_documents,
            failed_documents: stats.failed_documents,
            pending_payment_intents: stats.pending_payment_intents,
            stale_pending_payment_intents: stats.stale_pending_payment_intents,
            failed_webhook_events: stats.failed_webhook_events,
        },
        wallet: map_wallet(&wallet),
        pricing: AdminPricingResponse {
            credit_price_sats: state.billing.credit_price_sats,
            document_registration_credit_cost: state.billing.document_registration_credit_cost,
        },
        blink,
        alerts: build_alerts(
            &stats,
            &wallet,
            state.blink.is_configured(),
            state.blink.is_webhook_configured(),
        ),
        users: users.iter().map(map_user).collect(),
        documents: documents.iter().map(map_document).collect(),
        ledger: ledger.iter().map(map_ledger).collect(),
        payments: payments.iter().map(map_payment).collect(),
        webhook_events: webhook_events.iter().map(map_webhook_event).collect(),
        audit_events: audit_events.iter().map(map_audit_event).collect(),
    })
}

pub async fn list_users(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> axum::response::Response {
    if let Err(response) = auth::require_admin_session(&headers, &state).await {
        return response;
    }

    let users = match admin::list_users(&state.pool, query_limit(query.limit)).await {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };

    ok_json(users.iter().map(map_user).collect::<Vec<_>>())
}

pub async fn list_documents(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> axum::response::Response {
    if let Err(response) = auth::require_admin_session(&headers, &state).await {
        return response;
    }

    let documents = match admin::list_documents(&state.pool, query_limit(query.limit)).await {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };

    ok_json(documents.iter().map(map_document).collect::<Vec<_>>())
}

pub async fn update_user_role(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(body): Json<UpdateUserRoleRequest>,
) -> axum::response::Response {
    let session = match auth::require_admin_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    let Ok(user_id) = Uuid::parse_str(&id) else {
        return err_json(StatusCode::BAD_REQUEST, "invalid user id");
    };

    let role = body.role.trim();
    if !matches!(role, "user" | "admin") {
        return err_json(StatusCode::BAD_REQUEST, "role must be user or admin");
    }
    if session.subject.user_id == user_id && role != "admin" {
        return err_json(StatusCode::BAD_REQUEST, "cannot remove your own admin role");
    }

    let user = match admin::set_user_role(&state.pool, user_id, role).await {
        Ok(Some(value)) => value,
        Ok(None) => return err_json(StatusCode::NOT_FOUND, "user not found"),
        Err(error) => return admin_error_response(error),
    };

    let _ = audit::record_event(
        &state.pool,
        audit::NewAuditEvent {
            actor_user_id: Some(session.subject.user_id),
            actor_email: Some(&session.user.email),
            actor_role: Some(&session.user.role),
            action: "admin.update_user_role",
            target_type: Some("user"),
            target_id: Some(&user.id.to_string()),
            status: "success",
            message: Some("user role updated"),
            metadata: Some(json!({ "role": role })),
        },
    )
    .await;

    ok_json(map_user(&user))
}

pub async fn list_ledger(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> axum::response::Response {
    if let Err(response) = auth::require_admin_session(&headers, &state).await {
        return response;
    }

    let ledger = match admin::list_credit_ledger_entries(&state.pool, query_limit(query.limit)).await {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };

    ok_json(ledger.iter().map(map_ledger).collect::<Vec<_>>())
}

pub async fn list_payments(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> axum::response::Response {
    if let Err(response) = auth::require_admin_session(&headers, &state).await {
        return response;
    }

    let payments = match admin::list_payment_intents(&state.pool, query_limit(query.limit)).await {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };

    ok_json(payments.iter().map(map_payment).collect::<Vec<_>>())
}

pub async fn list_webhooks(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> axum::response::Response {
    if let Err(response) = auth::require_admin_session(&headers, &state).await {
        return response;
    }

    let events = match admin::list_blink_webhook_events(
        &state.pool,
        query_limit(query.limit),
        query.failed_only.unwrap_or(false),
    )
    .await
    {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };

    ok_json(events.iter().map(map_webhook_event).collect::<Vec<_>>())
}

pub async fn list_audit_events(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> axum::response::Response {
    if let Err(response) = auth::require_admin_session(&headers, &state).await {
        return response;
    }

    let events = match audit::list_audit_events(&state.pool, query_limit(query.limit)).await {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    };

    ok_json(events.iter().map(map_audit_event).collect::<Vec<_>>())
}

pub async fn adjust_credits(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(body): Json<AdjustCreditsRequest>,
) -> axum::response::Response {
    let session = match auth::require_admin_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    let Ok(user_id) = Uuid::parse_str(&body.user_id) else {
        return err_json(StatusCode::BAD_REQUEST, "invalid user id");
    };
    let reason = body.reason.trim();
    if reason.is_empty() || reason.len() > 200 {
        return err_json(StatusCode::BAD_REQUEST, "reason is required and must be under 200 characters");
    }

    let ledger_entry = match admin::adjust_user_credits(
        &state.pool,
        session.subject.user_id,
        user_id,
        body.delta_credits,
        reason,
    )
    .await
    {
        Ok(value) => value,
        Err(error) => return admin_error_response(error),
    };

    let _ = audit::record_event(
        &state.pool,
        audit::NewAuditEvent {
            actor_user_id: Some(session.subject.user_id),
            actor_email: Some(&session.user.email),
            actor_role: Some(&session.user.role),
            action: "admin.adjust_credits",
            target_type: Some("user"),
            target_id: Some(&body.user_id),
            status: "success",
            message: Some(reason),
            metadata: Some(json!({ "deltaCredits": body.delta_credits })),
        },
    )
    .await;

    ok_json(map_ledger(&ledger_entry))
}

fn query_limit(limit: Option<i64>) -> i64 {
    limit.unwrap_or(50).clamp(1, 200)
}

fn build_alerts(
    stats: &admin::AdminOverviewStats,
    wallet: &core_notarization::WalletInfo,
    blink_configured: bool,
    webhook_configured: bool,
) -> Vec<String> {
    let mut alerts = Vec::new();

    if !blink_configured {
        alerts.push(
            "Blink no está configurado: no se pueden crear invoices ni reconciliar pagos Lightning."
                .to_string(),
        );
    } else if !webhook_configured {
        alerts.push(
            "Blink opera sin webhook verificado: el sistema depende del worker de reconciliación por polling."
                .to_string(),
        );
    }

    if stats.failed_webhook_events > 0 {
        alerts.push(format!(
            "{} webhook(s) con errores de procesamiento.",
            stats.failed_webhook_events
        ));
    }
    if stats.stale_pending_payment_intents > 0 {
        alerts.push(format!(
            "{} pago(s) pendientes desde hace mas de 15 minutos.",
            stats.stale_pending_payment_intents
        ));
    }
    let unverified_users = stats.total_users - stats.verified_users;
    if unverified_users > 0 {
        alerts.push(format!(
            "{} usuario(s) aun no verificaron email.",
            unverified_users
        ));
    }
    if wallet.balance_sats <= 0 {
        alerts.push("La wallet no tiene saldo spendable para registrar documentos on-chain.".to_string());
    }
    if stats.failed_documents > 0 {
        alerts.push(format!(
            "{} documento(s) quedaron en estado failed.",
            stats.failed_documents
        ));
    }

    alerts
}

fn map_wallet(wallet: &core_notarization::WalletInfo) -> AdminWalletResponse {
    AdminWalletResponse {
        wallet_name: wallet.wallet_name.clone(),
        loaded: wallet.loaded,
        primary_address: wallet.primary_address.clone(),
        balance_sats: wallet.balance_sats,
        confirmed_balance_sats: wallet.confirmed_balance_sats,
        unconfirmed_balance_sats: wallet.unconfirmed_balance_sats,
        tx_count: wallet.tx_count,
        network: wallet.network.clone(),
    }
}

fn map_blink(state: &Arc<AppState>) -> AdminBlinkResponse {
    AdminBlinkResponse {
        api_configured: state.blink.is_configured(),
        webhook_configured: state.blink.is_webhook_configured(),
        api_url: state.blink.api_url().to_string(),
        webhook_url: format!(
            "{}/api/v1/billing/blink/webhook",
            state.runtime.app_base_url.trim_end_matches('/')
        ),
    }
}

fn map_user(user: &admin::AdminUserRecord) -> AdminUserResponse {
    AdminUserResponse {
        id: user.id.to_string(),
        name: user.name.clone(),
        email: user.email.clone(),
        role: user.role.clone(),
        email_verified_at: user.email_verified_at,
        balance_credits: user.balance_credits,
        created_at: user.created_at,
        updated_at: user.updated_at,
    }
}

fn map_document(document: &admin::AdminDocumentRecord) -> AdminDocumentResponse {
    AdminDocumentResponse {
        id: document.id.to_string(),
        user_id: document.user_id.to_string(),
        user_email: document.user_email.clone(),
        filename: document.filename.clone(),
        status: document.status.clone(),
        transaction_id: document.transaction_id.clone(),
        block_height: document.block_height,
        confirmations: document.confirmations,
        failure_reason: document.failure_reason.clone(),
        created_at: document.created_at,
        updated_at: document.updated_at,
    }
}

fn map_ledger(entry: &admin::CreditLedgerEntryRecord) -> CreditLedgerEntryResponse {
    CreditLedgerEntryResponse {
        id: entry.id.to_string(),
        user_id: entry.user_id.to_string(),
        user_email: entry.user_email.clone(),
        payment_intent_id: entry.payment_intent_id.map(|value| value.to_string()),
        kind: entry.kind.clone(),
        delta_credits: entry.delta_credits,
        balance_after_credits: entry.balance_after_credits,
        description: entry.description.clone(),
        reference_type: entry.reference_type.clone(),
        reference_id: entry.reference_id.map(|value| value.to_string()),
        created_at: entry.created_at,
    }
}

fn map_payment(payment: &admin::AdminPaymentIntentRecord) -> AdminPaymentIntentResponse {
    AdminPaymentIntentResponse {
        id: payment.id.to_string(),
        user_id: payment.user_id.to_string(),
        user_email: payment.user_email.clone(),
        package_code: payment.package_code.clone(),
        package_name: payment.package_name.clone(),
        amount_sats: payment.amount_sats,
        credits: payment.credits,
        status: payment.status.clone(),
        blink_invoice_status: payment.blink_invoice_status.clone(),
        payment_hash: payment.payment_hash.clone(),
        expires_at: payment.expires_at,
        paid_at: payment.paid_at,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
    }
}

fn map_webhook_event(event: &admin::BlinkWebhookEventRecord) -> WebhookEventResponse {
    WebhookEventResponse {
        id: event.id.to_string(),
        webhook_message_id: event.webhook_message_id.clone(),
        event_type: event.event_type.clone(),
        payment_hash: event.payment_hash.clone(),
        processed_at: event.processed_at,
        processing_error: event.processing_error.clone(),
        created_at: event.created_at,
    }
}

fn map_audit_event(event: &audit::AuditEventRecord) -> AuditEventResponse {
    AuditEventResponse {
        id: event.id.to_string(),
        actor_user_id: event.actor_user_id.map(|value| value.to_string()),
        actor_email: event.actor_email.clone(),
        actor_role: event.actor_role.clone(),
        action: event.action.clone(),
        target_type: event.target_type.clone(),
        target_id: event.target_id.clone(),
        status: event.status.clone(),
        message: event.message.clone(),
        metadata: event.metadata.clone(),
        created_at: event.created_at,
    }
}

fn map_auth_user(user: &users::UserRecord) -> AuthUserResponse {
    AuthUserResponse {
        id: user.id.to_string(),
        name: user.name.clone(),
        email: user.email.clone(),
        role: user.role.clone(),
        email_verified: user.is_email_verified(),
        avatar_url: user.avatar_url.clone(),
        created_at: user.created_at,
    }
}

fn admin_error_response(error: admin::AdminError) -> axum::response::Response {
    match error {
        admin::AdminError::InvalidCreditAdjustment => {
            err_json(StatusCode::BAD_REQUEST, error.to_string())
        }
        admin::AdminError::InsufficientCredits { .. } => {
            err_json(StatusCode::BAD_REQUEST, error.to_string())
        }
        admin::AdminError::Sqlx(_) => err_json(StatusCode::INTERNAL_SERVER_ERROR, error.to_string()),
    }
}

fn wallet_error_response(error: core_notarization::BitcoinNodeError) -> axum::response::Response {
    err_json(StatusCode::SERVICE_UNAVAILABLE, error.to_string())
}