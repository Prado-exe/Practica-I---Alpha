CREATE TABLE IF NOT EXISTS dataset_requests (
    dataset_request_id BIGSERIAL PRIMARY KEY,

    dataset_id BIGINT NOT NULL,
    requester_account_id BIGINT NOT NULL,

    request_type VARCHAR(30) NOT NULL,
    request_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    review_stage VARCHAR(30) NULL,

    message TEXT NULL,
    claimed_by_admin_account_id BIGINT NULL,
    claimed_at TIMESTAMPTZ NULL,
    claim_expires_at TIMESTAMPTZ NULL,
    review_comment TEXT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_dataset_requests_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(dataset_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_dataset_requests_requester
        FOREIGN KEY (requester_account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_dataset_requests_claimed_by_admin
        FOREIGN KEY (claimed_by_admin_account_id)
        REFERENCES accounts(account_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_dataset_requests_type
        CHECK (request_type IN ('create', 'edit', 'delete', 'add_files', 'publish')),

    CONSTRAINT chk_dataset_requests_status
        CHECK (request_status IN ('pending', 'claimed', 'approved', 'rejected', 'cancelled')),

    CONSTRAINT chk_dataset_requests_claim_window
        CHECK (claim_expires_at IS NULL OR claimed_at IS NULL OR claim_expires_at > claimed_at)
);

CREATE INDEX IF NOT EXISTS idx_dataset_requests_dataset_id
    ON dataset_requests(dataset_id);

CREATE INDEX IF NOT EXISTS idx_dataset_requests_requester_account_id
    ON dataset_requests(requester_account_id);

CREATE INDEX IF NOT EXISTS idx_dataset_requests_status
    ON dataset_requests(request_status);