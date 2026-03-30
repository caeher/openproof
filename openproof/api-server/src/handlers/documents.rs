use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::Json;
use core_document::{ready_for_notarization, DocumentId, NewDocument};
use lib_authz::AuthorizationError;
use openproof_app::documents;
use openproof_app::outbox;
use serde::Deserialize;
use uuid::Uuid;

use crate::auth;
use crate::error::{err_json, ok_json};
use crate::AppState;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterDocumentRequest {
    pub file_hash: String,
    pub filename: String,
    #[serde(default)]
    pub metadata: Option<serde_json::Value>,
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

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivateDocumentResponse {
    pub id: String,
    pub file_hash: String,
    pub filename: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub block_height: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confirmations: Option<i32>,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicDocumentProofResponse {
    pub document_id: String,
    pub file_hash: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub block_height: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confirmations: Option<i32>,
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

fn validate_hash(h: &str) -> bool {
    h.len() == 64 && h.chars().all(|c| c.is_ascii_hexdigit())
}

pub async fn register(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(body): Json<RegisterDocumentRequest>,
) -> axum::response::Response {
    let session = match auth::require_verified_session_or_api_key(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };
    if !validate_hash(&body.file_hash) {
        return err_json(axum::http::StatusCode::BAD_REQUEST, "invalid fileHash");
    }
    let id = DocumentId::new();
    let new = NewDocument {
        id,
        file_hash: body.file_hash.clone(),
        filename: body.filename,
        user_id: session.subject.user_id,
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
    headers: HeaderMap,
    Path(id): Path<String>,
) -> axum::response::Response {
    let session = match auth::require_verified_session_or_api_key(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };
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
    if let Err(error) = state
        .perms
        .enforce_document_owner(&session.subject, d.user_id)
        .await
    {
        return authorization_error_response(error);
    }
    ok_json(map_private_document(&d))
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
    ok_json(map_public_document(&d))
}

pub async fn list(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> axum::response::Response {
    let session = match auth::require_verified_session_or_api_key(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };
    let docs = match documents::list_for_user(&state.pool, session.subject.user_id).await {
        Ok(value) => value,
        Err(error) => {
            return err_json(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("db: {error}"),
            );
        }
    };
    ok_json(docs.iter().map(map_private_document).collect::<Vec<_>>())
}

fn map_private_document(document: &core_document::Document) -> PrivateDocumentResponse {
    PrivateDocumentResponse {
        id: document.id.clone(),
        file_hash: document.file_hash.clone(),
        filename: document.filename.clone(),
        metadata: document.metadata.clone(),
        transaction_id: document.transaction_id.clone(),
        block_height: document.block_height,
        timestamp: document.timestamp,
        confirmations: document.confirmations,
        status: document.status.clone(),
        created_at: document.created_at,
        updated_at: document.updated_at,
        failure_reason: document.failure_reason.clone(),
    }
}

fn map_public_document(document: &core_document::Document) -> PublicDocumentProofResponse {
    PublicDocumentProofResponse {
        document_id: document.id.clone(),
        file_hash: document.file_hash.clone(),
        transaction_id: document.transaction_id.clone(),
        block_height: document.block_height,
        timestamp: document.timestamp,
        confirmations: document.confirmations,
        status: document.status.clone(),
        created_at: document.created_at,
    }
}

fn authorization_error_response(error: AuthorizationError) -> axum::response::Response {
    match error {
        AuthorizationError::Denied(message) => err_json(StatusCode::FORBIDDEN, message),
        AuthorizationError::UnverifiedEmail => {
            err_json(StatusCode::FORBIDDEN, "email verification required")
        }
    }
}
