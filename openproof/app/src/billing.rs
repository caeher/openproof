use chrono::{DateTime, Duration, Utc};
use core_document::{ready_for_notarization, Document, NewDocument};
use sqlx::{PgPool, Row};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum BillingError {
    #[error("BillingError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),

    #[error("BillingError - Json: {0}")]
    Json(#[from] serde_json::Error),

    #[error("BillingError - CreditPackageNotFound")]
    CreditPackageNotFound,

    #[error("BillingError - PaymentIntentNotFound")]
    PaymentIntentNotFound,

    #[error("BillingError - InsufficientCredits: required={required}, available={available}")]
    InsufficientCredits { required: i64, available: i64 },
}

#[derive(Debug, Clone)]
pub struct CreditAccountSummary {
    pub user_id: Uuid,
    pub balance_credits: i64,
    pub purchased_credits: i64,
    pub consumed_credits: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreditPackageRecord {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub price_usd_cents: i64,
    pub credits: i64,
    pub active: bool,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct PaymentIntentRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub package_id: Uuid,
    pub package_code: String,
    pub package_name: String,
    pub amount_usd_cents: i64,
    pub credits: i64,
    pub status: String,
    pub blink_invoice_status: String,
    pub payment_request: Option<String>,
    pub payment_hash: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub paid_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

fn row_to_document(row: &sqlx::postgres::PgRow) -> Document {
    Document {
        id: row.get::<Uuid, _>("id").to_string(),
        file_hash: row.get("file_hash"),
        filename: row.get("filename"),
        metadata: row.try_get::<Option<serde_json::Value>, _>("metadata").ok().flatten(),
        user_id: row.get("user_id"),
        transaction_id: row.try_get("transaction_id").ok().flatten(),
        block_height: row.try_get("block_height").ok().flatten(),
        timestamp: row.try_get("chain_timestamp").ok().flatten(),
        confirmations: row.try_get("confirmations").ok().flatten(),
        status: row.get("status"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        failure_reason: row.try_get("failure_reason").ok().flatten(),
    }
}

fn row_to_package(row: &sqlx::postgres::PgRow) -> CreditPackageRecord {
    CreditPackageRecord {
        id: row.get("id"),
        code: row.get("code"),
        name: row.get("name"),
        description: row.try_get("description").ok().flatten(),
        price_usd_cents: row.get("price_usd_cents"),
        credits: row.get("credits"),
        active: row.get("active"),
        sort_order: row.get("sort_order"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

fn row_to_payment_intent(row: &sqlx::postgres::PgRow) -> PaymentIntentRecord {
    PaymentIntentRecord {
        id: row.get("id"),
        user_id: row.get("user_id"),
        package_id: row.get("package_id"),
        package_code: row.get("package_code"),
        package_name: row.get("package_name"),
        amount_usd_cents: row.get("amount_usd_cents"),
        credits: row.get("credits"),
        status: row.get("status"),
        blink_invoice_status: row.get("blink_invoice_status"),
        payment_request: row.try_get("payment_request").ok().flatten(),
        payment_hash: row.try_get("payment_hash").ok().flatten(),
        expires_at: row.try_get("expires_at").ok().flatten(),
        paid_at: row.try_get("paid_at").ok().flatten(),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

pub async fn get_credit_account_summary(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<CreditAccountSummary, BillingError> {
    ensure_credit_account(pool, user_id).await?;

    let row = sqlx::query(
        r#"
        SELECT
            ca.user_id,
            ca.balance_credits,
            ca.created_at,
            ca.updated_at,
            COALESCE((
                SELECT SUM(delta_credits)::BIGINT
                FROM credit_ledger cl
                WHERE cl.user_id = ca.user_id AND cl.delta_credits > 0
            ), 0) AS purchased_credits,
            COALESCE((
                SELECT SUM(ABS(delta_credits))::BIGINT
                FROM credit_ledger cl
                WHERE cl.user_id = ca.user_id AND cl.delta_credits < 0
            ), 0) AS consumed_credits
        FROM credit_accounts ca
        WHERE ca.user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(CreditAccountSummary {
        user_id: row.get("user_id"),
        balance_credits: row.get("balance_credits"),
        purchased_credits: row.get("purchased_credits"),
        consumed_credits: row.get("consumed_credits"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}

pub async fn list_credit_packages(pool: &PgPool) -> Result<Vec<CreditPackageRecord>, BillingError> {
    let rows = sqlx::query(
        r#"
        SELECT id, code, name, description, price_usd_cents, credits, active, sort_order, created_at, updated_at
        FROM credit_packages
        WHERE active = TRUE
        ORDER BY sort_order ASC, created_at ASC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_package).collect())
}

pub async fn find_credit_package_by_id(
    pool: &PgPool,
    package_id: Uuid,
) -> Result<Option<CreditPackageRecord>, BillingError> {
    let row = sqlx::query(
        r#"
        SELECT id, code, name, description, price_usd_cents, credits, active, sort_order, created_at, updated_at
        FROM credit_packages
        WHERE id = $1 AND active = TRUE
        "#,
    )
    .bind(package_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|value| row_to_package(&value)))
}

pub async fn list_payment_intents_for_user(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
) -> Result<Vec<PaymentIntentRecord>, BillingError> {
    let rows = sqlx::query(
        r#"
        SELECT
            id,
            user_id,
            package_id,
            package_code,
            package_name,
            amount_usd_cents,
            credits,
            status,
            blink_invoice_status,
            payment_request,
            payment_hash,
            expires_at,
            paid_at,
            created_at,
            updated_at
        FROM payment_intents
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        "#,
    )
    .bind(user_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_payment_intent).collect())
}

pub async fn find_payment_intent_for_user(
    pool: &PgPool,
    user_id: Uuid,
    payment_intent_id: Uuid,
) -> Result<Option<PaymentIntentRecord>, BillingError> {
    let row = sqlx::query(
        r#"
        SELECT
            id,
            user_id,
            package_id,
            package_code,
            package_name,
            amount_usd_cents,
            credits,
            status,
            blink_invoice_status,
            payment_request,
            payment_hash,
            expires_at,
            paid_at,
            created_at,
            updated_at
        FROM payment_intents
        WHERE user_id = $1 AND id = $2
        "#,
    )
    .bind(user_id)
    .bind(payment_intent_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|value| row_to_payment_intent(&value)))
}

pub async fn create_payment_intent(
    pool: &PgPool,
    user_id: Uuid,
    package: &CreditPackageRecord,
    payment_request: &str,
    payment_hash: &str,
    expires_at: Option<DateTime<Utc>>,
) -> Result<PaymentIntentRecord, BillingError> {
    ensure_credit_account(pool, user_id).await?;

    let now = Utc::now();
    let row = sqlx::query(
        r#"
        INSERT INTO payment_intents (
            id,
            user_id,
            package_id,
            package_code,
            package_name,
            amount_usd_cents,
            credits,
            status,
            blink_invoice_status,
            payment_request,
            payment_hash,
            expires_at,
            paid_at,
            created_at,
            updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'PENDING', $8, $9, $10, NULL, $11, $12)
        RETURNING
            id,
            user_id,
            package_id,
            package_code,
            package_name,
            amount_usd_cents,
            credits,
            status,
            blink_invoice_status,
            payment_request,
            payment_hash,
            expires_at,
            paid_at,
            created_at,
            updated_at
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(user_id)
    .bind(package.id)
    .bind(&package.code)
    .bind(&package.name)
    .bind(package.price_usd_cents)
    .bind(package.credits)
    .bind(payment_request)
    .bind(payment_hash)
    .bind(expires_at.unwrap_or_else(|| now + Duration::minutes(5)))
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await?;

    Ok(row_to_payment_intent(&row))
}

pub async fn list_pending_payment_hashes(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<PaymentIntentRecord>, BillingError> {
    let rows = sqlx::query(
        r#"
        SELECT
            id,
            user_id,
            package_id,
            package_code,
            package_name,
            amount_usd_cents,
            credits,
            status,
            blink_invoice_status,
            payment_request,
            payment_hash,
            expires_at,
            paid_at,
            created_at,
            updated_at
        FROM payment_intents
        WHERE status = 'pending' AND payment_hash IS NOT NULL
        ORDER BY created_at ASC
        LIMIT $1
        "#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_payment_intent).collect())
}

pub async fn mark_payment_intent_paid(
    pool: &PgPool,
    payment_hash: &str,
) -> Result<Option<PaymentIntentRecord>, BillingError> {
    let mut tx = pool.begin().await?;
    let intent_row = sqlx::query(
        r#"
        SELECT
            id,
            user_id,
            package_id,
            package_code,
            package_name,
            amount_usd_cents,
            credits,
            status,
            blink_invoice_status,
            payment_request,
            payment_hash,
            expires_at,
            paid_at,
            created_at,
            updated_at
        FROM payment_intents
        WHERE payment_hash = $1
        FOR UPDATE
        "#,
    )
    .bind(payment_hash)
    .fetch_optional(&mut *tx)
    .await?;

    let Some(intent_row) = intent_row else {
        tx.rollback().await?;
        return Ok(None);
    };

    let intent = row_to_payment_intent(&intent_row);
    if intent.status == "paid" {
        tx.commit().await?;
        return Ok(Some(intent));
    }

    ensure_credit_account_tx(&mut tx, intent.user_id).await?;

    let account_row = sqlx::query(
        r#"
        SELECT balance_credits
        FROM credit_accounts
        WHERE user_id = $1
        FOR UPDATE
        "#,
    )
    .bind(intent.user_id)
    .fetch_one(&mut *tx)
    .await?;

    let current_balance: i64 = account_row.get("balance_credits");
    let new_balance = current_balance + intent.credits;
    let now = Utc::now();

    sqlx::query(
        r#"
        UPDATE credit_accounts
        SET balance_credits = $2, updated_at = $3
        WHERE user_id = $1
        "#,
    )
    .bind(intent.user_id)
    .bind(new_balance)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO credit_ledger (
            id,
            user_id,
            payment_intent_id,
            kind,
            delta_credits,
            balance_after_credits,
            description,
            reference_type,
            reference_id,
            created_at
        )
        VALUES ($1, $2, $3, 'purchase', $4, $5, $6, 'payment_intent', $3, $7)
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(intent.user_id)
    .bind(intent.id)
    .bind(intent.credits)
    .bind(new_balance)
    .bind(format!("Credits purchased via {}", intent.package_name))
    .bind(now)
    .execute(&mut *tx)
    .await?;

    let updated_row = sqlx::query(
        r#"
        UPDATE payment_intents
        SET status = 'paid', blink_invoice_status = 'PAID', paid_at = COALESCE(paid_at, $2), updated_at = $2
        WHERE id = $1
        RETURNING
            id,
            user_id,
            package_id,
            package_code,
            package_name,
            amount_usd_cents,
            credits,
            status,
            blink_invoice_status,
            payment_request,
            payment_hash,
            expires_at,
            paid_at,
            created_at,
            updated_at
        "#,
    )
    .bind(intent.id)
    .bind(now)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Some(row_to_payment_intent(&updated_row)))
}

pub async fn mark_payment_intent_expired(
    pool: &PgPool,
    payment_hash: &str,
) -> Result<Option<PaymentIntentRecord>, BillingError> {
    let now = Utc::now();
    let row = sqlx::query(
        r#"
        UPDATE payment_intents
        SET status = CASE WHEN status = 'pending' THEN 'expired' ELSE status END,
            blink_invoice_status = CASE WHEN status = 'pending' THEN 'EXPIRED' ELSE blink_invoice_status END,
            updated_at = $2
        WHERE payment_hash = $1
        RETURNING
            id,
            user_id,
            package_id,
            package_code,
            package_name,
            amount_usd_cents,
            credits,
            status,
            blink_invoice_status,
            payment_request,
            payment_hash,
            expires_at,
            paid_at,
            created_at,
            updated_at
        "#,
    )
    .bind(payment_hash)
    .bind(now)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|value| row_to_payment_intent(&value)))
}

pub async fn register_document_with_credits(
    pool: &PgPool,
    new: NewDocument,
    document_registration_credit_cost: i64,
) -> Result<Document, BillingError> {
    let mut tx = pool.begin().await?;

    ensure_credit_account_tx(&mut tx, new.user_id).await?;

    let balance_row = sqlx::query(
        r#"
        SELECT balance_credits
        FROM credit_accounts
        WHERE user_id = $1
        FOR UPDATE
        "#,
    )
    .bind(new.user_id)
    .fetch_one(&mut *tx)
    .await?;

    let available_credits: i64 = balance_row.get("balance_credits");
    if available_credits < document_registration_credit_cost {
        tx.rollback().await?;
        return Err(BillingError::InsufficientCredits {
            required: document_registration_credit_cost,
            available: available_credits,
        });
    }

    let id = new.id;
    let doc = new.into_document_row();
    let inserted = sqlx::query(
        r#"
        INSERT INTO documents (
            id, created_at, updated_at, file_hash, filename, user_id, metadata, status,
            transaction_id, block_height, confirmations, chain_timestamp, failure_reason
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
        "#,
    )
    .bind(id.0)
    .bind(doc.created_at)
    .bind(doc.updated_at)
    .bind(&doc.file_hash)
    .bind(&doc.filename)
    .bind(doc.user_id)
    .bind(&doc.metadata)
    .bind(&doc.status)
    .bind(&doc.transaction_id)
    .bind(doc.block_height)
    .bind(doc.confirmations)
    .bind(doc.timestamp)
    .bind(&doc.failure_reason)
    .fetch_one(&mut *tx)
    .await?;

    let document = row_to_document(&inserted);
    let new_balance = available_credits - document_registration_credit_cost;
    let now = Utc::now();

    sqlx::query(
        r#"
        UPDATE credit_accounts
        SET balance_credits = $2, updated_at = $3
        WHERE user_id = $1
        "#,
    )
    .bind(document.user_id)
    .bind(new_balance)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO credit_ledger (
            id,
            user_id,
            payment_intent_id,
            kind,
            delta_credits,
            balance_after_credits,
            description,
            reference_type,
            reference_id,
            created_at
        )
        VALUES ($1, $2, NULL, 'document_registration', $3, $4, $5, 'document', $6, $7)
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(document.user_id)
    .bind(-document_registration_credit_cost)
    .bind(new_balance)
    .bind(format!("Credits consumed to register {}", document.filename))
    .bind(id.0)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    let event = ready_for_notarization(&document);
    let payload = serde_json::to_value(&event)?;
    sqlx::query(
        r#"
        INSERT INTO outbox (document_id, payload)
        VALUES ($1, $2)
        "#,
    )
    .bind(id.0)
    .bind(payload)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(document)
}

pub async fn begin_blink_webhook_event(
    pool: &PgPool,
    webhook_message_id: Option<&str>,
    event_type: &str,
    payment_hash: Option<&str>,
    payload: &serde_json::Value,
) -> Result<Option<Uuid>, BillingError> {
    let row = sqlx::query(
        r#"
        INSERT INTO blink_webhook_events (
            id,
            webhook_message_id,
            event_type,
            payment_hash,
            payload,
            processed_at,
            processing_error,
            created_at
        )
        VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6)
        ON CONFLICT (webhook_message_id) DO NOTHING
        RETURNING id
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(webhook_message_id)
    .bind(event_type)
    .bind(payment_hash)
    .bind(payload)
    .bind(Utc::now())
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|value| value.get("id")))
}

pub async fn complete_blink_webhook_event(
    pool: &PgPool,
    webhook_event_id: Uuid,
    processing_error: Option<&str>,
) -> Result<(), BillingError> {
    sqlx::query(
        r#"
        UPDATE blink_webhook_events
        SET processed_at = $2, processing_error = $3
        WHERE id = $1
        "#,
    )
    .bind(webhook_event_id)
    .bind(Utc::now())
    .bind(processing_error)
    .execute(pool)
    .await?;
    Ok(())
}

async fn ensure_credit_account(pool: &PgPool, user_id: Uuid) -> Result<(), BillingError> {
    sqlx::query(
        r#"
        INSERT INTO credit_accounts (user_id, balance_credits, created_at, updated_at)
        VALUES ($1, 0, $2, $2)
        ON CONFLICT (user_id) DO NOTHING
        "#,
    )
    .bind(user_id)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    Ok(())
}

async fn ensure_credit_account_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
) -> Result<(), BillingError> {
    sqlx::query(
        r#"
        INSERT INTO credit_accounts (user_id, balance_credits, created_at, updated_at)
        VALUES ($1, 0, $2, $2)
        ON CONFLICT (user_id) DO NOTHING
        "#,
    )
    .bind(user_id)
    .bind(Utc::now())
    .execute(&mut **tx)
    .await?;
    Ok(())
}