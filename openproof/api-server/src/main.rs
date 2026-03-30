use axum::http::Method;
use lib_authz::{PermissionCheck, RoleBasedPerms};
use lib_bitcoin_rpc::BitcoinRpcAdapter;
use openproof_api_server::blink::{self, BlinkClient};
use openproof_api_server::config;
use openproof_api_server::mailer;
use openproof_api_server::rate_limit;
use openproof_api_server::routes;
use openproof_api_server::{AppState, AuthSettings, BillingSettings, RateLimitSettings, RuntimeSettings};
use openproof_app::workers;
use std::sync::Arc;
use tracing_subscriber::EnvFilter;
use openproof_app::OpenProofApp;
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let cfg = match config::AppConfig::from_env() {
        Ok(c) => c,
        Err(e) => {
            eprintln!("config error: {e}");
            std::process::exit(1);
        }
    };

    let bitcoin: Arc<dyn core_notarization::BitcoinNodePort> = Arc::new(BitcoinRpcAdapter::new(
        &cfg.bitcoin_rpc_url,
        &cfg.bitcoin_rpc_user,
        &cfg.bitcoin_rpc_password,
    ));
    let perms: Arc<dyn PermissionCheck> = Arc::new(RoleBasedPerms);
    let mailer: Arc<dyn mailer::EmailSender> = Arc::new(mailer::TracingEmailSender {
        app_base_url: cfg.app_base_url.clone(),
    });
    let blink = match BlinkClient::new(
        cfg.blink_api_url.clone(),
        cfg.blink_api_key.clone(),
        cfg.blink_webhook_secret.clone(),
    ) {
        Ok(value) => Arc::new(value),
        Err(error) => {
            eprintln!("blink client: {error}");
            std::process::exit(1);
        }
    };

    let app = match OpenProofApp::connect(&cfg.database_url).await {
        Ok(a) => a,
        Err(e) => {
            eprintln!("database: {e}");
            std::process::exit(1);
        }
    };

    let pool = app.pool.clone();
    tokio::spawn(workers::run_outbox_worker(pool, bitcoin.clone()));
    tokio::spawn(blink::run_billing_reconcile_worker(
        app.pool.clone(),
        blink.clone(),
        cfg.billing_reconcile_interval_seconds,
    ));

    let state = Arc::new(AppState {
        pool: app.pool,
        bitcoin,
        blink,
        perms,
        mailer,
        auth: AuthSettings {
            session_cookie_name: cfg.session_cookie_name,
            session_ttl_hours: cfg.session_ttl_hours,
            verification_token_ttl_hours: cfg.verification_token_ttl_hours,
            password_reset_token_ttl_hours: cfg.password_reset_token_ttl_hours,
            secure_cookies: cfg.secure_cookies,
            expose_dev_auth_tokens: cfg.expose_dev_auth_tokens,
        },
        billing: BillingSettings {
            document_registration_credit_cost: cfg.document_registration_credit_cost,
        },
        runtime: RuntimeSettings {
            app_env: cfg.app_env,
        },
        rate_limits: RateLimitSettings {
            auth_requests: cfg.auth_rate_limit_requests,
            auth_window_seconds: cfg.auth_rate_limit_window_seconds,
            verify_requests: cfg.verify_rate_limit_requests,
            verify_window_seconds: cfg.verify_rate_limit_window_seconds,
            webhook_requests: cfg.webhook_rate_limit_requests,
            webhook_window_seconds: cfg.webhook_rate_limit_window_seconds,
        },
        rate_limiter: Arc::new(rate_limit::RateLimiter::default()),
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any);

    let app = routes::api_router(state).layer(cors);

    let listener = tokio::net::TcpListener::bind(&cfg.listen_addr)
        .await
        .expect("bind");
    tracing::info!("listening on {}", cfg.listen_addr);
    axum::serve(listener, app).await.expect("serve");
}
