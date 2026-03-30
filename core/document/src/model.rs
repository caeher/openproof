use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Strongly-typed document identifier.
#[derive(
    Clone, Copy, PartialEq, Eq, Hash, Debug, Serialize, Deserialize,
)]
#[serde(transparent)]
pub struct DocumentId(pub Uuid);

impl DocumentId {
    pub fn new() -> Self {
        Self(Uuid::now_v7())
    }
}

impl From<Uuid> for DocumentId {
    fn from(value: Uuid) -> Self {
        Self(value)
    }
}

impl From<DocumentId> for Uuid {
    fn from(value: DocumentId) -> Self {
        value.0
    }
}

/// Row + API shape aligned with `apps/client/types` `Document`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    pub id: String,
    pub file_hash: String,
    pub filename: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
    pub user_id: Uuid,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub block_height: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confirmations: Option<i32>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
}

/// Input when registering a new proof request.
#[derive(Debug, Clone)]
pub struct NewDocument {
    pub id: DocumentId,
    pub file_hash: String,
    pub filename: String,
    pub user_id: Uuid,
    pub metadata: Option<serde_json::Value>,
}

impl NewDocument {
    pub fn into_document_row(self) -> Document {
        let now = Utc::now();
        Document {
            id: self.id.0.to_string(),
            file_hash: self.file_hash,
            filename: self.filename,
            metadata: self.metadata,
            user_id: self.user_id,
            transaction_id: None,
            block_height: None,
            timestamp: None,
            confirmations: None,
            status: "pending".to_string(),
            created_at: now,
            updated_at: now,
            failure_reason: None,
        }
    }
}
