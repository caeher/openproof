use std::collections::BTreeMap;
use std::str::FromStr;

use bitcoin::consensus::encode::deserialize_hex;
use bitcoin::Txid;
use core_notarization::{
    BitcoinNodeError, BitcoinNodePort, NetworkName, TransactionInfo, TxInputInfo, TxOutputInfo,
    WalletInfo,
};
use corepc_client::client_sync::v28::Client;
use corepc_client::client_sync::{Auth, Error as RpcError};
use serde_json::{json, Value};

const PRIMARY_ADDRESS_LABEL: &str = "openproof-primary";

/// JSON-RPC client wrapper for Bitcoin Core (blocking `corepc-client` inside `spawn_blocking`).
#[derive(Clone, Debug)]
pub struct BitcoinRpcAdapter {
    rpc_url: String,
    rpc_user: String,
    rpc_password: String,
    wallet_name: String,
}

impl BitcoinRpcAdapter {
    pub fn new(
        rpc_url: impl Into<String>,
        rpc_user: impl Into<String>,
        rpc_password: impl Into<String>,
        wallet_name: impl Into<String>,
    ) -> Self {
        Self {
            rpc_url: rpc_url.into(),
            rpc_user: rpc_user.into(),
            rpc_password: rpc_password.into(),
            wallet_name: wallet_name.into(),
        }
    }

    pub async fn ensure_wallet_ready(&self) -> Result<WalletInfo, BitcoinNodeError> {
        let adapter = self.clone();
        tokio::task::spawn_blocking(move || adapter.ensure_wallet_ready_blocking())
            .await
            .map_err(|error| BitcoinNodeError::Rpc(format!("join error: {error}")))?
    }

    fn connect_client(url: &str, user: &str, password: &str) -> Result<Client, BitcoinNodeError> {
        Client::new_with_auth(url, Auth::UserPass(user.to_string(), password.to_string()))
            .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))
    }

    fn base_client(&self) -> Result<Client, BitcoinNodeError> {
        Self::connect_client(&self.rpc_url, &self.rpc_user, &self.rpc_password)
    }

    fn wallet_client(&self) -> Result<Client, BitcoinNodeError> {
        let wallet_url = format!(
            "{}/wallet/{}",
            self.rpc_url.trim_end_matches('/'),
            self.wallet_name
        );
        Self::connect_client(&wallet_url, &self.rpc_user, &self.rpc_password)
    }

    fn ensure_wallet_ready_blocking(&self) -> Result<WalletInfo, BitcoinNodeError> {
        let base_client = self.base_client()?;
        self.load_or_create_wallet(&base_client)?;
        let wallet_client = self.wallet_client()?;
        let primary_address = self.ensure_primary_address(&wallet_client)?;
        self.build_wallet_info(&base_client, &wallet_client, primary_address)
    }

    fn load_or_create_wallet(&self, base_client: &Client) -> Result<(), BitcoinNodeError> {
        if self.wallet_is_loaded(base_client)? {
            return Ok(());
        }

        if self.wallet_exists(base_client)? {
            base_client
                .call::<Value>("loadwallet", &[json!(self.wallet_name)])
                .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))?;
            return Ok(());
        }

        base_client
            .call::<Value>("createwallet", &[json!(self.wallet_name)])
            .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))?;
        Ok(())
    }

    fn wallet_is_loaded(&self, base_client: &Client) -> Result<bool, BitcoinNodeError> {
        let loaded_wallets = base_client
            .call::<Value>("listwallets", &[])
            .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))?;

        Ok(loaded_wallets
            .as_array()
            .map(|wallets| {
                wallets.iter().any(|wallet| {
                    wallet
                        .as_str()
                        .map(|value| value == self.wallet_name)
                        .unwrap_or(false)
                })
            })
            .unwrap_or(false))
    }

    fn wallet_exists(&self, base_client: &Client) -> Result<bool, BitcoinNodeError> {
        let wallet_dir = base_client
            .call::<Value>("listwalletdir", &[])
            .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))?;

        Ok(wallet_dir
            .get("wallets")
            .and_then(Value::as_array)
            .map(|wallets| {
                wallets.iter().any(|wallet| {
                    wallet
                        .get("name")
                        .and_then(Value::as_str)
                        .map(|value| value == self.wallet_name)
                        .unwrap_or(false)
                })
            })
            .unwrap_or(false))
    }

    fn ensure_primary_address(&self, wallet_client: &Client) -> Result<String, BitcoinNodeError> {
        if let Ok(addresses) = wallet_client.call::<Value>(
            "getaddressesbylabel",
            &[json!(PRIMARY_ADDRESS_LABEL)],
        ) {
            if let Some(address) = addresses
                .as_object()
                .and_then(|entries| entries.keys().next().cloned())
            {
                return Ok(address);
            }
        }

        wallet_client
            .call::<String>("getnewaddress", &[json!(PRIMARY_ADDRESS_LABEL)])
            .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))
    }

    fn build_wallet_info(
        &self,
        base_client: &Client,
        wallet_client: &Client,
        primary_address: String,
    ) -> Result<WalletInfo, BitcoinNodeError> {
        let wallet_info = wallet_client
            .call::<Value>("getwalletinfo", &[])
            .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))?;
        let balances = wallet_client
            .call::<Value>("getbalances", &[])
            .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))?;
        let blockchain_info = base_client
            .call::<Value>("getblockchaininfo", &[])
            .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))?;

        let confirmed_balance_sats = balances
            .pointer("/mine/trusted")
            .and_then(Value::as_f64)
            .map(btc_to_sats)
            .unwrap_or_default();
        let unconfirmed_balance_sats = balances
            .pointer("/mine/untrusted_pending")
            .and_then(Value::as_f64)
            .map(btc_to_sats)
            .unwrap_or_default();

        Ok(WalletInfo {
            wallet_name: self.wallet_name.clone(),
            loaded: self.wallet_is_loaded(base_client)?,
            primary_address,
            balance_sats: confirmed_balance_sats + unconfirmed_balance_sats,
            confirmed_balance_sats,
            unconfirmed_balance_sats,
            tx_count: wallet_info
                .get("txcount")
                .and_then(Value::as_u64)
                .unwrap_or_default(),
            network: parse_network(
                blockchain_info
                    .get("chain")
                    .and_then(Value::as_str)
                    .unwrap_or_default(),
            ),
        })
    }

    fn select_funded_address_and_inputs(
        &self,
        wallet_client: &Client,
    ) -> Result<(String, Vec<Value>), BitcoinNodeError> {
        let unspent = wallet_client
            .call::<Value>("listunspent", &[])
            .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))?;
        let mut by_address: BTreeMap<String, (i64, Vec<Value>)> = BTreeMap::new();

        for entry in unspent.as_array().into_iter().flatten() {
            let Some(address) = entry.get("address").and_then(Value::as_str) else {
                continue;
            };
            let spendable = entry
                .get("spendable")
                .and_then(Value::as_bool)
                .unwrap_or(true);
            if !spendable {
                continue;
            }

            let Some(txid) = entry.get("txid").and_then(Value::as_str) else {
                continue;
            };
            let Some(vout) = entry.get("vout").and_then(Value::as_u64) else {
                continue;
            };
            let sats = entry
                .get("amount")
                .and_then(Value::as_f64)
                .map(btc_to_sats)
                .unwrap_or_default();
            if sats <= 0 {
                continue;
            }

            let slot = by_address
                .entry(address.to_string())
                .or_insert_with(|| (0, Vec::new()));
            slot.0 += sats;
            slot.1.push(json!({ "txid": txid, "vout": vout }));
        }

        by_address
            .into_iter()
            .max_by_key(|(_, (balance_sats, _))| *balance_sats)
            .map(|(address, (_, inputs))| (address, inputs))
            .ok_or_else(|| BitcoinNodeError::Rpc("wallet has no spendable balance".to_string()))
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
        let adapter = self.clone();
        let data = payload.to_vec();
        tokio::task::spawn_blocking(move || {
            let base_client = adapter.base_client()?;
            adapter.load_or_create_wallet(&base_client)?;
            let wallet_client = adapter.wallet_client()?;
            let _ = adapter.ensure_primary_address(&wallet_client)?;
            let (funded_address, inputs) = adapter.select_funded_address_and_inputs(&wallet_client)?;
            let raw_transaction_hex = wallet_client
                .call::<String>(
                    "createrawtransaction",
                    &[json!(inputs), json!([{ "data": hex::encode(&data) }])],
                )
                .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))?;
            let funded = wallet_client
                .call::<Value>(
                    "fundrawtransaction",
                    &[
                        json!(raw_transaction_hex),
                        json!({
                            "add_inputs": false,
                            "changeAddress": funded_address,
                        }),
                    ],
                )
                .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))?;
            let funded_hex = funded
                .get("hex")
                .and_then(Value::as_str)
                .ok_or_else(|| BitcoinNodeError::Rpc("fundrawtransaction did not return hex".to_string()))?;
            let signed = wallet_client
                .call::<Value>("signrawtransactionwithwallet", &[json!(funded_hex)])
                .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))?;
            if !signed
                .get("complete")
                .and_then(Value::as_bool)
                .unwrap_or(false)
            {
                return Err(BitcoinNodeError::Rpc(
                    "signrawtransactionwithwallet did not complete".to_string(),
                ));
            }
            let signed_hex = signed
                .get("hex")
                .and_then(Value::as_str)
                .ok_or_else(|| {
                    BitcoinNodeError::Rpc(
                        "signrawtransactionwithwallet did not return hex".to_string(),
                    )
                })?;
            wallet_client
                .call::<String>("sendrawtransaction", &[json!(signed_hex)])
                .map_err(|error: RpcError| BitcoinNodeError::Rpc(error.to_string()))
        })
        .await
        .map_err(|e| BitcoinNodeError::Rpc(format!("join error: {e}")))?
    }

    async fn get_transaction(&self, txid: &str) -> Result<TransactionInfo, BitcoinNodeError> {
        let parsed =
            Txid::from_str(txid).map_err(|_| BitcoinNodeError::InvalidTxid(txid.to_string()))?;
        let adapter = self.clone();
        let txid_owned = txid.to_string();
        tokio::task::spawn_blocking(move || {
            let client = adapter.base_client()?;
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
            let block_height = if block_hash.is_empty() {
                0
            } else {
                client
                    .call::<serde_json::Value>("getblockheader", &[json!(block_hash), json!(true)])
                    .ok()
                    .and_then(|header| header.get("height").and_then(|value| value.as_u64()))
                    .unwrap_or(0)
            };
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
                block_height,
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

    async fn get_wallet_info(&self) -> Result<WalletInfo, BitcoinNodeError> {
        let adapter = self.clone();
        tokio::task::spawn_blocking(move || adapter.ensure_wallet_ready_blocking())
            .await
            .map_err(|error| BitcoinNodeError::Rpc(format!("join error: {error}")))?
    }
}

fn btc_to_sats(value: f64) -> i64 {
    (value * 100_000_000.0).round() as i64
}

fn parse_network(chain: &str) -> NetworkName {
    match chain {
        "main" => NetworkName::Mainnet,
        "test" => NetworkName::Testnet,
        "testnet4" => NetworkName::Testnet4,
        "signet" => NetworkName::Signet,
        "regtest" => NetworkName::Regtest,
        _ => NetworkName::Testnet4,
    }
}
