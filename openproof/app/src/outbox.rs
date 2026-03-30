use core_document::CoreDocumentEvent;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn enqueue(pool: &PgPool, document_id: Uuid, event: &CoreDocumentEvent) -> Result<(), sqlx::Error> {
    let payload = serde_json::to_value(event).expect("serialize");
    sqlx::query(
        r#"INSERT INTO outbox (document_id, payload) VALUES ($1, $2)"#,
    )
    .bind(document_id)
    .bind(payload)
    .execute(pool)
    .await?;
    Ok(())
}
