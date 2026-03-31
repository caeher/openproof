use std::sync::Arc;

use lib_authz::PermissionCheck;

pub mod auth;
pub mod blink;
pub mod config;
pub mod document_chain;
pub mod error;
pub mod handlers;
pub mod mailer;
pub mod rate_limit;
pub mod routes;
pub mod storage;

#[derive(Clone)]
pub struct AuthSettings {
    pub session_cookie_name: String,
    pub session_ttl_hours: i64,
    pub verification_token_ttl_hours: i64,
    pub password_reset_token_ttl_hours: i64,
    pub secure_cookies: bool,
    pub expose_dev_auth_tokens: bool,
}

#[derive(Clone)]
pub struct BillingSettings {
    pub document_registration_credit_cost: i64,
}

#[derive(Clone)]
pub struct StorageSettings {
    pub document_storage_dir: String,
    pub document_upload_max_bytes: usize,
}

#[derive(Clone)]
pub struct RuntimeSettings {
    pub app_env: String,
    pub app_base_url: String,
}

#[derive(Clone)]
pub struct RateLimitSettings {
    pub auth_requests: u32,
    pub auth_window_seconds: u64,
    pub verify_requests: u32,
    pub verify_window_seconds: u64,
    pub webhook_requests: u32,
    pub webhook_window_seconds: u64,
}

pub struct AppState {
    pub pool: sqlx::PgPool,
    pub bitcoin: Arc<dyn core_notarization::BitcoinNodePort>,
    pub blink: Arc<blink::BlinkClient>,
    pub perms: Arc<dyn PermissionCheck>,
    pub mailer: Arc<dyn mailer::EmailSender>,
    pub auth: AuthSettings,
    pub billing: BillingSettings,
    pub storage: StorageSettings,
    pub runtime: RuntimeSettings,
    pub rate_limits: RateLimitSettings,
    pub rate_limiter: Arc<rate_limit::RateLimiter>,
}