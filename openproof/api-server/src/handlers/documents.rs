use std::sync::Arc;

use axum::extract::{Multipart, Path, State};
use axum::http::header::{CONTENT_DISPOSITION, CONTENT_TYPE};
use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use core_document::{DocumentId, NewDocument};
use lib_authz::AuthorizationError;
use openproof_app::billing::{self, BillingError};
use openproof_app::documents;
use serde::Deserialize;
use serde_json::Value;
use sha2::{Digest, Sha256};
use tokio::fs;
use uuid::Uuid;

use crate::auth;
use crate::error::{err_json, ok_json};
use crate::storage;
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
    pub file_hash: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_url: Option<String>,
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
    pub content_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size_bytes: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub public_file_url: Option<String>,
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
    pub filename: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size_bytes: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub public_proof_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub public_file_url: Option<String>,
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
    pub public_proof_path: Option<String>,
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

fn public_proof_path(transaction_id: Option<&String>) -> Option<String> {
    transaction_id.map(|txid| format!("/p/{txid}"))
}

fn public_file_path(transaction_id: Option<&String>) -> Option<String> {
    transaction_id.map(|txid| format!("/api/v1/documents/by-transaction/{txid}/file"))
}

fn private_file_path(document_id: &str, document: &core_document::Document) -> Option<String> {
    document_has_stored_file(document).then(|| format!("/api/v1/documents/{document_id}/file"))
}

fn document_has_stored_file(document: &core_document::Document) -> bool {
    document
        .metadata
        .as_ref()
        .and_then(|metadata| metadata.get("storedFile"))
        .and_then(|value| value.as_bool())
        .unwrap_or(false)
}

fn document_content_type(document: &core_document::Document) -> Option<String> {
    document
        .metadata
        .as_ref()
        .and_then(|metadata| metadata.get("fileType"))
        .and_then(|value| value.as_str())
        .map(ToString::to_string)
}

fn document_file_size_bytes(document: &core_document::Document) -> Option<u64> {
    document
        .metadata
        .as_ref()
        .and_then(|metadata| metadata.get("fileSize"))
        .and_then(|value| value.as_u64())
}

fn merge_file_metadata(
    metadata: Option<Value>,
    file_size: u64,
    content_type: Option<&str>,
) -> Result<Option<Value>, String> {
    let mut object = match metadata {
        Some(Value::Object(map)) => map,
        Some(_) => return Err("metadata must be a JSON object".to_string()),
        None => serde_json::Map::new(),
    };

    object.insert("fileSize".to_string(), Value::from(file_size));
    object.insert(
        "fileType".to_string(),
        Value::from(content_type.unwrap_or("application/octet-stream")),
    );
    object.insert("storedFile".to_string(), Value::from(true));

    Ok(Some(Value::Object(object)))
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
    let doc = match billing::register_document_with_credits(
        &state.pool,
        new,
        state.billing.document_registration_credit_cost,
    )
    .await
    {
        Ok(d) => d,
        Err(BillingError::InsufficientCredits { required, available }) => {
            return err_json(
                StatusCode::PAYMENT_REQUIRED,
                format!("insufficient credits: required {required}, available {available}"),
            )
        }
        Err(error) => {
            return err_json(StatusCode::INTERNAL_SERVER_ERROR, format!("billing: {error}"));
        }
    };
    ok_json(RegisterDocumentResponse {
        document_id: doc.id.clone(),
        file_hash: doc.file_hash.clone(),
        transaction_id: doc.transaction_id.clone(),
        file_url: private_file_path(&doc.id, &doc),
        status: doc.status.clone(),
        created_at: doc.created_at,
    })
}

pub async fn register_upload(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> axum::response::Response {
    let session = match auth::require_verified_session_or_api_key(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    let mut filename: Option<String> = None;
    let mut content_type: Option<String> = None;
    let mut file_bytes: Option<Vec<u8>> = None;
    let mut metadata: Option<Value> = None;

    loop {
        let Some(field) = (match multipart.next_field().await {
            Ok(value) => value,
            Err(error) => {
                return err_json(StatusCode::BAD_REQUEST, format!("invalid multipart payload: {error}"));
            }
        }) else {
            break;
        };

        match field.name() {
            Some("file") => {
                filename = field.file_name().map(ToString::to_string);
                content_type = field.content_type().map(ToString::to_string);
                let bytes = match field.bytes().await {
                    Ok(value) => value,
                    Err(error) => {
                        return err_json(StatusCode::BAD_REQUEST, format!("invalid file payload: {error}"));
                    }
                };
                if bytes.len() > state.storage.document_upload_max_bytes {
                    return err_json(
                        StatusCode::PAYLOAD_TOO_LARGE,
                        format!(
                            "file exceeds the {} byte limit",
                            state.storage.document_upload_max_bytes
                        ),
                    );
                }
                file_bytes = Some(bytes.to_vec());
            }
            Some("metadata") => {
                let raw = match field.text().await {
                    Ok(value) => value,
                    Err(error) => {
                        return err_json(StatusCode::BAD_REQUEST, format!("invalid metadata payload: {error}"));
                    }
                };
                if !raw.trim().is_empty() {
                    metadata = match serde_json::from_str::<Value>(&raw) {
                        Ok(value) => Some(value),
                        Err(error) => {
                            return err_json(StatusCode::BAD_REQUEST, format!("metadata must be valid json: {error}"));
                        }
                    };
                }
            }
            _ => {}
        }
    }

    let Some(file_bytes) = file_bytes else {
        return err_json(StatusCode::BAD_REQUEST, "file is required");
    };

    let original_filename = filename.unwrap_or_else(|| "archivo.bin".to_string());
    let file_hash = hex::encode(Sha256::digest(file_bytes.as_slice()));
    let merged_metadata = match merge_file_metadata(metadata, file_bytes.len() as u64, content_type.as_deref()) {
        Ok(value) => value,
        Err(message) => return err_json(StatusCode::BAD_REQUEST, message),
    };

    let id = DocumentId::new();
    let document_id = id.0.to_string();
    let file_path = storage::document_file_path(
        &state.storage.document_storage_dir,
        &document_id,
        &original_filename,
    );

    if let Some(parent) = file_path.parent() {
        if let Err(error) = fs::create_dir_all(parent).await {
            return err_json(StatusCode::INTERNAL_SERVER_ERROR, format!("file storage: {error}"));
        }
    }

    if let Err(error) = fs::write(&file_path, &file_bytes).await {
        return err_json(StatusCode::INTERNAL_SERVER_ERROR, format!("file storage: {error}"));
    }

    let new = NewDocument {
        id,
        file_hash,
        filename: original_filename,
        user_id: session.subject.user_id,
        metadata: merged_metadata,
    };

    let doc = match billing::register_document_with_credits(
        &state.pool,
        new,
        state.billing.document_registration_credit_cost,
    )
    .await
    {
        Ok(document) => document,
        Err(BillingError::InsufficientCredits { required, available }) => {
            let _ = fs::remove_file(&file_path).await;
            return err_json(
                StatusCode::PAYMENT_REQUIRED,
                format!("insufficient credits: required {required}, available {available}"),
            );
        }
        Err(error) => {
            let _ = fs::remove_file(&file_path).await;
            return err_json(StatusCode::INTERNAL_SERVER_ERROR, format!("billing: {error}"));
        }
    };

    ok_json(RegisterDocumentResponse {
        document_id: doc.id.clone(),
        file_hash: doc.file_hash.clone(),
        transaction_id: doc.transaction_id.clone(),
        file_url: private_file_path(&doc.id, &doc),
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
            public_proof_path: None,
            block_height: None,
            timestamp: None,
            confirmations: None,
        });
    };
    ok_json(VerifyDocumentResponse {
        exists: true,
        transaction_id: d.transaction_id.clone(),
        public_proof_path: public_proof_path(d.transaction_id.as_ref()),
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
        content_type: document_content_type(document),
        file_size_bytes: document_file_size_bytes(document),
        metadata: document.metadata.clone(),
        transaction_id: document.transaction_id.clone(),
        file_url: private_file_path(&document.id, document),
        public_file_url: public_file_path(document.transaction_id.as_ref()),
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
        filename: document.filename.clone(),
        content_type: document_content_type(document),
        file_size_bytes: document_file_size_bytes(document),
        transaction_id: document.transaction_id.clone(),
        public_proof_path: public_proof_path(document.transaction_id.as_ref()),
        public_file_url: public_file_path(document.transaction_id.as_ref()),
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

pub async fn download_private_file(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> axum::response::Response {
    let session = match auth::require_verified_session_or_api_key(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };
    let Ok(uid) = Uuid::parse_str(&id) else {
        return err_json(StatusCode::BAD_REQUEST, "invalid id");
    };
    let Some(document) = (match documents::find_by_id(&state.pool, DocumentId(uid)).await {
        Ok(value) => value,
        Err(error) => return err_json(StatusCode::INTERNAL_SERVER_ERROR, format!("db: {error}")),
    }) else {
        return err_json(StatusCode::NOT_FOUND, "not found");
    };

    if let Err(error) = state
        .perms
        .enforce_document_owner(&session.subject, document.user_id)
        .await
    {
        return authorization_error_response(error);
    }

    send_document_file(&state, &document).await
}

pub async fn download_public_file(
    State(state): State<Arc<AppState>>,
    Path(txid): Path<String>,
) -> axum::response::Response {
    let Some(document) = (match documents::find_by_transaction_id(&state.pool, &txid).await {
        Ok(value) => value,
        Err(error) => return err_json(StatusCode::INTERNAL_SERVER_ERROR, format!("db: {error}")),
    }) else {
        return err_json(StatusCode::NOT_FOUND, "not found");
    };

    send_document_file(&state, &document).await
}

async fn send_document_file(
    state: &Arc<AppState>,
    document: &core_document::Document,
) -> axum::response::Response {
    if !document_has_stored_file(document) {
        return err_json(StatusCode::NOT_FOUND, "document file not available");
    }

    let path = storage::document_file_path(
        &state.storage.document_storage_dir,
        &document.id,
        &document.filename,
    );
    let bytes = match fs::read(&path).await {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return err_json(StatusCode::NOT_FOUND, "document file not found");
        }
        Err(error) => {
            return err_json(StatusCode::INTERNAL_SERVER_ERROR, format!("file storage: {error}"));
        }
    };

    let mut headers = HeaderMap::new();
    let content_type = document_content_type(document).unwrap_or_else(|| "application/octet-stream".to_string());
    if let Ok(value) = HeaderValue::from_str(&content_type) {
        headers.insert(CONTENT_TYPE, value);
    }
    if let Ok(value) = HeaderValue::from_str(&format!("inline; filename=\"{}\"", storage::sanitize_filename(&document.filename))) {
        headers.insert(CONTENT_DISPOSITION, value);
    }

    (headers, bytes).into_response()
}
