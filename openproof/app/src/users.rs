use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct UserRecord {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub role: String,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl UserRecord {
    pub fn is_email_verified(&self) -> bool {
        self.email_verified_at.is_some()
    }
}

#[derive(Debug, Clone)]
pub struct UserAuthRecord {
    pub user: UserRecord,
    pub password_hash: String,
}

fn row_to_user(row: &sqlx::postgres::PgRow) -> UserRecord {
    UserRecord {
        id: row.get("id"),
        name: row.get("name"),
        email: row.get("email"),
        role: row.get("role"),
        email_verified_at: row.try_get("email_verified_at").ok().flatten(),
        avatar_url: row.try_get("avatar_url").ok().flatten(),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

pub async fn create_user_with_password(
    pool: &PgPool,
    name: &str,
    email: &str,
    password_hash: &str,
) -> Result<UserRecord, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let now = Utc::now();
    let user_id = Uuid::now_v7();

    sqlx::query(
        r#"
        INSERT INTO users (id, name, email, role, email_verified_at, legacy_key, created_at, updated_at)
        VALUES ($1, $2, $3, 'user', NULL, NULL, $4, $5)
        "#,
    )
    .bind(user_id)
    .bind(name)
    .bind(email)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO password_credentials (user_id, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(user_id)
    .bind(password_hash)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    let row = sqlx::query("SELECT id, name, email, role, email_verified_at, avatar_url, created_at, updated_at FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(row_to_user(&row))
}

pub async fn find_by_id(pool: &PgPool, user_id: Uuid) -> Result<Option<UserRecord>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, name, email, role, email_verified_at, avatar_url, created_at, updated_at FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|value| row_to_user(&value)))
}

pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<UserRecord>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, name, email, role, email_verified_at, avatar_url, created_at, updated_at FROM users WHERE email = $1",
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|value| row_to_user(&value)))
}

pub async fn find_auth_by_email(
    pool: &PgPool,
    email: &str,
) -> Result<Option<UserAuthRecord>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT
            u.id,
            u.name,
            u.email,
            u.role,
            u.email_verified_at,
            u.avatar_url,
            u.created_at,
            u.updated_at,
            pc.password_hash
        FROM users u
        INNER JOIN password_credentials pc ON pc.user_id = u.id
        WHERE u.email = $1
        "#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|value| UserAuthRecord {
        user: row_to_user(&value),
        password_hash: value.get("password_hash"),
    }))
}

pub async fn find_auth_by_id(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<UserAuthRecord>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT
            u.id,
            u.name,
            u.email,
            u.role,
            u.email_verified_at,
            u.avatar_url,
            u.created_at,
            u.updated_at,
            pc.password_hash
        FROM users u
        INNER JOIN password_credentials pc ON pc.user_id = u.id
        WHERE u.id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|value| UserAuthRecord {
        user: row_to_user(&value),
        password_hash: value.get("password_hash"),
    }))
}

pub async fn update_password_for_user(
    pool: &PgPool,
    user_id: Uuid,
    password_hash: &str,
) -> Result<Option<UserRecord>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let now = Utc::now();

    let updated = sqlx::query(
        r#"
        UPDATE password_credentials
        SET password_hash = $2, updated_at = $3
        WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .bind(password_hash)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    if updated.rows_affected() == 0 {
        tx.rollback().await?;
        return Ok(None);
    }

    let row = sqlx::query(
        r#"
        UPDATE users
        SET updated_at = $2
        WHERE id = $1
        RETURNING id, name, email, role, email_verified_at, avatar_url, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(now)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Some(row_to_user(&row)))
}

pub async fn store_email_verification_token(
    pool: &PgPool,
    user_id: Uuid,
    token_hash: &[u8],
    expires_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    let now = Utc::now();

    sqlx::query(
        "DELETE FROM email_verification_tokens WHERE user_id = $1 AND consumed_at IS NULL",
    )
    .bind(user_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, consumed_at, created_at)
        VALUES ($1, $2, $3, $4, NULL, $5)
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(user_id)
    .bind(token_hash)
    .bind(expires_at)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}

pub async fn consume_email_verification_token(
    pool: &PgPool,
    token_hash: &[u8],
) -> Result<Option<UserRecord>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let maybe_user_id = sqlx::query(
        r#"
        SELECT user_id
        FROM email_verification_tokens
        WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(token_hash)
    .fetch_optional(&mut *tx)
    .await?;

    let Some(user_row) = maybe_user_id else {
        tx.rollback().await?;
        return Ok(None);
    };

    let user_id: Uuid = user_row.get("user_id");
    let now = Utc::now();

    sqlx::query(
        r#"
        UPDATE email_verification_tokens
        SET consumed_at = $2
        WHERE token_hash = $1 AND consumed_at IS NULL
        "#,
    )
    .bind(token_hash)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    let row = sqlx::query(
        r#"
        UPDATE users
        SET email_verified_at = COALESCE(email_verified_at, $2), updated_at = $2
        WHERE id = $1
        RETURNING id, name, email, role, email_verified_at, avatar_url, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(now)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Some(row_to_user(&row)))
}

pub async fn store_password_reset_token(
    pool: &PgPool,
    user_id: Uuid,
    token_hash: &[u8],
    expires_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    let now = Utc::now();

    sqlx::query(
        "DELETE FROM password_reset_tokens WHERE user_id = $1 AND consumed_at IS NULL",
    )
    .bind(user_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, consumed_at, created_at)
        VALUES ($1, $2, $3, $4, NULL, $5)
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(user_id)
    .bind(token_hash)
    .bind(expires_at)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}

pub async fn update_avatar_for_user(
    pool: &PgPool,
    user_id: Uuid,
    avatar_url: Option<&str>,
) -> Result<Option<UserRecord>, sqlx::Error> {
    let now = Utc::now();
    let row = sqlx::query(
        r#"
        UPDATE users
        SET avatar_url = $2, updated_at = $3
        WHERE id = $1
        RETURNING id, name, email, role, email_verified_at, avatar_url, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(avatar_url)
    .bind(now)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|value| row_to_user(&value)))
}

pub async fn consume_password_reset_token(
    pool: &PgPool,
    token_hash: &[u8],
    password_hash: &str,
) -> Result<Option<UserRecord>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let maybe_user_id = sqlx::query(
        r#"
        SELECT user_id
        FROM password_reset_tokens
        WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(token_hash)
    .fetch_optional(&mut *tx)
    .await?;

    let Some(user_row) = maybe_user_id else {
        tx.rollback().await?;
        return Ok(None);
    };

    let user_id: Uuid = user_row.get("user_id");
    let now = Utc::now();

    sqlx::query(
        r#"
        UPDATE password_reset_tokens
        SET consumed_at = $2
        WHERE token_hash = $1 AND consumed_at IS NULL
        "#,
    )
    .bind(token_hash)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        UPDATE password_credentials
        SET password_hash = $2, updated_at = $3
        WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .bind(password_hash)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    let row = sqlx::query(
        r#"
        UPDATE users
        SET updated_at = $2
        WHERE id = $1
        RETURNING id, name, email, role, email_verified_at, avatar_url, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(now)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Some(row_to_user(&row)))
}