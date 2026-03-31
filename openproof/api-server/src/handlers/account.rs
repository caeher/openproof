use std::sync::Arc;

use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::Json;
use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use openproof_app::{api_keys, audit, billing, sessions, users};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::auth;
use crate::error::{err_json, ok_json};
use crate::AppState;

const AVATAR_DATA_URL_PREFIX: &str = "data:image/webp;base64,";
const AVATAR_MAX_BYTES: usize = 350 * 1024;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountUserResponse {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: String,
    pub email_verified: bool,
    pub avatar_url: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreditAccountResponse {
    pub balance_credits: i64,
    pub purchased_credits: i64,
    pub consumed_credits: i64,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountProfileResponse {
    pub user: AccountUserResponse,
    pub credit_account: CreditAccountResponse,
    pub active_api_keys: i64,
    pub environment: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAvatarRequest {
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordResponse {
    pub message: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAvatarResponse {
    pub message: String,
    pub user: AccountUserResponse,
}

pub async fn profile(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> axum::response::Response {
    let session = match auth::require_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    let credit_account = match billing::get_credit_account_summary(&state.pool, session.subject.user_id).await {
        Ok(value) => value,
        Err(error) => return err_json(StatusCode::INTERNAL_SERVER_ERROR, error.to_string()),
    };
    let active_api_keys = match api_keys::count_active_api_keys_for_user(&state.pool, session.subject.user_id).await {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    };

    ok_json(AccountProfileResponse {
        user: map_user(&session.user),
        credit_account: CreditAccountResponse {
            balance_credits: credit_account.balance_credits,
            purchased_credits: credit_account.purchased_credits,
            consumed_credits: credit_account.consumed_credits,
            updated_at: credit_account.updated_at,
        },
        active_api_keys,
        environment: state.runtime.app_env.clone(),
    })
}

pub async fn change_password(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(body): Json<ChangePasswordRequest>,
) -> axum::response::Response {
    let session = match auth::require_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    if let Err(message) = auth::validate_password(&body.new_password) {
        return err_json(StatusCode::BAD_REQUEST, message);
    }

    let auth_record = match users::find_auth_by_id(&state.pool, session.subject.user_id).await {
        Ok(Some(value)) => value,
        Ok(None) => return err_json(StatusCode::NOT_FOUND, "user not found"),
        Err(error) => return auth::internal_error(error),
    };

    if !auth::verify_password(&body.current_password, &auth_record.password_hash) {
        let _ = audit::record_event(
            &state.pool,
            audit::NewAuditEvent {
                actor_user_id: Some(session.subject.user_id),
                actor_email: Some(&session.user.email),
                actor_role: Some(&session.user.role),
                action: "account.change_password",
                target_type: Some("user"),
                target_id: Some(&session.subject.user_id.to_string()),
                status: "denied",
                message: Some("invalid current password"),
                metadata: None,
            },
        )
        .await;
        return err_json(StatusCode::UNAUTHORIZED, "current password is invalid");
    }

    let password_hash = match auth::hash_password(&body.new_password) {
        Ok(value) => value,
        Err(message) => return err_json(StatusCode::INTERNAL_SERVER_ERROR, message),
    };

    if let Err(error) = users::update_password_for_user(&state.pool, session.subject.user_id, &password_hash).await {
        return auth::internal_error(error);
    }

    if let Err(error) = sessions::invalidate_sessions_for_user(&state.pool, session.subject.user_id).await {
        return auth::internal_error(error);
    }

    let new_session_token = auth::generate_token();
    let new_session_hash = auth::hash_token(&new_session_token);
    if let Err(error) = sessions::create_session(
        &state.pool,
        session.subject.user_id,
        &new_session_hash,
        auth::session_expires_at(state.as_ref()),
    )
    .await
    {
        return auth::internal_error(error);
    }

    let _ = audit::record_event(
        &state.pool,
        audit::NewAuditEvent {
            actor_user_id: Some(session.subject.user_id),
            actor_email: Some(&session.user.email),
            actor_role: Some(&session.user.role),
            action: "account.change_password",
            target_type: Some("user"),
            target_id: Some(&session.subject.user_id.to_string()),
            status: "success",
            message: Some("password rotated"),
            metadata: Some(json!({ "environment": state.runtime.app_env })),
        },
    )
    .await;

    auth::json_with_cookie(
        StatusCode::OK,
        ChangePasswordResponse {
            message: "password updated".to_string(),
        },
        Some(auth::session_cookie(state.as_ref(), &new_session_token)),
    )
}

pub async fn update_avatar(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(body): Json<UpdateAvatarRequest>,
) -> axum::response::Response {
    let session = match auth::require_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    let avatar_url = match normalize_avatar_url(body.avatar_url) {
        Ok(value) => value,
        Err(message) => return err_json(StatusCode::BAD_REQUEST, message),
    };

    let updated_user = match users::update_avatar_for_user(
        &state.pool,
        session.subject.user_id,
        avatar_url.as_deref(),
    )
    .await
    {
        Ok(Some(value)) => value,
        Ok(None) => return err_json(StatusCode::NOT_FOUND, "user not found"),
        Err(error) => return auth::internal_error(error),
    };

    let avatar_updated = avatar_url.is_some();
    let _ = audit::record_event(
        &state.pool,
        audit::NewAuditEvent {
            actor_user_id: Some(session.subject.user_id),
            actor_email: Some(&session.user.email),
            actor_role: Some(&session.user.role),
            action: "account.update_avatar",
            target_type: Some("user"),
            target_id: Some(&session.subject.user_id.to_string()),
            status: "success",
            message: Some(if avatar_updated {
                "avatar updated"
            } else {
                "avatar cleared"
            }),
            metadata: Some(json!({ "hasAvatar": avatar_updated })),
        },
    )
    .await;

    ok_json(UpdateAvatarResponse {
        message: if avatar_updated {
            "avatar updated".to_string()
        } else {
            "avatar cleared".to_string()
        },
        user: map_user(&updated_user),
    })
}

fn map_user(user: &users::UserRecord) -> AccountUserResponse {
    AccountUserResponse {
        id: user.id.to_string(),
        name: user.name.clone(),
        email: user.email.clone(),
        role: user.role.clone(),
        email_verified: user.is_email_verified(),
        avatar_url: user.avatar_url.clone(),
        created_at: user.created_at,
    }
}

fn normalize_avatar_url(avatar_url: Option<String>) -> Result<Option<String>, String> {
    let Some(raw_avatar_url) = avatar_url else {
        return Ok(None);
    };

    let trimmed = raw_avatar_url.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }

    let Some(encoded) = trimmed.strip_prefix(AVATAR_DATA_URL_PREFIX) else {
        return Err("avatar must be a webp data URL".to_string());
    };

    let bytes = STANDARD
        .decode(encoded)
        .map_err(|_| "avatar must be valid base64".to_string())?;

    if bytes.is_empty() {
        return Err("avatar cannot be empty".to_string());
    }

    if bytes.len() > AVATAR_MAX_BYTES {
        return Err("avatar exceeds the 350 KB limit".to_string());
    }

    Ok(Some(trimmed.to_string()))
}