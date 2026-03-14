CREATE TABLE IF NOT EXISTS verification_codes (
    verification_code_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    code_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    destination_masked VARCHAR(255) NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL,
    attempts_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    resend_count INTEGER NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_verification_codes_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_verification_codes_code_type
        CHECK (code_type IN ('register_email')),

    CONSTRAINT chk_verification_codes_channel
        CHECK (channel IN ('email'))
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_account_id
    ON verification_codes(account_id);

CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at
    ON verification_codes(expires_at);