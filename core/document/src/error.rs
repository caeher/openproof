use thiserror::Error;

#[derive(Error, Debug)]
pub enum DocumentError {
    #[error("DocumentError - NotFound")]
    NotFound,

    #[error("DocumentError - InvalidHash: must be 64 lowercase hex chars")]
    InvalidHash,

    #[error("DocumentError - InvalidState: {0}")]
    InvalidState(String),
}
