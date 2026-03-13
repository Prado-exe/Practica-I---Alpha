CREATE TABLE IF NOT EXISTS institution_dataset_account_permissions (
    institution_dataset_account_permission_id BIGSERIAL PRIMARY KEY,

    institution_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    dataset_id BIGINT NOT NULL,

    granted_by_account_id BIGINT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT NULL,

    CONSTRAINT fk_idap_institution
        FOREIGN KEY (institution_id)
        REFERENCES institutions(institution_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_idap_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_idap_granted_by_account
        FOREIGN KEY (granted_by_account_id)
        REFERENCES accounts(account_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT uq_idap_institution_account_dataset
        UNIQUE (institution_id, account_id, dataset_id)
);

CREATE INDEX IF NOT EXISTS idx_idap_institution_id
    ON institution_dataset_account_permissions(institution_id);

CREATE INDEX IF NOT EXISTS idx_idap_account_id
    ON institution_dataset_account_permissions(account_id);

CREATE INDEX IF NOT EXISTS idx_idap_dataset_id
    ON institution_dataset_account_permissions(dataset_id);

CREATE INDEX IF NOT EXISTS idx_idap_is_active
    ON institution_dataset_account_permissions(is_active);