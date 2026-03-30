use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct AuditEventRecord {
    pub id: Uuid,
    pub actor_user_id: Option<Uuid>,
    pub actor_email: Option<String>,
    pub actor_role: Option<String>,
    pub action: String,
    pub target_type: Option<String>,
    pub target_id: Option<String>,
    pub status: String,
    pub message: Option<String>,
    pub metadata: Option<Value>,
    pub created_at: DateTime<Utc>,
}

pub struct NewAuditEvent<'a> {
    pub actor_user_id: Option<Uuid>,
    pub actor_email: Option<&'a str>,
    pub actor_role: Option<&'a str>,
    pub action: &'a str,
    pub target_type: Option<&'a str>,
    pub target_id: Option<&'a str>,
    pub status: &'a str,
    pub message: Option<&'a str>,
    pub metadata: Option<Value>,
}

fn row_to_audit_event(row: &sqlx::postgres::PgRow) -> AuditEventRecord {
    AuditEventRecord {
        id: row.get("id"),
        actor_user_id: row.try_get("actor_user_id").ok().flatten(),
        actor_email: row.try_get("actor_email").ok().flatten(),
        actor_role: row.try_get("actor_role").ok().flatten(),
        action: row.get("action"),
        target_type: row.try_get("target_type").ok().flatten(),
        target_id: row.try_get("target_id").ok().flatten(),
        status: row.get("status"),
        message: row.try_get("message").ok().flatten(),
        metadata: row.try_get("metadata").ok().flatten(),
        created_at: row.get("created_at"),
    }
}

pub async fn record_event(
    pool: &PgPool,
    event: NewAuditEvent<'_>,
) -> Result<AuditEventRecord, sqlx::Error> {
    let row = sqlx::query(
        r#"
        INSERT INTO audit_events (
            id,
            actor_user_id,
            actor_email,
            actor_role,
            action,
            target_type,
            target_id,
            status,
            message,
            metadata,
            created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING
            id,
            actor_user_id,
            actor_email,
            actor_role,
            action,
            target_type,
            target_id,
            status,
            message,
            metadata,
            created_at
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(event.actor_user_id)
    .bind(event.actor_email)
    .bind(event.actor_role)
    .bind(event.action)
    .bind(event.target_type)
    .bind(event.target_id)
    .bind(event.status)
    .bind(event.message)
    .bind(event.metadata)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;

    Ok(row_to_audit_event(&row))
}

pub async fn list_audit_events(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<AuditEventRecord>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            id,
            actor_user_id,
            actor_email,
            actor_role,
            action,
            target_type,
            target_id,
            status,
            message,
            metadata,
            created_at
        FROM audit_events
        ORDER BY created_at DESC
        LIMIT $1
        "#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_audit_event).collect())
}