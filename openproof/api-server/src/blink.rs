use std::sync::Arc;
use std::time::Duration;

use axum::body::Bytes;
use axum::http::HeaderMap;
use chrono::Utc;
use openproof_app::billing;
use reqwest::Client;
use serde_json::{json, Value};
use thiserror::Error;
use tracing::{error, info, warn};

#[derive(Debug, Error)]
pub enum BlinkError {
    #[error("BlinkError - NotConfigured")]
    NotConfigured,

    #[error("BlinkError - WebhookSecretMissing")]
    WebhookSecretMissing,

    #[error("BlinkError - Reqwest: {0}")]
    Reqwest(#[from] reqwest::Error),

    #[error("BlinkError - Billing: {0}")]
    Billing(#[from] billing::BillingError),

    #[error("BlinkError - Json: {0}")]
    Json(#[from] serde_json::Error),

    #[error("BlinkError - Api: {0}")]
    Api(String),

    #[error("BlinkError - WebhookVerification: {0}")]
    WebhookVerification(String),

    #[error("BlinkError - InvoiceNotFound")]
    InvoiceNotFound,
}

#[derive(Debug, Clone)]
pub struct BlinkInvoice {
    pub payment_request: String,
    pub payment_hash: String,
    pub satoshis: i64,
}

#[derive(Debug, Clone)]
pub struct BlinkInvoiceStatus {
    pub payment_request: Option<String>,
    pub payment_hash: String,
    pub payment_status: String,
    pub satoshis: Option<i64>,
}

#[derive(Clone)]
pub struct BlinkClient {
    http: Client,
    api_url: String,
    api_key: Option<String>,
    webhook_secret: Option<String>,
}

impl BlinkClient {
    pub fn new(
        api_url: String,
        api_key: Option<String>,
        webhook_secret: Option<String>,
    ) -> Result<Self, BlinkError> {
        let http = Client::builder().user_agent("openproof-api-server/0.1").build()?;
        Ok(Self {
            http,
            api_url,
            api_key,
            webhook_secret,
        })
    }

    pub fn is_configured(&self) -> bool {
        self.api_key.is_some()
    }

    pub fn verify_webhook(&self, headers: &HeaderMap, body: &Bytes) -> Result<(), BlinkError> {
        let secret = self
            .webhook_secret
            .as_deref()
            .ok_or(BlinkError::WebhookSecretMissing)?;
        let webhook = svix::webhooks::Webhook::new(secret)
            .map_err(|error| BlinkError::WebhookVerification(error.to_string()))?;
        webhook
            .verify(body, headers)
            .map_err(|error| BlinkError::WebhookVerification(error.to_string()))?;
        Ok(())
    }

    pub async fn create_usd_invoice(
        &self,
        amount_usd_cents: i64,
        memo: &str,
    ) -> Result<BlinkInvoice, BlinkError> {
        let wallet_id = self.usd_wallet_id().await?;
        let data = self
            .graphql(
                r#"
                mutation LnUsdInvoiceCreate($input: LnUsdInvoiceCreateInput!) {
                  lnUsdInvoiceCreate(input: $input) {
                    invoice {
                      paymentRequest
                      paymentHash
                      satoshis
                    }
                    errors {
                      message
                    }
                  }
                }
                "#,
                json!({
                    "input": {
                        "walletId": wallet_id,
                        "amount": amount_usd_cents.to_string(),
                        "memo": memo,
                    }
                }),
            )
            .await?;

        let response = data
            .get("lnUsdInvoiceCreate")
            .ok_or_else(|| BlinkError::Api("missing lnUsdInvoiceCreate response".to_string()))?;

        if let Some(error) = blink_errors(response) {
            return Err(BlinkError::Api(error));
        }

        let invoice = response
            .get("invoice")
            .ok_or_else(|| BlinkError::Api("missing invoice payload".to_string()))?;

        Ok(BlinkInvoice {
            payment_request: invoice_string(invoice, "paymentRequest")?,
            payment_hash: invoice_string(invoice, "paymentHash")?,
            satoshis: invoice
                .get("satoshis")
                .and_then(|value| value.as_i64())
                .unwrap_or_default(),
        })
    }

    pub async fn check_invoice_status(
        &self,
        payment_hash: &str,
    ) -> Result<BlinkInvoiceStatus, BlinkError> {
        let wallet_id = self.usd_wallet_id().await?;
        let data = self
            .graphql(
                r#"
                query InvoiceByHash($walletId: WalletId!, $paymentHash: PaymentHash!) {
                  me {
                    defaultAccount {
                      walletById(walletId: $walletId) {
                        ... on UsdWallet {
                          invoiceByPaymentHash(paymentHash: $paymentHash) {
                            ... on LnInvoice {
                              paymentHash
                              paymentRequest
                              paymentStatus
                              satoshis
                            }
                          }
                        }
                      }
                    }
                  }
                }
                "#,
                json!({
                    "walletId": wallet_id,
                    "paymentHash": payment_hash,
                }),
            )
            .await?;

        let invoice = data
            .pointer("/me/defaultAccount/walletById/invoiceByPaymentHash")
            .ok_or(BlinkError::InvoiceNotFound)?;

        if invoice.is_null() {
            return Err(BlinkError::InvoiceNotFound);
        }

        Ok(BlinkInvoiceStatus {
            payment_request: invoice
                .get("paymentRequest")
                .and_then(|value| value.as_str())
                .map(ToString::to_string),
            payment_hash: invoice_string(invoice, "paymentHash")?,
            payment_status: invoice_string(invoice, "paymentStatus")?,
            satoshis: invoice.get("satoshis").and_then(|value| value.as_i64()),
        })
    }

    async fn usd_wallet_id(&self) -> Result<String, BlinkError> {
        let data = self
            .graphql(
                r#"
                query Me {
                  me {
                    defaultAccount {
                      wallets {
                        id
                        walletCurrency
                      }
                    }
                  }
                }
                "#,
                json!({}),
            )
            .await?;

        let wallets = data
            .pointer("/me/defaultAccount/wallets")
            .and_then(|value| value.as_array())
            .ok_or_else(|| BlinkError::Api("missing wallets response".to_string()))?;

        wallets
            .iter()
            .find(|wallet| {
                wallet
                    .get("walletCurrency")
                    .and_then(|value| value.as_str())
                    == Some("USD")
            })
            .and_then(|wallet| wallet.get("id").and_then(|value| value.as_str()))
            .map(ToString::to_string)
            .ok_or_else(|| BlinkError::Api("USD wallet not found".to_string()))
    }

    async fn graphql(&self, query: &str, variables: Value) -> Result<Value, BlinkError> {
        let api_key = self.api_key.as_deref().ok_or(BlinkError::NotConfigured)?;
        let response = self
            .http
            .post(&self.api_url)
            .header("X-API-KEY", api_key)
            .json(&json!({
                "query": query,
                "variables": variables,
            }))
            .send()
            .await?
            .error_for_status()?;

        let payload: Value = response.json().await?;
        if let Some(errors) = payload.get("errors").and_then(|value| value.as_array()) {
            let message = errors
                .iter()
                .filter_map(|value| value.get("message").and_then(|message| message.as_str()))
                .collect::<Vec<_>>()
                .join(", ");
            if !message.is_empty() {
                return Err(BlinkError::Api(message));
            }
        }

        payload
            .get("data")
            .cloned()
            .ok_or_else(|| BlinkError::Api("missing GraphQL data payload".to_string()))
    }
}

pub async fn run_billing_reconcile_worker(
    pool: sqlx::PgPool,
    blink: Arc<BlinkClient>,
    interval_seconds: u64,
) {
    if !blink.is_configured() {
        info!("blink billing disabled: BLINK_API_KEY not configured");
        return;
    }

    loop {
        if let Err(error) = process_pending_payment_intents(&pool, blink.as_ref()).await {
            error!(%error, "billing reconcile batch failed");
        }
        tokio::time::sleep(Duration::from_secs(interval_seconds.max(15))).await;
    }
}

pub async fn process_pending_payment_intents(
    pool: &sqlx::PgPool,
    blink: &BlinkClient,
) -> Result<(), BlinkError> {
    let pending = billing::list_pending_payment_hashes(pool, 25).await?;

    for intent in pending {
        let Some(payment_hash) = intent.payment_hash.as_deref() else {
            continue;
        };

        match blink.check_invoice_status(payment_hash).await {
            Ok(invoice) if invoice.payment_status == "PAID" => {
                billing::mark_payment_intent_paid(pool, payment_hash).await?;
            }
            Ok(invoice) if invoice.payment_status == "EXPIRED" => {
                billing::mark_payment_intent_expired(pool, payment_hash).await?;
            }
            Ok(_) => {}
            Err(BlinkError::InvoiceNotFound)
                if intent.expires_at.map(|expires_at| expires_at < Utc::now()).unwrap_or(false) =>
            {
                billing::mark_payment_intent_expired(pool, payment_hash).await?;
            }
            Err(BlinkError::InvoiceNotFound) => {}
            Err(error) => warn!(%error, payment_hash = %payment_hash, "blink reconcile skipped payment intent"),
        }
    }

    Ok(())
}

fn blink_errors(value: &Value) -> Option<String> {
    value
        .get("errors")
        .and_then(|errors| errors.as_array())
        .filter(|errors| !errors.is_empty())
        .map(|errors| {
            errors
                .iter()
                .filter_map(|error| error.get("message").and_then(|message| message.as_str()))
                .collect::<Vec<_>>()
                .join(", ")
        })
        .filter(|message| !message.is_empty())
}

fn invoice_string(value: &Value, field: &str) -> Result<String, BlinkError> {
    value
        .get(field)
        .and_then(|field| field.as_str())
        .map(ToString::to_string)
        .ok_or_else(|| BlinkError::Api(format!("missing Blink field {field}")))
}