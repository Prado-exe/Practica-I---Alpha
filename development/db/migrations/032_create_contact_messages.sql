CREATE TABLE IF NOT EXISTS contact_messages (
    contact_message_id BIGSERIAL PRIMARY KEY,

    dataset_id BIGINT NULL,

    subject VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    message TEXT NOT NULL,

    sender_first_name VARCHAR(100) NOT NULL,
    sender_last_name VARCHAR(100) NOT NULL,
    sender_user_category VARCHAR(100) NULL,
    sender_email VARCHAR(160) NOT NULL,

    claimed_by_admin_account_id BIGINT NULL,
    claimed_at TIMESTAMPTZ NULL,
    claim_expires_at TIMESTAMPTZ NULL,

    review_comment TEXT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_contact_messages_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(dataset_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_contact_messages_claimed_by_admin_account
        FOREIGN KEY (claimed_by_admin_account_id)
        REFERENCES accounts(account_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_contact_messages_status
        CHECK (
            status IN (
                'pending',
                'claimed',
                'in_review',
                'resolved',
                'rejected',
                'closed'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_dataset_id
    ON contact_messages(dataset_id);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status
    ON contact_messages(status);

CREATE INDEX IF NOT EXISTS idx_contact_messages_sender_email
    ON contact_messages(sender_email);

CREATE INDEX IF NOT EXISTS idx_contact_messages_claimed_by_admin_account_id
    ON contact_messages(claimed_by_admin_account_id);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
    ON contact_messages(created_at);