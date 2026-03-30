//! Authorization ports (JWT/RBAC-ready).

mod error;
mod permission;

pub use error::AuthorizationError;
pub use permission::{AuditInfo, DummyPerms, PermissionCheck, Subject};
