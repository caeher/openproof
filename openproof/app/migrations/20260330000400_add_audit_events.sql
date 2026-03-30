CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    status TEXT NOT NULL,
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_audit_events_status CHECK (status IN ('success', 'failure', 'denied'))
);

CREATE INDEX idx_audit_events_actor_user_id ON audit_events (actor_user_id, created_at DESC);
CREATE INDEX idx_audit_events_created_at ON audit_events (created_at DESC);
CREATE INDEX idx_audit_events_action ON audit_events (action, created_at DESC);