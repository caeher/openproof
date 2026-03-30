use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::users::UserRecord;

#[derive(Debug, Clone)]
pub struct SessionRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub expires_at: DateTime<Utc>,
    pub invalidated_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct SessionUserRecord {
    pub session: SessionRecord,
    pub user: UserRecord,
}

fn row_to_session(row: &sqlx::postgres::PgRow) -> SessionRecord {
    SessionRecord {
        id: row.get("session_id"),
        user_id: row.get("session_user_id"),
        expires_at: row.get("session_expires_at"),
        invalidated_at: row.try_get("session_invalidated_at").ok().flatten(),
        created_at: row.get("session_created_at"),
        updated_at: row.get("session_updated_at"),
    }
}

fn row_to_user(row: &sqlx::postgres::PgRow) -> UserRecord {
    UserRecord {
        id: row.get("user_id"),
        name: row.get("name"),
        email: row.get("email"),
        role: row.get("role"),
        email_verified_at: row.try_get("email_verified_at").ok().flatten(),
        created_at: row.get("user_created_at"),
        updated_at: row.get("user_updated_at"),
    }
}

pub async fn create_session(
    pool: &PgPool,
    user_id: Uuid,
    token_hash: &[u8],
    expires_at: DateTime<Utc>,
) -> Result<SessionRecord, sqlx::Error> {
    let now = Utc::now();
    let session_id = Uuid::now_v7();

    sqlx::query(
        r#"
        INSERT INTO sessions (id, user_id, token_hash, expires_at, invalidated_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NULL, $5, $6)
        "#,
    )
    .bind(session_id)
    .bind(user_id)
    .bind(token_hash)
    .bind(expires_at)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?;

    let row = sqlx::query(
        r#"
        SELECT
            s.id AS session_id,
            s.user_id AS session_user_id,
            s.expires_at AS session_expires_at,
            s.invalidated_at AS session_invalidated_at,
            s.created_at AS session_created_at,
            s.updated_at AS session_updated_at
        FROM sessions s
        WHERE s.id = $1
        "#,
    )
    .bind(session_id)
    .fetch_one(pool)
    .await?;

    Ok(row_to_session(&row))
}

pub async fn get_user_by_token_hash(
    pool: &PgPool,
    token_hash: &[u8],
) -> Result<Option<SessionUserRecord>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT
            s.id AS session_id,
            s.user_id AS session_user_id,
            s.expires_at AS session_expires_at,
            s.invalidated_at AS session_invalidated_at,
            s.created_at AS session_created_at,
            s.updated_at AS session_updated_at,
            u.id AS user_id,
            u.name,
            u.email,
            u.role,
            u.email_verified_at,
            u.created_at AS user_created_at,
            u.updated_at AS user_updated_at
        FROM sessions s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1 AND s.invalidated_at IS NULL AND s.expires_at > NOW()
        LIMIT 1
        "#,
    )
    .bind(token_hash)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|value| SessionUserRecord {
        session: row_to_session(&value),
        user: row_to_user(&value),
    }))
}

pub async fn invalidate_session_by_token_hash(
    pool: &PgPool,
    token_hash: &[u8],
) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    sqlx::query(
        r#"
        UPDATE sessions
        SET invalidated_at = COALESCE(invalidated_at, $2), updated_at = $2
        WHERE token_hash = $1
        "#,
    )
    .bind(token_hash)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn invalidate_sessions_for_user(pool: &PgPool, user_id: Uuid) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    sqlx::query(
        r#"
        UPDATE sessions
        SET invalidated_at = COALESCE(invalidated_at, $2), updated_at = $2
        WHERE user_id = $1 AND invalidated_at IS NULL
        "#,
    )
    .bind(user_id)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}