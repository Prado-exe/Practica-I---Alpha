CREATE TABLE IF NOT EXISTS auth_sessions (
    session_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    device_id VARCHAR(255) NULL,
    device_name VARCHAR(255) NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_auth_sessions_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_account_id
    ON auth_sessions(account_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at
    ON auth_sessions(expires_at);