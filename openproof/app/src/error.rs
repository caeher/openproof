use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("AppError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),

    #[error("AppError - Document: {0}")]
    Document(#[from] core_document::DocumentError),

    #[error("AppError - Bitcoin: {0}")]
    Bitcoin(#[from] core_notarization::BitcoinNodeError),

    #[error("AppError - Json: {0}")]
    Json(#[from] serde_json::Error),
}
