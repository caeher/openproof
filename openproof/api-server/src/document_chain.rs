use std::sync::Arc;
use std::time::Duration;

use chrono::{DateTime, Utc};
use core_document::DocumentId;
use sqlx::Row;
use tracing::{error, warn};
use uuid::Uuid;

use crate::mailer::EmailSender;
use openproof_app::documents;

struct ChainTrackedDocument {
    id: Uuid,
    filename: String,
    status: String,
    transaction_id: String,
    user_email: String,
    user_name: String,
}

pub async fn run_document_chain_sync_worker(
    pool: sqlx::PgPool,
    bitcoin: Arc<dyn core_notarization::BitcoinNodePort>,
    mailer: Arc<dyn EmailSender>,
    app_base_url: String,
) {
    loop {
        if let Err(error) = sync_documents(&pool, bitcoin.as_ref(), mailer.as_ref(), &app_base_url).await {
            error!(%error, "document chain sync batch failed");
        }
        tokio::time::sleep(Duration::from_secs(30)).await;
    }
}

async fn sync_documents(
    pool: &sqlx::PgPool,
    bitcoin: &dyn core_notarization::BitcoinNodePort,
    mailer: &dyn EmailSender,
    app_base_url: &str,
) -> Result<(), sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            d.id,
            d.filename,
            d.status,
            d.transaction_id,
            u.email AS user_email,
            u.name AS user_name
        FROM documents d
        INNER JOIN users u ON u.id = d.user_id
        WHERE d.transaction_id IS NOT NULL AND d.status IN ('processing', 'confirmed')
        ORDER BY d.updated_at ASC
        LIMIT 25
        "#,
    )
    .fetch_all(pool)
    .await?;

    for row in rows {
        let tracked = ChainTrackedDocument {
            id: row.get("id"),
            filename: row.get("filename"),
            status: row.get("status"),
            transaction_id: row.get("transaction_id"),
            user_email: row.get("user_email"),
            user_name: row.get("user_name"),
        };

        let transaction = match bitcoin.get_transaction(&tracked.transaction_id).await {
            Ok(value) => value,
            Err(error) => {
                warn!(txid = %tracked.transaction_id, %error, "skipping document chain sync for tx lookup error");
                continue;
            }
        };

        if transaction.confirmations == 0 || transaction.block_height == 0 {
            continue;
        }

        let chain_timestamp = parse_chain_timestamp(&transaction.timestamp);
        let block_height = match i64::try_from(transaction.block_height) {
            Ok(value) => value,
            Err(_) => continue,
        };
        let confirmations = i32::try_from(transaction.confirmations).unwrap_or(i32::MAX);

        documents::update_after_confirm(
            pool,
            DocumentId(tracked.id),
            block_height,
            confirmations,
            chain_timestamp,
        )
        .await?;

        if tracked.status != "confirmed" {
            let proof_url = format!(
                "{}/p/{}",
                app_base_url.trim_end_matches('/'),
                tracked.transaction_id
            );
            let file_url = format!(
                "{}/api/v1/documents/by-transaction/{}/file",
                app_base_url.trim_end_matches('/'),
                tracked.transaction_id
            );
            if let Err(error) = mailer
                .send_document_anchored_email(
                    &tracked.user_email,
                    &tracked.user_name,
                    &tracked.filename,
                    &tracked.transaction_id,
                    &proof_url,
                    &file_url,
                )
                .await
            {
                warn!(
                    email = %tracked.user_email,
                    txid = %tracked.transaction_id,
                    %error,
                    "failed to send anchored document email"
                );
            }
        }
    }

    Ok(())
}

fn parse_chain_timestamp(value: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(value)
        .map(|timestamp| timestamp.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now())
}