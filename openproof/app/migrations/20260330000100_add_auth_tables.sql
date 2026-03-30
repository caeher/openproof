CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user',
    email_verified_at TIMESTAMPTZ,
    legacy_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_users_role CHECK (role IN ('user', 'admin'))
);

CREATE TABLE password_credentials (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    invalidated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_lookup ON sessions (token_hash, invalidated_at, expires_at);

CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens (user_id);

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);

ALTER TABLE documents ADD COLUMN user_id_uuid UUID;

INSERT INTO users (id, email, role, email_verified_at, legacy_key, created_at, updated_at)
SELECT
    gen_random_uuid(),
    CONCAT('legacy+', SUBSTRING(md5(d.user_id) FROM 1 FOR 24), '@openproof.local'),
    'user',
    NULL,
    d.user_id,
    NOW(),
    NOW()
FROM (
    SELECT DISTINCT user_id
    FROM documents
) AS d
WHERE NOT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.legacy_key = d.user_id
);

UPDATE documents d
SET user_id_uuid = u.id
FROM users u
WHERE u.legacy_key = d.user_id;

ALTER TABLE documents ALTER COLUMN user_id_uuid SET NOT NULL;

DROP INDEX IF EXISTS idx_documents_user_id;

ALTER TABLE documents DROP COLUMN user_id;
ALTER TABLE documents RENAME COLUMN user_id_uuid TO user_id;

ALTER TABLE documents
    ADD CONSTRAINT fk_documents_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_documents_user_id ON documents (user_id);