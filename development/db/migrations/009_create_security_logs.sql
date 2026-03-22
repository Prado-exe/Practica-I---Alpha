CREATE TABLE IF NOT EXISTS security_logs (
    security_log_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NULL,

    event_type VARCHAR(100) NOT NULL,
    event_module VARCHAR(100) NULL,
    event_result VARCHAR(20) NOT NULL DEFAULT 'success',
    severity VARCHAR(20) NOT NULL DEFAULT 'info',

    description TEXT NULL,

    ip_address INET NULL,
    user_agent TEXT NULL,

    metadata_json JSONB NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_security_logs_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_security_logs_event_result
        CHECK (event_result IN ('success', 'failure')),

    CONSTRAINT chk_security_logs_severity
        CHECK (severity IN ('info', 'warning', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_security_logs_account_id
    ON security_logs(account_id);

CREATE INDEX IF NOT EXISTS idx_security_logs_event_type
    ON security_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_security_logs_created_at
    ON security_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_security_logs_result
    ON security_logs(event_result);

CREATE INDEX IF NOT EXISTS idx_security_logs_severity
    ON security_logs(severity);