use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::Json;
use openproof_app::api_keys;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth;
use crate::error::{err_json, ok_json};
use crate::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateApiKeyRequest {
    pub name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyResponse {
    pub id: String,
    pub name: String,
    pub key_prefix: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_used_at: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub revoked_at: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotated_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateApiKeyResponse {
    pub api_key: ApiKeyResponse,
    pub plain_text_key: String,
}

pub async fn list_api_keys(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> axum::response::Response {
    let session = match auth::require_verified_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    let api_keys = match api_keys::list_api_keys_for_user(&state.pool, session.subject.user_id).await {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    };

    ok_json(api_keys.iter().map(map_api_key).collect::<Vec<_>>())
}

pub async fn create_api_key(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(body): Json<CreateApiKeyRequest>,
) -> axum::response::Response {
    let session = match auth::require_verified_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    let Some(name) = normalize_name(&body.name) else {
        return err_json(StatusCode::BAD_REQUEST, "api key name is required");
    };

    let plain_text_key = auth::generate_api_key();
    let key_hash = auth::hash_token(&plain_text_key);
    let key_prefix = auth::key_prefix(&plain_text_key);
    let api_key = match api_keys::create_api_key(
        &state.pool,
        session.subject.user_id,
        &name,
        &key_prefix,
        &key_hash,
    )
    .await
    {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    };

    auth::json_with_cookie(
        StatusCode::CREATED,
        CreateApiKeyResponse {
            api_key: map_api_key(&api_key),
            plain_text_key,
        },
        None,
    )
}

pub async fn revoke_api_key(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> axum::response::Response {
    let session = match auth::require_verified_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    let Ok(api_key_id) = Uuid::parse_str(&id) else {
        return err_json(StatusCode::BAD_REQUEST, "invalid api key id");
    };

    let api_key = match api_keys::revoke_api_key_for_user(&state.pool, session.subject.user_id, api_key_id).await {
        Ok(Some(value)) => value,
        Ok(None) => return err_json(StatusCode::NOT_FOUND, "api key not found"),
        Err(error) => return auth::internal_error(error),
    };

    ok_json(map_api_key(&api_key))
}

pub async fn rotate_api_key(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> axum::response::Response {
    let session = match auth::require_verified_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    let Ok(api_key_id) = Uuid::parse_str(&id) else {
        return err_json(StatusCode::BAD_REQUEST, "invalid api key id");
    };

    let plain_text_key = auth::generate_api_key();
    let key_hash = auth::hash_token(&plain_text_key);
    let key_prefix = auth::key_prefix(&plain_text_key);
    let api_key = match api_keys::rotate_api_key_for_user(
        &state.pool,
        session.subject.user_id,
        api_key_id,
        &key_prefix,
        &key_hash,
    )
    .await
    {
        Ok(Some(value)) => value,
        Ok(None) => return err_json(StatusCode::NOT_FOUND, "api key not found"),
        Err(error) => return auth::internal_error(error),
    };

    ok_json(CreateApiKeyResponse {
        api_key: map_api_key(&api_key),
        plain_text_key,
    })
}

fn map_api_key(api_key: &api_keys::ApiKeyRecord) -> ApiKeyResponse {
    ApiKeyResponse {
        id: api_key.id.to_string(),
        name: api_key.name.clone(),
        key_prefix: api_key.key_prefix.clone(),
        last_used_at: api_key.last_used_at,
        revoked_at: api_key.revoked_at,
        rotated_at: api_key.rotated_at,
        created_at: api_key.created_at,
        updated_at: api_key.updated_at,
    }
}

fn normalize_name(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.len() > 80 {
        return None;
    }
    Some(trimmed.to_string())
}