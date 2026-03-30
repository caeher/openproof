CREATE TABLE documents (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    filename TEXT NOT NULL,
    user_id TEXT NOT NULL,
    metadata JSONB,
    status TEXT NOT NULL,
    transaction_id TEXT,
    block_height BIGINT,
    confirmations INT,
    chain_timestamp TIMESTAMPTZ,
    failure_reason TEXT
);

CREATE INDEX idx_documents_file_hash ON documents (file_hash);
CREATE INDEX idx_documents_user_id ON documents (user_id);

CREATE TABLE outbox (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_pending ON outbox (processed, id);
