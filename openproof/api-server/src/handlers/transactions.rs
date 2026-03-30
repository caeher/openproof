use std::sync::Arc;

use axum::extract::{Path, State};

use crate::error::{err_json, ok_json};
use crate::AppState;

pub async fn get_tx(
    State(state): State<Arc<AppState>>,
    Path(txid): Path<String>,
) -> axum::response::Response {
    match state.bitcoin.get_transaction(&txid).await {
        Ok(t) => ok_json(t),
        Err(e) => err_json(
            axum::http::StatusCode::BAD_GATEWAY,
            format!("{e}"),
        ),
    }
}
