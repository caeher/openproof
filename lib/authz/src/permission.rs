use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Subject {
    pub user_id: String,
}

#[derive(Clone, Debug, Default)]
pub struct AuditInfo;

#[async_trait]
pub trait PermissionCheck: Send + Sync + 'static {
    async fn enforce_document_owner(
        &self,
        subject: &Subject,
        document_user_id: &str,
    ) -> Result<AuditInfo, crate::AuthorizationError>;
}

/// Development / test implementation that always allows.
#[derive(Clone, Default, Debug)]
pub struct DummyPerms;

#[async_trait]
impl PermissionCheck for DummyPerms {
    async fn enforce_document_owner(
        &self,
        _subject: &Subject,
        _document_user_id: &str,
    ) -> Result<AuditInfo, crate::AuthorizationError> {
        Ok(AuditInfo::default())
    }
}
