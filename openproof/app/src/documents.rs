use chrono::{DateTime, Utc};
use core_document::{Document, DocumentId, NewDocument};
use sqlx::{PgPool, Row};
use uuid::Uuid;

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

pub async fn insert_document(pool: &PgPool, new: NewDocument) -> Result<Document, sqlx::Error> {
    let id = new.id;
    let doc = new.into_document_row();
    sqlx::query(
        r#"
        INSERT INTO documents (
            id, created_at, updated_at, file_hash, filename, user_id, metadata, status,
            transaction_id, block_height, confirmations, chain_timestamp, failure_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        "#,
    )
    .bind(id.0)
    .bind(doc.created_at)
    .bind(doc.updated_at)
    .bind(&doc.file_hash)
    .bind(&doc.filename)
    .bind(&doc.user_id)
    .bind(&doc.metadata)
    .bind(&doc.status)
    .bind(&doc.transaction_id)
    .bind(doc.block_height)
    .bind(doc.confirmations)
    .bind(doc.timestamp)
    .bind(&doc.failure_reason)
    .execute(pool)
    .await?;
    find_by_id(pool, id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)
}

pub async fn find_by_id(pool: &PgPool, id: DocumentId) -> Result<Option<Document>, sqlx::Error> {
    let row = sqlx::query("SELECT * FROM documents WHERE id = $1")
        .bind(id.0)
        .fetch_optional(pool)
        .await?;
    Ok(row.map(|r| row_to_document(&r)))
}

pub async fn find_by_hash(pool: &PgPool, file_hash: &str) -> Result<Option<Document>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT * FROM documents WHERE file_hash = $1 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(file_hash)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|r| row_to_document(&r)))
}

pub async fn list_for_user(pool: &PgPool, user_id: Uuid) -> Result<Vec<Document>, sqlx::Error> {
    let rows =
        sqlx::query("SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC")
            .bind(user_id)
            .fetch_all(pool)
            .await?;
    Ok(rows.iter().map(|r| row_to_document(r)).collect())
}

pub async fn list_all(pool: &PgPool) -> Result<Vec<Document>, sqlx::Error> {
    let rows = sqlx::query("SELECT * FROM documents ORDER BY created_at DESC")
        .fetch_all(pool)
        .await?;
    Ok(rows.iter().map(|r| row_to_document(r)).collect())
}

pub async fn find_by_transaction_id(
    pool: &PgPool,
    transaction_id: &str,
) -> Result<Option<Document>, sqlx::Error> {
    let row = sqlx::query("SELECT * FROM documents WHERE transaction_id = $1 ORDER BY created_at DESC LIMIT 1")
        .bind(transaction_id)
        .fetch_optional(pool)
        .await?;
    Ok(row.map(|r| row_to_document(&r)))
}

pub async fn update_after_broadcast(
    pool: &PgPool,
    id: DocumentId,
    txid: &str,
) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    sqlx::query(
        r#"UPDATE documents SET status = 'processing', transaction_id = $2, updated_at = $3 WHERE id = $1"#,
    )
    .bind(id.0)
    .bind(txid)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_after_confirm(
    pool: &PgPool,
    id: DocumentId,
    block_height: i64,
    confirmations: i32,
    chain_ts: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    sqlx::query(
        r#"UPDATE documents SET status = 'confirmed', block_height = $2, confirmations = $3,
           chain_timestamp = $4, updated_at = $5 WHERE id = $1"#,
    )
    .bind(id.0)
    .bind(block_height)
    .bind(confirmations)
    .bind(chain_ts)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_failed(pool: &PgPool, id: DocumentId, reason: &str) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    sqlx::query(
        r#"UPDATE documents SET status = 'failed', failure_reason = $2, updated_at = $3 WHERE id = $1"#,
    )
    .bind(id.0)
    .bind(reason)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn requeue_after_failure(
    pool: &PgPool,
    id: DocumentId,
    reason: &str,
) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    sqlx::query(
        r#"UPDATE documents
           SET status = 'pending',
               transaction_id = NULL,
               block_height = NULL,
               confirmations = NULL,
               chain_timestamp = NULL,
               failure_reason = $2,
               updated_at = $3
           WHERE id = $1"#,
    )
    .bind(id.0)
    .bind(reason)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}
