//! Bitcoin Core JSON-RPC adapter (OP_RETURN anchoring).

mod adapter;
mod error;

pub use adapter::BitcoinRpcAdapter;
pub use error::AdapterError;
