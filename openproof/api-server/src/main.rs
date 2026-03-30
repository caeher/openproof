use std::sync::Arc;

use axum::http::Method;
use lib_bitcoin_rpc::BitcoinRpcAdapter;
use openproof_app::workers;
use openproof_app::OpenProofApp;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::EnvFilter;

mod config;
mod error;
mod handlers;
mod routes;

pub struct AppState {
    pub pool: sqlx::PgPool,
    pub bitcoin: Arc<dyn core_notarization::BitcoinNodePort>,
}

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

    let app = match OpenProofApp::connect(&cfg.database_url).await {
        Ok(a) => a,
        Err(e) => {
            eprintln!("database: {e}");
            std::process::exit(1);
        }
    };

    let pool = app.pool.clone();
    tokio::spawn(workers::run_outbox_worker(pool, bitcoin.clone()));

    let state = Arc::new(AppState {
        pool: app.pool,
        bitcoin,
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
