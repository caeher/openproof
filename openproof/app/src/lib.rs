//! Composition root for OpenProof (Postgres + migrations).

use sqlx::PgPool;

pub mod documents;
pub mod error;
pub mod outbox;
pub mod sessions;
pub mod users;
pub mod workers;

pub use error::AppError;

pub struct OpenProofApp {
    pub pool: PgPool,
}

impl OpenProofApp {
    pub async fn connect(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = PgPool::connect(database_url).await?;
        sqlx::migrate!("./migrations").run(&pool).await?;
        Ok(Self { pool })
    }
}
