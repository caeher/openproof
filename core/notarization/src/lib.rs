//! Ports and DTOs for Bitcoin notarization (hexagonal boundary).

mod error;
mod primitives;
mod transaction_info;

pub use error::BitcoinNodeError;
pub use primitives::NetworkName;
pub use transaction_info::{TransactionInfo, TxInputInfo, TxOutputInfo};

/// JSON-RPC port for embedding a SHA-256 digest on-chain via `OP_RETURN`.
#[async_trait::async_trait]
pub trait BitcoinNodePort: Send + Sync + 'static {
    /// Embed `payload` in an `OP_RETURN` output, fund, sign with wallet, broadcast.
    /// `payload` is typically 32 bytes (SHA-256).
    async fn send_op_return(&self, payload: &[u8]) -> Result<String, BitcoinNodeError>;

    /// Fetch verbose transaction data for explorer / verification flows.
    async fn get_transaction(&self, txid: &str) -> Result<TransactionInfo, BitcoinNodeError>;
}
