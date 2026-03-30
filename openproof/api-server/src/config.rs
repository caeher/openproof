#[derive(Clone, Debug)]
pub struct AppConfig {
    pub database_url: String,
    pub bitcoin_rpc_url: String,
    pub bitcoin_rpc_user: String,
    pub bitcoin_rpc_password: String,
    pub listen_addr: String,
}

impl AppConfig {
    pub fn from_env() -> Result<Self, String> {
        Ok(Self {
            database_url: std::env::var("DATABASE_URL").map_err(|_| "DATABASE_URL")?,
            bitcoin_rpc_url: std::env::var("BITCOIN_RPC_URL")
                .unwrap_or_else(|_| "http://127.0.0.1:18332".to_string()),
            bitcoin_rpc_user: std::env::var("BITCOIN_RPC_USER").unwrap_or_default(),
            bitcoin_rpc_password: std::env::var("BITCOIN_RPC_PASSWORD").unwrap_or_default(),
            listen_addr: std::env::var("LISTEN_ADDR").unwrap_or_else(|_| "0.0.0.0:3000".to_string()),
        })
    }
}
