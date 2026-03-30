#[derive(Clone, Debug)]
pub struct AppConfig {
    pub database_url: String,
    pub bitcoin_rpc_url: String,
    pub bitcoin_rpc_user: String,
    pub bitcoin_rpc_password: String,
    pub blink_api_url: String,
    pub blink_api_key: Option<String>,
    pub blink_webhook_secret: Option<String>,
    pub billing_reconcile_interval_seconds: u64,
    pub document_registration_credit_cost: i64,
    pub listen_addr: String,
    pub app_base_url: String,
    pub session_cookie_name: String,
    pub session_ttl_hours: i64,
    pub verification_token_ttl_hours: i64,
    pub password_reset_token_ttl_hours: i64,
    pub secure_cookies: bool,
    pub expose_dev_auth_tokens: bool,
}

impl AppConfig {
    pub fn from_env() -> Result<Self, String> {
        Ok(Self {
            database_url: std::env::var("DATABASE_URL").map_err(|_| "DATABASE_URL")?,
            bitcoin_rpc_url: std::env::var("BITCOIN_RPC_URL")
                .unwrap_or_else(|_| "http://127.0.0.1:18332".to_string()),
            bitcoin_rpc_user: std::env::var("BITCOIN_RPC_USER").unwrap_or_default(),
            bitcoin_rpc_password: std::env::var("BITCOIN_RPC_PASSWORD").unwrap_or_default(),
            blink_api_url: std::env::var("BLINK_API_URL")
                .unwrap_or_else(|_| "https://api.blink.sv/graphql".to_string()),
            blink_api_key: std::env::var("BLINK_API_KEY").ok().filter(|value| !value.trim().is_empty()),
            blink_webhook_secret: std::env::var("BLINK_WEBHOOK_SECRET").ok().filter(|value| !value.trim().is_empty()),
            billing_reconcile_interval_seconds: std::env::var("BILLING_RECONCILE_INTERVAL_SECONDS")
                .ok()
                .and_then(|value| value.parse::<u64>().ok())
                .unwrap_or(60),
            document_registration_credit_cost: std::env::var("DOCUMENT_REGISTRATION_CREDIT_COST")
                .ok()
                .and_then(|value| value.parse::<i64>().ok())
                .unwrap_or(1),
            listen_addr: std::env::var("LISTEN_ADDR").unwrap_or_else(|_| "0.0.0.0:3000".to_string()),
            app_base_url: std::env::var("APP_BASE_URL").unwrap_or_else(|_| "http://localhost:3000".to_string()),
            session_cookie_name: std::env::var("SESSION_COOKIE_NAME")
                .unwrap_or_else(|_| "openproof_session".to_string()),
            session_ttl_hours: std::env::var("SESSION_TTL_HOURS")
                .ok()
                .and_then(|value| value.parse::<i64>().ok())
                .unwrap_or(24 * 30),
            verification_token_ttl_hours: std::env::var("VERIFICATION_TOKEN_TTL_HOURS")
                .ok()
                .and_then(|value| value.parse::<i64>().ok())
                .unwrap_or(24),
            password_reset_token_ttl_hours: std::env::var("PASSWORD_RESET_TOKEN_TTL_HOURS")
                .ok()
                .and_then(|value| value.parse::<i64>().ok())
                .unwrap_or(2),
            secure_cookies: std::env::var("SECURE_COOKIES")
                .ok()
                .map(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "YES"))
                .unwrap_or(false),
            expose_dev_auth_tokens: std::env::var("EXPOSE_DEV_AUTH_TOKENS")
                .ok()
                .map(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "YES"))
                .unwrap_or(true),
        })
    }
}
