use thiserror::Error;

#[derive(Error, Debug)]
pub enum AuthorizationError {
    #[error("AuthorizationError - Denied: {0}")]
    Denied(String),
}
