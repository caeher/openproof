use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::users::UserRecord;

#[derive(Debug, Clone)]
pub struct ApiKeyRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub key_prefix: String,
    pub last_used_at: Option<DateTime<Utc>>,
    pub revoked_at: Option<DateTime<Utc>>,
    pub rotated_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct ApiKeyUserRecord {
    pub api_key: ApiKeyRecord,
    pub user: UserRecord,
}

fn row_to_api_key(row: &sqlx::postgres::PgRow) -> ApiKeyRecord {
    ApiKeyRecord {
        id: row.get("id"),
        user_id: row.get("user_id"),
        name: row.get("name"),
        key_prefix: row.get("key_prefix"),
        last_used_at: row.try_get("last_used_at").ok().flatten(),
        revoked_at: row.try_get("revoked_at").ok().flatten(),
        rotated_at: row.try_get("rotated_at").ok().flatten(),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

fn row_to_user(row: &sqlx::postgres::PgRow) -> UserRecord {
    UserRecord {
        id: row.get("user_id"),
        name: row.get("user_name"),
        email: row.get("email"),
        role: row.get("role"),
        email_verified_at: row.try_get("email_verified_at").ok().flatten(),
        avatar_url: row.try_get("avatar_url").ok().flatten(),
        created_at: row.get("user_created_at"),
        updated_at: row.get("user_updated_at"),
    }
}

pub async fn create_api_key(
    pool: &PgPool,
    user_id: Uuid,
    name: &str,
    key_prefix: &str,
    key_hash: &[u8],
) -> Result<ApiKeyRecord, sqlx::Error> {
    let now = Utc::now();
    let row = sqlx::query(
        r#"
        INSERT INTO api_keys (
            id,
            user_id,
            name,
            key_prefix,
            key_hash,
            last_used_at,
            revoked_at,
            rotated_at,
            created_at,
            updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NULL, NULL, NULL, $6, $7)
        RETURNING id, user_id, name, key_prefix, last_used_at, revoked_at, rotated_at, created_at, updated_at
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(user_id)
    .bind(name)
    .bind(key_prefix)
    .bind(key_hash)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await?;

    Ok(row_to_api_key(&row))
}

pub async fn list_api_keys_for_user(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<ApiKeyRecord>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, user_id, name, key_prefix, last_used_at, revoked_at, rotated_at, created_at, updated_at
        FROM api_keys
        WHERE user_id = $1
        ORDER BY (revoked_at IS NULL) DESC, created_at DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_api_key).collect())
}

pub async fn count_active_api_keys_for_user(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<i64, sqlx::Error> {
    let count = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM api_keys
        WHERE user_id = $1 AND revoked_at IS NULL
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(count)
}

pub async fn find_user_by_key_hash(
    pool: &PgPool,
    key_hash: &[u8],
) -> Result<Option<ApiKeyUserRecord>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT
            ak.id,
            ak.user_id,
            ak.name,
            ak.key_prefix,
            ak.last_used_at,
            ak.revoked_at,
            ak.rotated_at,
            ak.created_at,
            ak.updated_at,
            u.name AS user_name,
            u.email,
            u.role,
            u.email_verified_at,
            u.avatar_url,
            u.created_at AS user_created_at,
            u.updated_at AS user_updated_at
        FROM api_keys ak
        INNER JOIN users u ON u.id = ak.user_id
        WHERE ak.key_hash = $1 AND ak.revoked_at IS NULL
        LIMIT 1
        "#,
    )
    .bind(key_hash)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|value| ApiKeyUserRecord {
        api_key: row_to_api_key(&value),
        user: row_to_user(&value),
    }))
}

pub async fn touch_api_key_usage(pool: &PgPool, api_key_id: Uuid) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    sqlx::query(
        r#"
        UPDATE api_keys
        SET last_used_at = $2, updated_at = $2
        WHERE id = $1 AND revoked_at IS NULL
        "#,
    )
    .bind(api_key_id)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn revoke_api_key_for_user(
    pool: &PgPool,
    user_id: Uuid,
    api_key_id: Uuid,
) -> Result<Option<ApiKeyRecord>, sqlx::Error> {
    let now = Utc::now();
    let row = sqlx::query(
        r#"
        UPDATE api_keys
        SET revoked_at = $3, updated_at = $3
        WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
        RETURNING id, user_id, name, key_prefix, last_used_at, revoked_at, rotated_at, created_at, updated_at
        "#,
    )
    .bind(api_key_id)
    .bind(user_id)
    .bind(now)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|value| row_to_api_key(&value)))
}

pub async fn rotate_api_key_for_user(
    pool: &PgPool,
    user_id: Uuid,
    api_key_id: Uuid,
    key_prefix: &str,
    key_hash: &[u8],
) -> Result<Option<ApiKeyRecord>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let now = Utc::now();

    let existing = sqlx::query(
        r#"
        SELECT name
        FROM api_keys
        WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
        FOR UPDATE
        "#,
    )
    .bind(api_key_id)
    .bind(user_id)
    .fetch_optional(&mut *tx)
    .await?;

    let Some(existing) = existing else {
        tx.rollback().await?;
        return Ok(None);
    };

    let name: String = existing.get("name");

    sqlx::query(
        r#"
        UPDATE api_keys
        SET revoked_at = $3, rotated_at = $3, updated_at = $3
        WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
        "#,
    )
    .bind(api_key_id)
    .bind(user_id)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    let row = sqlx::query(
        r#"
        INSERT INTO api_keys (
            id,
            user_id,
            name,
            key_prefix,
            key_hash,
            last_used_at,
            revoked_at,
            rotated_at,
            created_at,
            updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NULL, NULL, NULL, $6, $7)
        RETURNING id, user_id, name, key_prefix, last_used_at, revoked_at, rotated_at, created_at, updated_at
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(user_id)
    .bind(name)
    .bind(key_prefix)
    .bind(key_hash)
    .bind(now)
    .bind(now)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Some(row_to_api_key(&row)))
}