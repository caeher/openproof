CREATE TABLE credit_accounts (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance_credits BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_credit_accounts_balance CHECK (balance_credits >= 0)
);

CREATE TABLE credit_packages (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price_usd_cents BIGINT NOT NULL,
    credits BIGINT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_credit_packages_price CHECK (price_usd_cents > 0),
    CONSTRAINT chk_credit_packages_credits CHECK (credits > 0)
);

CREATE TABLE payment_intents (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES credit_packages(id),
    package_code TEXT NOT NULL,
    package_name TEXT NOT NULL,
    amount_usd_cents BIGINT NOT NULL,
    credits BIGINT NOT NULL,
    status TEXT NOT NULL,
    blink_invoice_status TEXT NOT NULL,
    payment_request TEXT,
    payment_hash TEXT UNIQUE,
    expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_payment_intents_status CHECK (status IN ('pending', 'paid', 'expired', 'cancelled'))
);

CREATE INDEX idx_payment_intents_user_id ON payment_intents (user_id, created_at DESC);
CREATE INDEX idx_payment_intents_pending ON payment_intents (status, created_at DESC);

CREATE TABLE credit_ledger (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE SET NULL,
    kind TEXT NOT NULL,
    delta_credits BIGINT NOT NULL,
    balance_after_credits BIGINT NOT NULL,
    description TEXT,
    reference_type TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_credit_ledger_kind CHECK (kind IN ('purchase', 'document_registration', 'manual_adjustment'))
);

CREATE INDEX idx_credit_ledger_user_id ON credit_ledger (user_id, created_at DESC);
CREATE INDEX idx_credit_ledger_payment_intent_id ON credit_ledger (payment_intent_id);

CREATE TABLE blink_webhook_events (
    id UUID PRIMARY KEY,
    webhook_message_id TEXT UNIQUE,
    event_type TEXT NOT NULL,
    payment_hash TEXT,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_blink_webhook_events_payment_hash ON blink_webhook_events (payment_hash, created_at DESC);

INSERT INTO credit_packages (id, code, name, description, price_usd_cents, credits, active, sort_order, created_at, updated_at)
VALUES
    ('018f5d8a-8c8a-7d10-b068-03ff08f2c001', 'starter', 'Starter', '15 creditos para pruebas y flujo inicial.', 500, 15, TRUE, 10, NOW(), NOW()),
    ('018f5d8a-8c8a-7d10-b068-03ff08f2c002', 'growth', 'Growth', '50 creditos para operaciones recurrentes.', 1500, 50, TRUE, 20, NOW(), NOW()),
    ('018f5d8a-8c8a-7d10-b068-03ff08f2c003', 'scale', 'Scale', '200 creditos para equipos o volumen alto.', 5000, 200, TRUE, 30, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;