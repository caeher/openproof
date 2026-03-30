use serde::{Deserialize, Serialize};

use crate::primitives::NetworkName;

/// Shape aligned with `BitcoinTransaction` in `apps/client/types/index.ts`.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionInfo {
    pub txid: String,
    /// Not part of the frontend contract; omitted from JSON.
    #[serde(skip_serializing, skip_deserializing, default)]
    pub network: NetworkName,
    pub block_height: u64,
    pub block_hash: String,
    /// ISO-8601 string (empty when unknown).
    pub timestamp: String,
    pub confirmations: u64,
    pub fee: f64,
    pub inputs: Vec<TxInputInfo>,
    pub outputs: Vec<TxOutputInfo>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TxInputInfo {
    pub address: String,
    pub value: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TxOutputInfo {
    pub address: String,
    pub value: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub op_return: Option<String>,
}
