CREATE TABLE IF NOT EXISTS dataset_account_permissions (
    dataset_account_permission_id BIGSERIAL PRIMARY KEY,

    dataset_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,

    permission_level VARCHAR(20) NOT NULL,
    granted_by_account_id BIGINT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT NULL,

    CONSTRAINT fk_dap_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(dataset_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_dap_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_dap_granted_by_account
        FOREIGN KEY (granted_by_account_id)
        REFERENCES accounts(account_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_dap_permission_level
        CHECK (permission_level IN ('read', 'edit')),

    CONSTRAINT chk_dap_dates
        CHECK (expires_at IS NULL OR expires_at > granted_at),

    CONSTRAINT uq_dap_dataset_account
        UNIQUE (dataset_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_dap_dataset_id
    ON dataset_account_permissions(dataset_id);

CREATE INDEX IF NOT EXISTS idx_dap_account_id
    ON dataset_account_permissions(account_id);

CREATE INDEX IF NOT EXISTS idx_dap_is_active
    ON dataset_account_permissions(is_active);