use std::sync::Arc;

use axum::middleware;
use axum::routing::{get, post};
use axum::Router;

use crate::handlers::{account, admin, auth, billing, developers, documents, transactions};
use crate::AppState;
use crate::rate_limit;

pub fn api_router(state: Arc<AppState>) -> Router {
    let auth_routes = Router::new()
        .route("/api/v1/auth/signup", post(auth::signup))
        .route("/api/v1/auth/login", post(auth::login))
        .route("/api/v1/auth/logout", post(auth::logout))
        .route("/api/v1/auth/forgot-password", post(auth::forgot_password))
        .route("/api/v1/auth/reset-password", post(auth::reset_password))
        .route("/api/v1/auth/verify-email", post(auth::verify_email))
        .route("/api/v1/auth/session", get(auth::session))
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            rate_limit::auth_rate_limit,
        ));

    let verify_routes = Router::new()
        .route("/api/v1/documents/verify", post(documents::verify))
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            rate_limit::verify_rate_limit,
        ));

    let webhook_routes = Router::new()
        .route("/api/v1/billing/blink/webhook", post(billing::blink_webhook))
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            rate_limit::webhook_rate_limit,
        ));

    Router::new()
        .route("/health", get(health))
        .merge(auth_routes)
        .route(
            "/api/v1/developers/api-keys",
            get(developers::list_api_keys).post(developers::create_api_key),
        )
        .route(
            "/api/v1/developers/api-keys/{id}/revoke",
            post(developers::revoke_api_key),
        )
        .route(
            "/api/v1/developers/api-keys/{id}/rotate",
            post(developers::rotate_api_key),
        )
        .route("/api/v1/billing/overview", get(billing::overview))
        .route(
            "/api/v1/billing/payment-intents",
            post(billing::create_payment_intent),
        )
        .route(
            "/api/v1/billing/payment-intents/{id}/reconcile",
            post(billing::reconcile_payment_intent),
        )
        .route("/api/v1/billing/packages", get(billing::public_packages))
        .route("/api/v1/account/profile", get(account::profile))
        .route(
            "/api/v1/account/change-password",
            post(account::change_password),
        )
        .route("/api/v1/admin/overview", get(admin::overview))
        .route("/api/v1/admin/users", get(admin::list_users))
        .route(
            "/api/v1/admin/users/{id}/role",
            post(admin::update_user_role),
        )
        .route("/api/v1/admin/ledger", get(admin::list_ledger))
        .route("/api/v1/admin/payments", get(admin::list_payments))
        .route("/api/v1/admin/webhooks", get(admin::list_webhooks))
        .route("/api/v1/admin/audit-events", get(admin::list_audit_events))
        .route(
            "/api/v1/admin/credits/adjust",
            post(admin::adjust_credits),
        )
        .route(
            "/api/v1/documents",
            get(documents::list).post(documents::register),
        )
        .merge(verify_routes)
        .merge(webhook_routes)
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
