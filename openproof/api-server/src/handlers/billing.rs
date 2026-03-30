use std::sync::Arc;

use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use openproof_app::billing::{self, BillingError};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::auth;
use crate::blink::BlinkError;
use crate::error::{err_json, ok_json};
use crate::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePaymentIntentRequest {
    pub package_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BillingOverviewResponse {
    pub account: CreditAccountResponse,
    pub packages: Vec<CreditPackageResponse>,
    pub payment_intents: Vec<PaymentIntentResponse>,
    pub document_registration_credit_cost: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreditAccountResponse {
    pub balance_credits: i64,
    pub purchased_credits: i64,
    pub consumed_credits: i64,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreditPackageResponse {
    pub id: String,
    pub code: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub price_usd_cents: i64,
    pub credits: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentIntentResponse {
    pub id: String,
    pub package_id: String,
    pub package_code: String,
    pub package_name: String,
    pub amount_usd_cents: i64,
    pub credits: i64,
    pub status: String,
    pub blink_invoice_status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_request: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_hash: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub paid_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

pub async fn overview(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> axum::response::Response {
    let session = match auth::require_verified_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    let account = match billing::get_credit_account_summary(&state.pool, session.subject.user_id).await {
        Ok(value) => value,
        Err(error) => return billing_error_response(error),
    };
    let packages = match billing::list_credit_packages(&state.pool).await {
        Ok(value) => value,
        Err(error) => return billing_error_response(error),
    };
    let payment_intents = match billing::list_payment_intents_for_user(&state.pool, session.subject.user_id, 20).await {
        Ok(value) => value,
        Err(error) => return billing_error_response(error),
    };

    ok_json(BillingOverviewResponse {
        account: CreditAccountResponse {
            balance_credits: account.balance_credits,
            purchased_credits: account.purchased_credits,
            consumed_credits: account.consumed_credits,
            updated_at: account.updated_at,
        },
        packages: packages.iter().map(map_package).collect(),
        payment_intents: payment_intents.iter().map(map_payment_intent).collect(),
        document_registration_credit_cost: state.billing.document_registration_credit_cost,
    })
}

pub async fn public_packages(
    State(state): State<Arc<AppState>>,
) -> axum::response::Response {
    let packages = match billing::list_credit_packages(&state.pool).await {
        Ok(value) => value,
        Err(error) => return billing_error_response(error),
    };

    ok_json(packages.iter().map(map_package).collect::<Vec<_>>())
}

pub async fn create_payment_intent(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(body): Json<CreatePaymentIntentRequest>,
) -> axum::response::Response {
    let session = match auth::require_verified_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    if !state.blink.is_configured() {
        return err_json(StatusCode::SERVICE_UNAVAILABLE, "blink billing is not configured");
    }

    let Ok(package_id) = Uuid::parse_str(&body.package_id) else {
        return err_json(StatusCode::BAD_REQUEST, "invalid package id");
    };

    let package = match billing::find_credit_package_by_id(&state.pool, package_id).await {
        Ok(Some(value)) => value,
        Ok(None) => return err_json(StatusCode::NOT_FOUND, "credit package not found"),
        Err(error) => return billing_error_response(error),
    };

    let memo = format!("OpenProof {} credits", package.name);
    let invoice = match state.blink.create_usd_invoice(package.price_usd_cents, &memo).await {
        Ok(value) => value,
        Err(error) => return blink_error_response(error),
    };

    let payment_intent = match billing::create_payment_intent(
        &state.pool,
        session.subject.user_id,
        &package,
        &invoice.payment_request,
        &invoice.payment_hash,
        Some(chrono::Utc::now() + chrono::Duration::minutes(5)),
    )
    .await
    {
        Ok(value) => value,
        Err(error) => return billing_error_response(error),
    };

    auth::json_with_cookie(StatusCode::CREATED, map_payment_intent(&payment_intent), None)
}

pub async fn reconcile_payment_intent(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> axum::response::Response {
    let session = match auth::require_verified_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    if !state.blink.is_configured() {
        return err_json(StatusCode::SERVICE_UNAVAILABLE, "blink billing is not configured");
    }

    let Ok(payment_intent_id) = Uuid::parse_str(&id) else {
        return err_json(StatusCode::BAD_REQUEST, "invalid payment intent id");
    };

    let payment_intent = match billing::find_payment_intent_for_user(&state.pool, session.subject.user_id, payment_intent_id).await {
        Ok(Some(value)) => value,
        Ok(None) => return err_json(StatusCode::NOT_FOUND, "payment intent not found"),
        Err(error) => return billing_error_response(error),
    };

    let Some(payment_hash) = payment_intent.payment_hash.clone() else {
        return err_json(StatusCode::BAD_REQUEST, "payment intent has no payment hash");
    };

    let invoice_status = match state.blink.check_invoice_status(&payment_hash).await {
        Ok(value) => value,
        Err(BlinkError::InvoiceNotFound)
            if payment_intent
                .expires_at
                .map(|expires_at| expires_at < chrono::Utc::now())
                .unwrap_or(false) =>
        {
            match billing::mark_payment_intent_expired(&state.pool, &payment_hash).await {
                Ok(Some(value)) => return ok_json(map_payment_intent(&value)),
                Ok(None) => return err_json(StatusCode::NOT_FOUND, "payment intent not found"),
                Err(error) => return billing_error_response(error),
            }
        }
        Err(error) => return blink_error_response(error),
    };

    let updated = match invoice_status.payment_status.as_str() {
        "PAID" => match billing::mark_payment_intent_paid(&state.pool, &payment_hash).await {
            Ok(Some(value)) => value,
            Ok(None) => return err_json(StatusCode::NOT_FOUND, "payment intent not found"),
            Err(error) => return billing_error_response(error),
        },
        "EXPIRED" => match billing::mark_payment_intent_expired(&state.pool, &payment_hash).await {
            Ok(Some(value)) => value,
            Ok(None) => return err_json(StatusCode::NOT_FOUND, "payment intent not found"),
            Err(error) => return billing_error_response(error),
        },
        _ => payment_intent,
    };

    ok_json(map_payment_intent(&updated))
}

pub async fn blink_webhook(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    body: Bytes,
) -> axum::response::Response {
    if let Err(error) = state.blink.verify_webhook(&headers, &body) {
        return blink_error_response(error);
    }

    let payload: Value = match serde_json::from_slice(&body) {
        Ok(value) => value,
        Err(error) => return err_json(StatusCode::BAD_REQUEST, format!("invalid webhook json: {error}")),
    };

    let event_type = payload
        .get("eventType")
        .and_then(|value| value.as_str())
        .unwrap_or("unknown");
    let payment_hash = payload
        .pointer("/transaction/initiationVia/paymentHash")
        .and_then(|value| value.as_str());
    let webhook_message_id = headers.get("svix-id").and_then(|value| value.to_str().ok());

    let Some(webhook_event_id) = (match billing::begin_blink_webhook_event(
        &state.pool,
        webhook_message_id,
        event_type,
        payment_hash,
        &payload,
    )
    .await
    {
        Ok(value) => value,
        Err(error) => return billing_error_response(error),
    }) else {
        return StatusCode::OK.into_response();
    };

    let processing_result = process_blink_webhook_payload(&state, &payload).await;
    let processing_error = processing_result.as_ref().err().map(|error| error.to_string());

    if let Err(error) = billing::complete_blink_webhook_event(
        &state.pool,
        webhook_event_id,
        processing_error.as_deref(),
    )
    .await
    {
        return billing_error_response(error);
    }

    match processing_result {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(error) => blink_error_response(error),
    }
}

async fn process_blink_webhook_payload(
    state: &Arc<AppState>,
    payload: &Value,
) -> Result<(), BlinkError> {
    let event_type = payload
        .get("eventType")
        .and_then(|value| value.as_str())
        .unwrap_or_default();
    let transaction_status = payload
        .pointer("/transaction/status")
        .and_then(|value| value.as_str())
        .unwrap_or_default();
    let payment_hash = payload
        .pointer("/transaction/initiationVia/paymentHash")
        .and_then(|value| value.as_str());

    if event_type == "receive.lightning" && transaction_status.eq_ignore_ascii_case("success") {
        if let Some(payment_hash) = payment_hash {
            billing::mark_payment_intent_paid(&state.pool, payment_hash).await?;
        }
    }

    Ok(())
}

fn map_package(package: &billing::CreditPackageRecord) -> CreditPackageResponse {
    CreditPackageResponse {
        id: package.id.to_string(),
        code: package.code.clone(),
        name: package.name.clone(),
        description: package.description.clone(),
        price_usd_cents: package.price_usd_cents,
        credits: package.credits,
    }
}

fn map_payment_intent(payment_intent: &billing::PaymentIntentRecord) -> PaymentIntentResponse {
    PaymentIntentResponse {
        id: payment_intent.id.to_string(),
        package_id: payment_intent.package_id.to_string(),
        package_code: payment_intent.package_code.clone(),
        package_name: payment_intent.package_name.clone(),
        amount_usd_cents: payment_intent.amount_usd_cents,
        credits: payment_intent.credits,
        status: payment_intent.status.clone(),
        blink_invoice_status: payment_intent.blink_invoice_status.clone(),
        payment_request: payment_intent.payment_request.clone(),
        payment_hash: payment_intent.payment_hash.clone(),
        expires_at: payment_intent.expires_at,
        paid_at: payment_intent.paid_at,
        created_at: payment_intent.created_at,
        updated_at: payment_intent.updated_at,
    }
}

fn billing_error_response(error: BillingError) -> axum::response::Response {
    match error {
        BillingError::CreditPackageNotFound | BillingError::PaymentIntentNotFound => {
            err_json(StatusCode::NOT_FOUND, error.to_string())
        }
        BillingError::InsufficientCredits { required, available } => err_json(
            StatusCode::PAYMENT_REQUIRED,
            format!("insufficient credits: required {required}, available {available}"),
        ),
        _ => err_json(StatusCode::INTERNAL_SERVER_ERROR, error.to_string()),
    }
}

fn blink_error_response(error: BlinkError) -> axum::response::Response {
    match error {
        BlinkError::WebhookSecretMissing => {
            err_json(StatusCode::SERVICE_UNAVAILABLE, "blink webhook secret is not configured")
        }
        BlinkError::WebhookVerification(_) => err_json(StatusCode::BAD_REQUEST, error.to_string()),
        BlinkError::NotConfigured => err_json(StatusCode::SERVICE_UNAVAILABLE, "blink billing is not configured"),
        BlinkError::InvoiceNotFound => err_json(StatusCode::NOT_FOUND, error.to_string()),
        BlinkError::Api(_) => err_json(StatusCode::BAD_GATEWAY, error.to_string()),
        _ => err_json(StatusCode::BAD_GATEWAY, error.to_string()),
    }
}