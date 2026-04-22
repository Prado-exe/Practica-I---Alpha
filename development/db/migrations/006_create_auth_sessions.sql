CREATE TABLE IF NOT EXISTS auth_sessions (
    session_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,

    current_refresh_token_id VARCHAR(64) NOT NULL,
    refresh_token_hash TEXT NOT NULL,

    ip_address INET NULL,
    user_agent TEXT NULL,
    device_id VARCHAR(255) NULL,
    device_name VARCHAR(255) NULL,
    session_type VARCHAR(50) NOT NULL DEFAULT 'web',

    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ NULL,
    revocation_reason VARCHAR(100) NULL,

    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ NULL,
    last_rotated_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_auth_sessions_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_auth_sessions_session_type
        CHECK (session_type IN ('web', 'mobile', 'api', 'system')),

    CONSTRAINT chk_auth_sessions_refresh_token_id_length
        CHECK (char_length(current_refresh_token_id) >= 16)
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_account_id
    ON auth_sessions(account_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at
    ON auth_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_is_revoked
    ON auth_sessions(is_revoked);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_account_active
    ON auth_sessions(account_id, is_revoked);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_token_id
    ON auth_sessions(current_refresh_token_id);