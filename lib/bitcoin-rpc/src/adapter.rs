use std::str::FromStr;

use bitcoin::consensus::encode::deserialize_hex;
use bitcoin::Txid;
use corepc_types::v17::CreateRawTransaction;
use core_notarization::{
    BitcoinNodeError, BitcoinNodePort, NetworkName, TransactionInfo, TxInputInfo, TxOutputInfo,
};
use corepc_client::client_sync::v28::Client;
use corepc_client::client_sync::{Auth, Error as RpcError};

/// JSON-RPC client wrapper for Bitcoin Core (blocking `corepc-client` inside `spawn_blocking`).
#[derive(Clone, Debug)]
pub struct BitcoinRpcAdapter {
    rpc_url: String,
    rpc_user: String,
    rpc_password: String,
}

impl BitcoinRpcAdapter {
    pub fn new(
        rpc_url: impl Into<String>,
        rpc_user: impl Into<String>,
        rpc_password: impl Into<String>,
    ) -> Self {
        Self {
            rpc_url: rpc_url.into(),
            rpc_user: rpc_user.into(),
            rpc_password: rpc_password.into(),
        }
    }
}

#[async_trait::async_trait]
impl BitcoinNodePort for BitcoinRpcAdapter {
    async fn send_op_return(&self, payload: &[u8]) -> Result<String, BitcoinNodeError> {
        if payload.len() > 80 {
            return Err(BitcoinNodeError::Rpc(
                "OP_RETURN payload must be <= 80 bytes".to_string(),
            ));
        }
        let url = self.rpc_url.clone();
        let user = self.rpc_user.clone();
        let pass = self.rpc_password.clone();
        let data = payload.to_vec();
        tokio::task::spawn_blocking(move || {
            let auth = Auth::UserPass(user, pass);
            let client = Client::new_with_auth(&url, auth)
                .map_err(|e: RpcError| BitcoinNodeError::Rpc(e.to_string()))?;
            let inputs = serde_json::json!([]);
            let outputs = serde_json::json!([{ "data": hex::encode(&data) }]);
            let CreateRawTransaction(hex_str) = client
                .call::<CreateRawTransaction>("createrawtransaction", &[inputs, outputs])
                .map_err(|e: RpcError| BitcoinNodeError::Rpc(e.to_string()))?;
            let tx: bitcoin::Transaction = deserialize_hex(&hex_str)
                .map_err(|e| BitcoinNodeError::Rpc(e.to_string()))?;
            let funded = client
                .fund_raw_transaction(&tx)
                .map_err(|e: RpcError| BitcoinNodeError::Rpc(e.to_string()))?;
            let mut tx: bitcoin::Transaction = deserialize_hex(&funded.hex)
                .map_err(|e| BitcoinNodeError::Rpc(e.to_string()))?;
            let signed = client
                .sign_raw_transaction_with_wallet(&tx)
                .map_err(|e: RpcError| BitcoinNodeError::Rpc(e.to_string()))?;
            if !signed.complete {
                return Err(BitcoinNodeError::Rpc(
                    "signrawtransactionwithwallet did not complete".to_string(),
                ));
            }
            tx = deserialize_hex(&signed.hex).map_err(|e| BitcoinNodeError::Rpc(e.to_string()))?;
            let sent = client
                .send_raw_transaction(&tx)
                .map_err(|e: RpcError| BitcoinNodeError::Rpc(e.to_string()))?;
            Ok(sent.0.to_string())
        })
        .await
        .map_err(|e| BitcoinNodeError::Rpc(format!("join error: {e}")))?
    }

    async fn get_transaction(&self, txid: &str) -> Result<TransactionInfo, BitcoinNodeError> {
        let parsed =
            Txid::from_str(txid).map_err(|_| BitcoinNodeError::InvalidTxid(txid.to_string()))?;
        let url = self.rpc_url.clone();
        let user = self.rpc_user.clone();
        let pass = self.rpc_password.clone();
        let txid_owned = txid.to_string();
        tokio::task::spawn_blocking(move || {
            let auth = Auth::UserPass(user, pass);
            let client = Client::new_with_auth(&url, auth)
                .map_err(|e: RpcError| BitcoinNodeError::Rpc(e.to_string()))?;
            let verbose = client
                .get_raw_transaction_verbose(parsed)
                .map_err(|e: RpcError| BitcoinNodeError::TransactionNotFound(e.to_string()))?;
            let tx: bitcoin::Transaction = deserialize_hex(&verbose.hex)
                .map_err(|e| BitcoinNodeError::Rpc(e.to_string()))?;
            let mut network = NetworkName::Testnet4;
            if let Ok(chain) = client.call::<serde_json::Value>("getblockchaininfo", &[]) {
                if let Some(ch) = chain
                    .get("chain")
                    .and_then(|c: &serde_json::Value| c.as_str())
                {
                    network = match ch {
                        "main" => NetworkName::Mainnet,
                        "test" => NetworkName::Testnet,
                        "testnet4" => NetworkName::Testnet4,
                        "signet" => NetworkName::Signet,
                        "regtest" => NetworkName::Regtest,
                        _ => NetworkName::Testnet4,
                    };
                }
            }
            let confirmations = verbose.confirmations.unwrap_or(0);
            let block_hash = verbose.block_hash.clone().unwrap_or_default();
            let ts_sec = verbose.block_time.or(verbose.transaction_time);
            let timestamp = ts_sec
                .and_then(|t| chrono::DateTime::from_timestamp(t as i64, 0))
                .map(|d| d.to_rfc3339())
                .unwrap_or_default();
            let mut inputs = Vec::new();
            for _txin in &tx.input {
                inputs.push(TxInputInfo {
                    address: String::new(),
                    value: 0.0,
                });
            }
            let mut outputs = Vec::new();
            for o in &tx.output {
                let hex_script = hex::encode(o.script_pubkey.as_bytes());
                let op_return = if o.script_pubkey.is_op_return() {
                    Some(hex_script.clone())
                } else {
                    None
                };
                outputs.push(TxOutputInfo {
                    address: hex_script,
                    value: o.value.to_btc(),
                    op_return,
                });
            }
            Ok(TransactionInfo {
                txid: txid_owned,
                network,
                block_height: 0,
                block_hash,
                timestamp,
                confirmations,
                fee: 0.0,
                inputs,
                outputs,
            })
        })
        .await
        .map_err(|e| BitcoinNodeError::Rpc(format!("join error: {e}")))?
    }
}
