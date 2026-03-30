use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    User,
    Admin,
}

impl Role {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::User => "user",
            Self::Admin => "admin",
        }
    }

    pub fn from_str(value: &str) -> Option<Self> {
        match value {
            "user" => Some(Self::User),
            "admin" => Some(Self::Admin),
            _ => None,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Subject {
    pub user_id: Uuid,
    pub role: Role,
    pub email_verified: bool,
}

#[derive(Clone, Debug, Default)]
pub struct AuditInfo;

#[async_trait]
pub trait PermissionCheck: Send + Sync + 'static {
    async fn enforce_document_owner(
        &self,
        subject: &Subject,
        document_user_id: Uuid,
    ) -> Result<AuditInfo, crate::AuthorizationError>;

    async fn enforce_verified_email(
        &self,
        subject: &Subject,
    ) -> Result<AuditInfo, crate::AuthorizationError>;
}

/// Development / test implementation that always allows.
#[derive(Clone, Default, Debug)]
pub struct DummyPerms;

/// Production authorization implementation backed by subject claims.
#[derive(Clone, Default, Debug)]
pub struct RoleBasedPerms;

#[async_trait]
impl PermissionCheck for DummyPerms {
    async fn enforce_document_owner(
        &self,
        _subject: &Subject,
        _document_user_id: Uuid,
    ) -> Result<AuditInfo, crate::AuthorizationError> {
        Ok(AuditInfo::default())
    }

    async fn enforce_verified_email(
        &self,
        _subject: &Subject,
    ) -> Result<AuditInfo, crate::AuthorizationError> {
        Ok(AuditInfo::default())
    }
}

#[async_trait]
impl PermissionCheck for RoleBasedPerms {
    async fn enforce_document_owner(
        &self,
        subject: &Subject,
        document_user_id: Uuid,
    ) -> Result<AuditInfo, crate::AuthorizationError> {
        self.enforce_verified_email(subject).await?;
        if subject.role == Role::Admin || subject.user_id == document_user_id {
            return Ok(AuditInfo::default());
        }
        Err(crate::AuthorizationError::Denied(
            "subject is not allowed to access this document".to_string(),
        ))
    }

    async fn enforce_verified_email(
        &self,
        subject: &Subject,
    ) -> Result<AuditInfo, crate::AuthorizationError> {
        if subject.email_verified {
            return Ok(AuditInfo::default());
        }
        Err(crate::AuthorizationError::UnverifiedEmail)
    }
}
