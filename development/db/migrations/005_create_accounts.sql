CREATE TABLE IF NOT EXISTS accounts (
    account_id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,

    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,

    account_status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ NULL,

    last_login_at TIMESTAMPTZ NULL,
    last_password_change_at TIMESTAMPTZ NULL,

    registration_started_at TIMESTAMPTZ NULL,
    registration_completed_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_accounts_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_accounts_status
        CHECK (
            account_status IN (
                'active', 
                'pending_verification', 
                'suspended', 
                'pending_revalidation'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_accounts_role_id
    ON accounts(role_id);

CREATE INDEX IF NOT EXISTS idx_accounts_account_status
    ON accounts(account_status);

CREATE INDEX IF NOT EXISTS idx_accounts_locked_until
    ON accounts(locked_until);