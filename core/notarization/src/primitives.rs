use serde::{Deserialize, Serialize};

/// Bitcoin network label for display / links (e.g. testnet4).
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum NetworkName {
    Mainnet,
    Testnet,
    Testnet4,
    Signet,
    Regtest,
}

impl Default for NetworkName {
    fn default() -> Self {
        NetworkName::Testnet4
    }
}
