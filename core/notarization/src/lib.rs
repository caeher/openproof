//! Ports and DTOs for Bitcoin notarization (hexagonal boundary).

mod error;
mod primitives;
mod transaction_info;

pub use error::BitcoinNodeError;
pub use primitives::NetworkName;
pub use transaction_info::{TransactionInfo, TxInputInfo, TxOutputInfo};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletInfo {
    pub wallet_name: String,
    pub loaded: bool,
    pub primary_address: String,
    pub balance_sats: i64,
    pub confirmed_balance_sats: i64,
    pub unconfirmed_balance_sats: i64,
    pub tx_count: u64,
    pub network: NetworkName,
}

/// JSON-RPC port for embedding a SHA-256 digest on-chain via `OP_RETURN`.
#[async_trait::async_trait]
pub trait BitcoinNodePort: Send + Sync + 'static {
    /// Embed `payload` in an `OP_RETURN` output, fund, sign with wallet, broadcast.
    /// `payload` is typically 32 bytes (SHA-256).
    async fn send_op_return(&self, payload: &[u8]) -> Result<String, BitcoinNodeError>;

    /// Fetch verbose transaction data for explorer / verification flows.
    async fn get_transaction(&self, txid: &str) -> Result<TransactionInfo, BitcoinNodeError>;

    /// Fetch the current wallet status used for notarization operations.
    async fn get_wallet_info(&self) -> Result<WalletInfo, BitcoinNodeError>;
}
