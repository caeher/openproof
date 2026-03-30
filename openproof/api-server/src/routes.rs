use std::sync::Arc;

use axum::routing::{get, post};
use axum::Router;

use crate::handlers::{auth, documents, transactions};
use crate::AppState;

pub fn api_router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/api/v1/auth/signup", post(auth::signup))
        .route("/api/v1/auth/login", post(auth::login))
        .route("/api/v1/auth/logout", post(auth::logout))
        .route("/api/v1/auth/forgot-password", post(auth::forgot_password))
        .route("/api/v1/auth/reset-password", post(auth::reset_password))
        .route("/api/v1/auth/verify-email", post(auth::verify_email))
        .route("/api/v1/auth/session", get(auth::session))
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
