use std::sync::Arc;

use axum::routing::{get, post};
use axum::Router;

use crate::handlers::{documents, transactions};
use crate::AppState;

pub fn api_router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health))
        .route(
            "/api/v1/documents",
            get(documents::list).post(documents::register),
        )
        .route("/api/v1/documents/verify", post(documents::verify))
        .route(
            "/api/v1/documents/by-transaction/{txid}",
            get(documents::get_by_transaction_id),
        )
        .route("/api/v1/documents/{id}", get(documents::get_by_id))
        .route(
            "/api/v1/transactions/{txid}",
            get(transactions::get_tx),
        )
        .with_state(state)
}

async fn health() -> &'static str {
    "ok"
}
