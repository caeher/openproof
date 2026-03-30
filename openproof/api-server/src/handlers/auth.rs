use std::sync::Arc;

use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::Json;
use openproof_app::{sessions, users};
use serde::{Deserialize, Serialize};

use crate::auth;
use crate::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignupRequest {
    pub name: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyEmailRequest {
    pub token: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForgotPasswordRequest {
    pub email: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResendVerificationRequest {
    pub email: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetPasswordRequest {
    pub token: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthUserResponse {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: String,
    pub email_verified: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionResponse {
    pub user: AuthUserResponse,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignupResponse {
    pub user: AuthUserResponse,
    pub email_verification_required: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dev_verification_token: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResendVerificationResponse {
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dev_verification_token: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusResponse {
    pub message: String,
}

pub async fn signup(
    State(state): State<Arc<AppState>>,
    Json(body): Json<SignupRequest>,
) -> axum::response::Response {
    let Some(name) = auth::normalize_user_name(&body.name) else {
        return auth::error_json(StatusCode::BAD_REQUEST, "name is required");
    };
    let Some(email) = auth::normalize_email(&body.email) else {
        return auth::error_json(StatusCode::BAD_REQUEST, "valid email is required");
    };
    if let Err(message) = auth::validate_password(&body.password) {
        return auth::error_json(StatusCode::BAD_REQUEST, message);
    }

    let password_hash = match auth::hash_password(&body.password) {
        Ok(value) => value,
        Err(message) => return auth::error_json(StatusCode::INTERNAL_SERVER_ERROR, message),
    };

    let user = match users::create_user_with_password(&state.pool, &name, &email, &password_hash).await {
        Ok(value) => value,
        Err(sqlx::Error::Database(error)) if error.code().as_deref() == Some("23505") => {
            return auth::error_json(StatusCode::CONFLICT, "email already exists");
        }
        Err(error) => return auth::internal_error(error),
    };

    let verification_token = auth::generate_token();
    let verification_token_hash = auth::hash_token(&verification_token);
    if let Err(error) = users::store_email_verification_token(
        &state.pool,
        user.id,
        &verification_token_hash,
        auth::verification_token_expires_at(state.as_ref()),
    )
    .await
    {
        return auth::internal_error(error);
    }

    if let Err(error) = state
        .mailer
        .send_verification_email(&user.email, &user.name, &verification_token)
        .await
    {
        tracing::error!(email = %user.email, error = %error, "failed to send verification email after signup");
    }

    auth::json_with_cookie(
        StatusCode::CREATED,
        SignupResponse {
            user: map_user(&user),
            email_verification_required: true,
            dev_verification_token: state
                .auth
                .expose_dev_auth_tokens
                .then_some(verification_token),
        },
        None,
    )
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(body): Json<LoginRequest>,
) -> axum::response::Response {
    let Some(email) = auth::normalize_email(&body.email) else {
        return auth::error_json(StatusCode::BAD_REQUEST, "valid email is required");
    };

    let Some(auth_record) = (match users::find_auth_by_email(&state.pool, &email).await {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    }) else {
        return auth::error_json(StatusCode::UNAUTHORIZED, "invalid credentials");
    };

    if !auth::verify_password(&body.password, &auth_record.password_hash) {
        return auth::error_json(StatusCode::UNAUTHORIZED, "invalid credentials");
    }

    let session_token = auth::generate_token();
    let session_token_hash = auth::hash_token(&session_token);
    if let Err(error) = sessions::create_session(
        &state.pool,
        auth_record.user.id,
        &session_token_hash,
        auth::session_expires_at(state.as_ref()),
    )
    .await
    {
        return auth::internal_error(error);
    }

    auth::json_with_cookie(
        StatusCode::OK,
        SessionResponse {
            user: map_user(&auth_record.user),
        },
        Some(auth::session_cookie(state.as_ref(), &session_token)),
    )
}

pub async fn logout(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> axum::response::Response {
    if let Ok(Some(session)) = auth::maybe_session(&headers, &state).await {
        if let Some(token_hash) = session.session_token_hash.as_deref() {
            if let Err(error) = sessions::invalidate_session_by_token_hash(&state.pool, token_hash).await {
                return auth::internal_error(error);
            }
        }
    }

    auth::json_with_cookie(
        StatusCode::OK,
        StatusResponse {
            message: "logged out".to_string(),
        },
        Some(auth::clear_session_cookie(state.as_ref())),
    )
}

pub async fn resend_verification(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(body): Json<ResendVerificationRequest>,
) -> axum::response::Response {
    let session = match auth::maybe_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    let maybe_user = if let Some(session) = session {
        Some(session.user)
    } else {
        let Some(email) = body.email.as_deref().and_then(auth::normalize_email) else {
            return auth::error_json(StatusCode::BAD_REQUEST, "valid email is required");
        };

        match users::find_by_email(&state.pool, &email).await {
            Ok(value) => value,
            Err(error) => return auth::internal_error(error),
        }
    };

    let mut dev_verification_token = None;
    if let Some(user) = maybe_user {
        if !user.is_email_verified() {
            let verification_token = auth::generate_token();
            let verification_token_hash = auth::hash_token(&verification_token);
            if let Err(error) = users::store_email_verification_token(
                &state.pool,
                user.id,
                &verification_token_hash,
                auth::verification_token_expires_at(state.as_ref()),
            )
            .await
            {
                return auth::internal_error(error);
            }

            if let Err(error) = state
                .mailer
                .send_verification_email(&user.email, &user.name, &verification_token)
                .await
            {
                tracing::error!(email = %user.email, error = %error, "failed to resend verification email");
            }

            if state.auth.expose_dev_auth_tokens {
                dev_verification_token = Some(verification_token);
            }
        }
    }

    auth::json_with_cookie(
        StatusCode::OK,
        ResendVerificationResponse {
            message: "if the account exists and is pending verification, instructions were generated".to_string(),
            dev_verification_token,
        },
        None,
    )
}

pub async fn verify_email(
    State(state): State<Arc<AppState>>,
    Json(body): Json<VerifyEmailRequest>,
) -> axum::response::Response {
    if body.token.trim().is_empty() {
        return auth::error_json(StatusCode::BAD_REQUEST, "token is required");
    }

    let token_hash = auth::hash_token(body.token.trim());
    let Some(user) = (match users::consume_email_verification_token(&state.pool, &token_hash).await {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    }) else {
        return auth::error_json(StatusCode::BAD_REQUEST, "invalid or expired token");
    };

    auth::json_with_cookie(
        StatusCode::OK,
        SessionResponse { user: map_user(&user) },
        None,
    )
}

pub async fn forgot_password(
    State(state): State<Arc<AppState>>,
    Json(body): Json<ForgotPasswordRequest>,
) -> axum::response::Response {
    let Some(email) = auth::normalize_email(&body.email) else {
        return auth::error_json(StatusCode::BAD_REQUEST, "valid email is required");
    };

    let maybe_user = match users::find_by_email(&state.pool, &email).await {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    };

    let mut dev_reset_token = None;
    if let Some(user) = maybe_user {
        let reset_token = auth::generate_token();
        let reset_token_hash = auth::hash_token(&reset_token);
        if let Err(error) = users::store_password_reset_token(
            &state.pool,
            user.id,
            &reset_token_hash,
            auth::reset_token_expires_at(state.as_ref()),
        )
        .await
        {
            return auth::internal_error(error);
        }
        if let Err(error) = state
            .mailer
            .send_password_reset_email(&user.email, &user.name, &reset_token)
            .await
        {
            tracing::error!(email = %user.email, error = %error, "failed to send password reset email");
        }
        if state.auth.expose_dev_auth_tokens {
            dev_reset_token = Some(reset_token);
        }
    }

    auth::json_with_cookie(
        StatusCode::OK,
        serde_json::json!({
            "message": "if the account exists, password reset instructions were generated",
            "devResetToken": dev_reset_token,
        }),
        None,
    )
}

pub async fn reset_password(
    State(state): State<Arc<AppState>>,
    Json(body): Json<ResetPasswordRequest>,
) -> axum::response::Response {
    if body.token.trim().is_empty() {
        return auth::error_json(StatusCode::BAD_REQUEST, "token is required");
    }
    if let Err(message) = auth::validate_password(&body.password) {
        return auth::error_json(StatusCode::BAD_REQUEST, message);
    }

    let password_hash = match auth::hash_password(&body.password) {
        Ok(value) => value,
        Err(message) => return auth::error_json(StatusCode::INTERNAL_SERVER_ERROR, message),
    };
    let token_hash = auth::hash_token(body.token.trim());
    let Some(user) = (match users::consume_password_reset_token(&state.pool, &token_hash, &password_hash).await {
        Ok(value) => value,
        Err(error) => return auth::internal_error(error),
    }) else {
        return auth::error_json(StatusCode::BAD_REQUEST, "invalid or expired token");
    };

    if let Err(error) = sessions::invalidate_sessions_for_user(&state.pool, user.id).await {
        return auth::internal_error(error);
    }

    auth::json_with_cookie(
        StatusCode::OK,
        StatusResponse {
            message: "password updated".to_string(),
        },
        Some(auth::clear_session_cookie(state.as_ref())),
    )
}

pub async fn session(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> axum::response::Response {
    let session = match auth::require_session(&headers, &state).await {
        Ok(value) => value,
        Err(response) => return response,
    };

    auth::json_with_cookie(
        StatusCode::OK,
        SessionResponse {
            user: map_user(&session.user),
        },
        None,
    )
}

fn map_user(user: &users::UserRecord) -> AuthUserResponse {
    AuthUserResponse {
        id: user.id.to_string(),
        name: user.name.clone(),
        email: user.email.clone(),
        role: user.role.clone(),
        email_verified: user.is_email_verified(),
        created_at: user.created_at,
    }
}