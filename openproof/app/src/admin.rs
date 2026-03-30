use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum AdminError {
    #[error("AdminError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),

    #[error("AdminError - InvalidCreditAdjustment")]
    InvalidCreditAdjustment,

    #[error("AdminError - InsufficientCredits: available={available}, requested={requested}")]
    InsufficientCredits { available: i64, requested: i64 },
}

#[derive(Debug, Clone)]
pub struct AdminOverviewStats {
    pub total_users: i64,
    pub verified_users: i64,
    pub admin_users: i64,
    pub total_credit_balance: i64,
    pub pending_payment_intents: i64,
    pub stale_pending_payment_intents: i64,
    pub failed_webhook_events: i64,
}

#[derive(Debug, Clone)]
pub struct AdminUserRecord {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub role: String,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub balance_credits: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreditLedgerEntryRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub user_email: String,
    pub payment_intent_id: Option<Uuid>,
    pub kind: String,
    pub delta_credits: i64,
    pub balance_after_credits: i64,
    pub description: Option<String>,
    pub reference_type: Option<String>,
    pub reference_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct AdminPaymentIntentRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub user_email: String,
    pub package_code: String,
    pub package_name: String,
    pub amount_usd_cents: i64,
    pub credits: i64,
    pub status: String,
    pub blink_invoice_status: String,
    pub payment_hash: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub paid_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct BlinkWebhookEventRecord {
    pub id: Uuid,
    pub webhook_message_id: Option<String>,
    pub event_type: String,
    pub payment_hash: Option<String>,
    pub processed_at: Option<DateTime<Utc>>,
    pub processing_error: Option<String>,
    pub created_at: DateTime<Utc>,
}

fn row_to_admin_user(row: &sqlx::postgres::PgRow) -> AdminUserRecord {
    AdminUserRecord {
        id: row.get("id"),
        name: row.get("name"),
        email: row.get("email"),
        role: row.get("role"),
        email_verified_at: row.try_get("email_verified_at").ok().flatten(),
        balance_credits: row.get("balance_credits"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

fn row_to_ledger_entry(row: &sqlx::postgres::PgRow) -> CreditLedgerEntryRecord {
    CreditLedgerEntryRecord {
        id: row.get("id"),
        user_id: row.get("user_id"),
        user_email: row.get("user_email"),
        payment_intent_id: row.try_get("payment_intent_id").ok().flatten(),
        kind: row.get("kind"),
        delta_credits: row.get("delta_credits"),
        balance_after_credits: row.get("balance_after_credits"),
        description: row.try_get("description").ok().flatten(),
        reference_type: row.try_get("reference_type").ok().flatten(),
        reference_id: row.try_get("reference_id").ok().flatten(),
        created_at: row.get("created_at"),
    }
}

fn row_to_payment_intent(row: &sqlx::postgres::PgRow) -> AdminPaymentIntentRecord {
    AdminPaymentIntentRecord {
        id: row.get("id"),
        user_id: row.get("user_id"),
        user_email: row.get("user_email"),
        package_code: row.get("package_code"),
        package_name: row.get("package_name"),
        amount_usd_cents: row.get("amount_usd_cents"),
        credits: row.get("credits"),
        status: row.get("status"),
        blink_invoice_status: row.get("blink_invoice_status"),
        payment_hash: row.try_get("payment_hash").ok().flatten(),
        expires_at: row.try_get("expires_at").ok().flatten(),
        paid_at: row.try_get("paid_at").ok().flatten(),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

fn row_to_webhook_event(row: &sqlx::postgres::PgRow) -> BlinkWebhookEventRecord {
    BlinkWebhookEventRecord {
        id: row.get("id"),
        webhook_message_id: row.try_get("webhook_message_id").ok().flatten(),
        event_type: row.get("event_type"),
        payment_hash: row.try_get("payment_hash").ok().flatten(),
        processed_at: row.try_get("processed_at").ok().flatten(),
        processing_error: row.try_get("processing_error").ok().flatten(),
        created_at: row.get("created_at"),
    }
}

pub async fn get_overview_stats(pool: &PgPool) -> Result<AdminOverviewStats, AdminError> {
    let row = sqlx::query(
        r#"
        SELECT
            (SELECT COUNT(*) FROM users) AS total_users,
            (SELECT COUNT(*) FROM users WHERE email_verified_at IS NOT NULL) AS verified_users,
            (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admin_users,
            (SELECT COALESCE(SUM(balance_credits), 0) FROM credit_accounts) AS total_credit_balance,
            (SELECT COUNT(*) FROM payment_intents WHERE status = 'pending') AS pending_payment_intents,
            (
                SELECT COUNT(*)
                FROM payment_intents
                WHERE status = 'pending' AND created_at < NOW() - INTERVAL '15 minutes'
            ) AS stale_pending_payment_intents,
            (
                SELECT COUNT(*)
                FROM blink_webhook_events
                WHERE processing_error IS NOT NULL
            ) AS failed_webhook_events
        "#,
    )
    .fetch_one(pool)
    .await?;

    Ok(AdminOverviewStats {
        total_users: row.get("total_users"),
        verified_users: row.get("verified_users"),
        admin_users: row.get("admin_users"),
        total_credit_balance: row.get("total_credit_balance"),
        pending_payment_intents: row.get("pending_payment_intents"),
        stale_pending_payment_intents: row.get("stale_pending_payment_intents"),
        failed_webhook_events: row.get("failed_webhook_events"),
    })
}

pub async fn list_users(pool: &PgPool, limit: i64) -> Result<Vec<AdminUserRecord>, AdminError> {
    let rows = sqlx::query(
        r#"
        SELECT
            u.id,
            u.name,
            u.email,
            u.role,
            u.email_verified_at,
            COALESCE(ca.balance_credits, 0) AS balance_credits,
            u.created_at,
            u.updated_at
        FROM users u
        LEFT JOIN credit_accounts ca ON ca.user_id = u.id
        ORDER BY u.created_at DESC
        LIMIT $1
        "#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_admin_user).collect())
}

pub async fn set_user_role(
    pool: &PgPool,
    user_id: Uuid,
    role: &str,
) -> Result<Option<AdminUserRecord>, AdminError> {
    let row = sqlx::query(
        r#"
        WITH updated AS (
            UPDATE users
            SET role = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, email, role, email_verified_at, created_at, updated_at
        )
        SELECT
            updated.id,
            updated.name,
            updated.email,
            updated.role,
            updated.email_verified_at,
            COALESCE(ca.balance_credits, 0) AS balance_credits,
            updated.created_at,
            updated.updated_at
        FROM updated
        LEFT JOIN credit_accounts ca ON ca.user_id = updated.id
        "#,
    )
    .bind(user_id)
    .bind(role)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|value| row_to_admin_user(&value)))
}

pub async fn list_credit_ledger_entries(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<CreditLedgerEntryRecord>, AdminError> {
    let rows = sqlx::query(
        r#"
        SELECT
            cl.id,
            cl.user_id,
            u.email AS user_email,
            cl.payment_intent_id,
            cl.kind,
            cl.delta_credits,
            cl.balance_after_credits,
            cl.description,
            cl.reference_type,
            cl.reference_id,
            cl.created_at
        FROM credit_ledger cl
        INNER JOIN users u ON u.id = cl.user_id
        ORDER BY cl.created_at DESC
        LIMIT $1
        "#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_ledger_entry).collect())
}

pub async fn list_payment_intents(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<AdminPaymentIntentRecord>, AdminError> {
    let rows = sqlx::query(
        r#"
        SELECT
            pi.id,
            pi.user_id,
            u.email AS user_email,
            pi.package_code,
            pi.package_name,
            pi.amount_usd_cents,
            pi.credits,
            pi.status,
            pi.blink_invoice_status,
            pi.payment_hash,
            pi.expires_at,
            pi.paid_at,
            pi.created_at,
            pi.updated_at
        FROM payment_intents pi
        INNER JOIN users u ON u.id = pi.user_id
        ORDER BY pi.created_at DESC
        LIMIT $1
        "#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_payment_intent).collect())
}

pub async fn list_blink_webhook_events(
    pool: &PgPool,
    limit: i64,
    failed_only: bool,
) -> Result<Vec<BlinkWebhookEventRecord>, AdminError> {
    let rows = if failed_only {
        sqlx::query(
            r#"
            SELECT
                id,
                webhook_message_id,
                event_type,
                payment_hash,
                processed_at,
                processing_error,
                created_at
            FROM blink_webhook_events
            WHERE processing_error IS NOT NULL
            ORDER BY created_at DESC
            LIMIT $1
            "#,
        )
        .bind(limit)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query(
            r#"
            SELECT
                id,
                webhook_message_id,
                event_type,
                payment_hash,
                processed_at,
                processing_error,
                created_at
            FROM blink_webhook_events
            ORDER BY created_at DESC
            LIMIT $1
            "#,
        )
        .bind(limit)
        .fetch_all(pool)
        .await?
    };

    Ok(rows.iter().map(row_to_webhook_event).collect())
}

pub async fn adjust_user_credits(
    pool: &PgPool,
    actor_user_id: Uuid,
    user_id: Uuid,
    delta_credits: i64,
    description: &str,
) -> Result<CreditLedgerEntryRecord, AdminError> {
    if delta_credits == 0 {
        return Err(AdminError::InvalidCreditAdjustment);
    }

    let mut tx = pool.begin().await?;
    let now = Utc::now();

    sqlx::query(
        r#"
        INSERT INTO credit_accounts (user_id, balance_credits, created_at, updated_at)
        VALUES ($1, 0, $2, $2)
        ON CONFLICT (user_id) DO NOTHING
        "#,
    )
    .bind(user_id)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    let balance_row = sqlx::query(
        r#"
        SELECT balance_credits
        FROM credit_accounts
        WHERE user_id = $1
        FOR UPDATE
        "#,
    )
    .bind(user_id)
    .fetch_one(&mut *tx)
    .await?;

    let current_balance: i64 = balance_row.get("balance_credits");
    let new_balance = current_balance + delta_credits;
    if new_balance < 0 {
        tx.rollback().await?;
        return Err(AdminError::InsufficientCredits {
            available: current_balance,
            requested: delta_credits.abs(),
        });
    }

    sqlx::query(
        r#"
        UPDATE credit_accounts
        SET balance_credits = $2, updated_at = $3
        WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .bind(new_balance)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    let ledger_row = sqlx::query(
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
        VALUES ($1, $2, NULL, 'manual_adjustment', $3, $4, $5, 'admin_user', $6, $7)
        RETURNING id, user_id, payment_intent_id, kind, delta_credits, balance_after_credits, description, reference_type, reference_id, created_at
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(user_id)
    .bind(delta_credits)
    .bind(new_balance)
    .bind(description)
    .bind(actor_user_id)
    .bind(now)
    .fetch_one(&mut *tx)
    .await?;

    let user_email: String = sqlx::query_scalar("SELECT email FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(CreditLedgerEntryRecord {
        id: ledger_row.get("id"),
        user_id: ledger_row.get("user_id"),
        user_email,
        payment_intent_id: ledger_row.try_get("payment_intent_id").ok().flatten(),
        kind: ledger_row.get("kind"),
        delta_credits: ledger_row.get("delta_credits"),
        balance_after_credits: ledger_row.get("balance_after_credits"),
        description: ledger_row.try_get("description").ok().flatten(),
        reference_type: ledger_row.try_get("reference_type").ok().flatten(),
        reference_id: ledger_row.try_get("reference_id").ok().flatten(),
        created_at: ledger_row.get("created_at"),
    })
}