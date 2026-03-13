CREATE TABLE IF NOT EXISTS security_logs (
    security_log_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_module VARCHAR(100) NULL,
    description TEXT NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    metadata_json JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_security_logs_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_security_logs_account_id
    ON security_logs(account_id);

CREATE INDEX IF NOT EXISTS idx_security_logs_event_type
    ON security_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_security_logs_created_at
    ON security_logs(created_at);