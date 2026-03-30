use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::Json;
use core_document::{ready_for_notarization, DocumentId, NewDocument};
use openproof_app::documents;
use openproof_app::outbox;
use serde::Deserialize;
use uuid::Uuid;

use crate::error::{err_json, ok_json};
use crate::AppState;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterDocumentRequest {
    pub file_hash: String,
    pub filename: String,
    #[serde(default)]
    pub metadata: Option<serde_json::Value>,
    pub user_id: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterDocumentResponse {
    pub document_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyDocumentRequest {
    pub file_hash: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyDocumentResponse {
    pub exists: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub block_height: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confirmations: Option<i32>,
}

#[derive(Deserialize)]
pub struct ListQuery {
    #[serde(rename = "userId")]
    pub user_id: Option<String>,
}

fn validate_hash(h: &str) -> bool {
    h.len() == 64 && h.chars().all(|c| c.is_ascii_hexdigit())
}

pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(body): Json<RegisterDocumentRequest>,
) -> axum::response::Response {
    if !validate_hash(&body.file_hash) {
        return err_json(axum::http::StatusCode::BAD_REQUEST, "invalid fileHash");
    }
    let id = DocumentId::new();
    let new = NewDocument {
        id,
        file_hash: body.file_hash.clone(),
        filename: body.filename,
        user_id: body.user_id,
        metadata: body.metadata,
    };
    let doc = match documents::insert_document(&state.pool, new).await {
        Ok(d) => d,
        Err(e) => {
            return err_json(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("db: {e}"),
            );
        }
    };
    let ev = ready_for_notarization(&doc);
    if let Err(e) = outbox::enqueue(&state.pool, id.0, &ev).await {
        return err_json(
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            format!("outbox: {e}"),
        );
    }
    ok_json(RegisterDocumentResponse {
        document_id: doc.id.clone(),
        transaction_id: doc.transaction_id.clone(),
        status: doc.status.clone(),
        created_at: doc.created_at,
    })
}

pub async fn verify(
    State(state): State<Arc<AppState>>,
    Json(body): Json<VerifyDocumentRequest>,
) -> axum::response::Response {
    if !validate_hash(&body.file_hash) {
        return err_json(axum::http::StatusCode::BAD_REQUEST, "invalid fileHash");
    }
    let doc = match documents::find_by_hash(&state.pool, &body.file_hash).await {
        Ok(d) => d,
        Err(e) => {
            return err_json(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("db: {e}"),
            );
        }
    };
    let Some(d) = doc else {
        return ok_json(VerifyDocumentResponse {
            exists: false,
            transaction_id: None,
            block_height: None,
            timestamp: None,
            confirmations: None,
        });
    };
    ok_json(VerifyDocumentResponse {
        exists: true,
        transaction_id: d.transaction_id.clone(),
        block_height: d.block_height,
        timestamp: d.timestamp,
        confirmations: d.confirmations,
    })
}

pub async fn get_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> axum::response::Response {
    let Ok(uid) = Uuid::parse_str(&id) else {
        return err_json(axum::http::StatusCode::BAD_REQUEST, "invalid id");
    };
    let doc = match documents::find_by_id(&state.pool, DocumentId(uid)).await {
        Ok(d) => d,
        Err(e) => {
            return err_json(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("db: {e}"),
            );
        }
    };
    let Some(d) = doc else {
        return err_json(axum::http::StatusCode::NOT_FOUND, "not found");
    };
    ok_json(d)
}

pub async fn get_by_transaction_id(
    State(state): State<Arc<AppState>>,
    Path(txid): Path<String>,
) -> axum::response::Response {
    let doc = match documents::find_by_transaction_id(&state.pool, &txid).await {
        Ok(d) => d,
        Err(e) => {
            return err_json(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("db: {e}"),
            );
        }
    };
    let Some(d) = doc else {
        return err_json(axum::http::StatusCode::NOT_FOUND, "not found");
    };
    ok_json(d)
}

pub async fn list(
    State(state): State<Arc<AppState>>,
    Query(q): Query<ListQuery>,
) -> axum::response::Response {
    let docs = match &q.user_id {
        Some(uid) => match documents::list_for_user(&state.pool, uid).await {
            Ok(d) => d,
            Err(e) => {
                return err_json(
                    axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                    format!("db: {e}"),
                );
            }
        },
        None => match documents::list_all(&state.pool).await {
            Ok(d) => d,
            Err(e) => {
                return err_json(
                    axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                    format!("db: {e}"),
                );
            }
        },
    };
    ok_json(docs)
}
