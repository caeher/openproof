use std::sync::Arc;

use argon2::password_hash::rand_core::{OsRng, RngCore};
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use axum::http::header::{AUTHORIZATION, COOKIE, SET_COOKIE};
use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use chrono::{DateTime, Duration, Utc};
use lib_authz::{Role, Subject};
use openproof_app::api_keys;
use openproof_app::sessions;
use openproof_app::users::UserRecord;
use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::error::ApiResponse;
use crate::AppState;

const MIN_PASSWORD_LEN: usize = 8;

#[derive(Debug, Clone)]
pub struct AuthenticatedSession {
    pub subject: Subject,
    pub user: UserRecord,
    pub session_token_hash: Option<Vec<u8>>,
}

pub fn normalize_email(value: &str) -> Option<String> {
    let normalized = value.trim().to_lowercase();
    if normalized.is_empty() || !normalized.contains('@') {
        return None;
    }
    Some(normalized)
}

pub fn validate_password(password: &str) -> Result<(), String> {
    if password.len() < MIN_PASSWORD_LEN {
        return Err(format!("password must be at least {MIN_PASSWORD_LEN} characters"));
    }
    Ok(())
}

pub fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|value| value.to_string())
        .map_err(|error| format!("password hash: {error}"))
}

pub fn verify_password(password: &str, password_hash: &str) -> bool {
    let Ok(parsed_hash) = PasswordHash::new(password_hash) else {
        return false;
    };
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok()
}

pub fn generate_token() -> String {
    let mut bytes = [0_u8; 32];
    OsRng.fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

pub fn generate_api_key() -> String {
    format!("opk_{}", generate_token())
}

pub fn key_prefix(token: &str) -> String {
    token.chars().take(16).collect()
}

pub fn hash_token(token: &str) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    hasher.finalize().to_vec()
}

pub fn session_expires_at(state: &AppState) -> DateTime<Utc> {
    Utc::now() + Duration::hours(state.auth.session_ttl_hours)
}

pub fn verification_token_expires_at(state: &AppState) -> DateTime<Utc> {
    Utc::now() + Duration::hours(state.auth.verification_token_ttl_hours)
}

pub fn reset_token_expires_at(state: &AppState) -> DateTime<Utc> {
    Utc::now() + Duration::hours(state.auth.password_reset_token_ttl_hours)
}

pub async fn maybe_session(
    headers: &HeaderMap,
    state: &Arc<AppState>,
) -> Result<Option<AuthenticatedSession>, Response> {
    let Some(token) = cookie_value(headers, &state.auth.session_cookie_name) else {
        return Ok(None);
    };

    let token_hash = hash_token(&token);
    let record = sessions::get_user_by_token_hash(&state.pool, &token_hash)
        .await
        .map_err(internal_error)?;

    let Some(record) = record else {
        return Ok(None);
    };

    let role = Role::from_str(&record.user.role).unwrap_or(Role::User);
    Ok(Some(AuthenticatedSession {
        subject: Subject {
            user_id: record.user.id,
            role,
            email_verified: record.user.is_email_verified(),
        },
        user: record.user,
        session_token_hash: Some(token_hash),
    }))
}

pub async fn maybe_api_key(
    headers: &HeaderMap,
    state: &Arc<AppState>,
) -> Result<Option<AuthenticatedSession>, Response> {
    let Some(token) = bearer_token(headers) else {
        return Ok(None);
    };

    let token_hash = hash_token(&token);
    let record = api_keys::find_user_by_key_hash(&state.pool, &token_hash)
        .await
        .map_err(internal_error)?;

    let Some(record) = record else {
        return Ok(None);
    };

    api_keys::touch_api_key_usage(&state.pool, record.api_key.id)
        .await
        .map_err(internal_error)?;

    let role = Role::from_str(&record.user.role).unwrap_or(Role::User);
    Ok(Some(AuthenticatedSession {
        subject: Subject {
            user_id: record.user.id,
            role,
            email_verified: record.user.is_email_verified(),
        },
        user: record.user,
        session_token_hash: None,
    }))
}

pub async fn maybe_session_or_api_key(
    headers: &HeaderMap,
    state: &Arc<AppState>,
) -> Result<Option<AuthenticatedSession>, Response> {
    if let Some(session) = maybe_session(headers, state).await? {
        return Ok(Some(session));
    }

    maybe_api_key(headers, state).await
}

pub async fn require_session(
    headers: &HeaderMap,
    state: &Arc<AppState>,
) -> Result<AuthenticatedSession, Response> {
    maybe_session(headers, state)
        .await?
        .ok_or_else(|| error_json(StatusCode::UNAUTHORIZED, "authentication required"))
}

pub async fn require_session_or_api_key(
    headers: &HeaderMap,
    state: &Arc<AppState>,
) -> Result<AuthenticatedSession, Response> {
    maybe_session_or_api_key(headers, state)
        .await?
        .ok_or_else(|| error_json(StatusCode::UNAUTHORIZED, "authentication required"))
}

pub async fn require_verified_session(
    headers: &HeaderMap,
    state: &Arc<AppState>,
) -> Result<AuthenticatedSession, Response> {
    let session = require_session(headers, state).await?;
    state
        .perms
        .enforce_verified_email(&session.subject)
        .await
        .map_err(|_| error_json(StatusCode::FORBIDDEN, "email verification required"))?;
    Ok(session)
}

pub async fn require_verified_session_or_api_key(
    headers: &HeaderMap,
    state: &Arc<AppState>,
) -> Result<AuthenticatedSession, Response> {
    let session = require_session_or_api_key(headers, state).await?;
    state
        .perms
        .enforce_verified_email(&session.subject)
        .await
        .map_err(|_| error_json(StatusCode::FORBIDDEN, "email verification required"))?;
    Ok(session)
}

pub async fn require_admin_session(
    headers: &HeaderMap,
    state: &Arc<AppState>,
) -> Result<AuthenticatedSession, Response> {
    let session = require_verified_session(headers, state).await?;
    if session.subject.role != Role::Admin {
        return Err(error_json(StatusCode::FORBIDDEN, "admin role required"));
    }
    Ok(session)
}

pub fn session_cookie(state: &AppState, token: &str) -> String {
    let max_age_seconds = state.auth.session_ttl_hours * 3600;
    let secure = if state.auth.secure_cookies {
        "; Secure"
    } else {
        ""
    };
    format!(
        "{}={}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age_seconds}{}",
        state.auth.session_cookie_name, token, secure,
    )
}

pub fn clear_session_cookie(state: &AppState) -> String {
    let secure = if state.auth.secure_cookies {
        "; Secure"
    } else {
        ""
    };
    format!(
        "{}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT{}",
        state.auth.session_cookie_name, secure,
    )
}

pub fn json_with_cookie<T: Serialize>(
    status: StatusCode,
    data: T,
    cookie: Option<String>,
) -> Response {
    let mut response = (
        status,
        axum::Json(ApiResponse {
            success: true,
            data: Some(data),
            error: None,
        }),
    )
        .into_response();

    if let Some(value) = cookie {
        if let Ok(header) = HeaderValue::from_str(&value) {
            response.headers_mut().append(SET_COOKIE, header);
        }
    }

    response
}

pub fn error_json(status: StatusCode, message: impl Into<String>) -> Response {
    (
        status,
        axum::Json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(message.into()),
        }),
    )
        .into_response()
}

pub fn internal_error(error: sqlx::Error) -> Response {
    error_json(StatusCode::INTERNAL_SERVER_ERROR, format!("db: {error}"))
}

fn cookie_value(headers: &HeaderMap, cookie_name: &str) -> Option<String> {
    let cookies = headers.get(COOKIE)?.to_str().ok()?;
    cookies.split(';').find_map(|part| {
        let (name, value) = part.trim().split_once('=')?;
        if name == cookie_name {
            return Some(value.to_string());
        }
        None
    })
}

fn bearer_token(headers: &HeaderMap) -> Option<String> {
    let value = headers.get(AUTHORIZATION)?.to_str().ok()?;
    let mut parts = value.split_whitespace();
    let scheme = parts.next()?;
    let token = parts.next()?;
    if !scheme.eq_ignore_ascii_case("bearer") || token.trim().is_empty() {
        return None;
    }
    Some(token.trim().to_string())
}