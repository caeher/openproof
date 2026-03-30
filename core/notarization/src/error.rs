use thiserror::Error;

#[derive(Error, Debug)]
pub enum BitcoinNodeError {
    #[error("BitcoinNodeError - Rpc: {0}")]
    Rpc(String),

    #[error("BitcoinNodeError - InvalidTxid: {0}")]
    InvalidTxid(String),

    #[error("BitcoinNodeError - TransactionNotFound: {0}")]
    TransactionNotFound(String),
}
