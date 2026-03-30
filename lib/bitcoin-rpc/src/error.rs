use thiserror::Error;

#[derive(Error, Debug)]
pub enum AdapterError {
    #[error("AdapterError - Rpc: {0}")]
    Rpc(String),

    #[error("AdapterError - Hex: {0}")]
    Hex(#[from] hex::FromHexError),
}
