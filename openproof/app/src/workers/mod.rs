//! Outbox consumer: anchors document hashes on Bitcoin (testnet4).

use std::sync::Arc;
use std::time::Duration;

use core_document::{CoreDocumentEvent, DocumentId};
use core_notarization::BitcoinNodePort;
use hex::FromHex;
use sqlx::{PgPool, Row};
use tracing::{error, info};
use uuid::Uuid;

use crate::documents;

pub async fn run_outbox_worker(pool: PgPool, bitcoin: Arc<dyn BitcoinNodePort>) {
    loop {
        if let Err(e) = process_batch(&pool, bitcoin.clone()).await {
            error!("outbox batch failed: {e}");
        }
        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}

async fn process_batch(
    pool: &PgPool,
    bitcoin: Arc<dyn BitcoinNodePort>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let rows = sqlx::query(
        r#"SELECT id, document_id, payload FROM outbox WHERE processed = false ORDER BY id ASC LIMIT 10"#,
    )
    .fetch_all(pool)
    .await?;
    for row in rows {
        let ob_id: i64 = row.try_get("id")?;
        let document_id: Uuid = row.try_get("document_id")?;
        let payload: serde_json::Value = row.try_get("payload")?;
        let event: CoreDocumentEvent = serde_json::from_value(payload)?;
        match event {
            CoreDocumentEvent::ReadyForNotarization { file_hash, .. } => {
                let bytes = <[u8; 32]>::from_hex(&file_hash).map_err(|e| format!("hex: {e}"))?;
                match bitcoin.send_op_return(&bytes).await {
                    Ok(txid) => {
                        documents::update_after_broadcast(pool, DocumentId(document_id), &txid)
                            .await?;
                        info!(%txid, %document_id, "broadcast op_return");
                    }
                    Err(e) => {
                        error!("bitcoin send failed: {e}");
                        documents::update_failed(pool, DocumentId(document_id), &format!("{e}"))
                            .await?;
                    }
                }
            }
        }
        sqlx::query(r#"UPDATE outbox SET processed = true WHERE id = $1"#)
            .bind(ob_id)
            .execute(pool)
            .await?;
    }
    Ok(())
}
