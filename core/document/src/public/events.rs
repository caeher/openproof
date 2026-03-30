use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::model::Document;

/// Outbox payload when a document should be anchored on-chain.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum CoreDocumentEvent {
    ReadyForNotarization {
        document_id: Uuid,
        file_hash: String,
    },
}

pub fn ready_for_notarization(document: &Document) -> CoreDocumentEvent {
    CoreDocumentEvent::ReadyForNotarization {
        document_id: Uuid::parse_str(&document.id).expect("document id is uuid string"),
        file_hash: document.file_hash.clone(),
    }
}
