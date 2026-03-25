CREATE TABLE IF NOT EXISTS dataset_events (
    dataset_event_id BIGSERIAL PRIMARY KEY,

    dataset_id BIGINT NOT NULL,
    actor_account_id BIGINT NULL,

    event_type VARCHAR(50) NOT NULL,
    event_result VARCHAR(20) NOT NULL DEFAULT 'success',
    event_comment TEXT NULL,
    metadata_json JSONB NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_dataset_events_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(dataset_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_dataset_events_actor
        FOREIGN KEY (actor_account_id)
        REFERENCES accounts(account_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_dataset_events_type
        CHECK (
            event_type IN (
                'created',
                'submitted_for_validation',
                'approved',
                'rejected',
                'published',
                'edited',
                'archived',
                'deleted',
                'downloaded',
                'permission_granted',
                'permission_revoked'
            )
        ),

    CONSTRAINT chk_dataset_events_result
        CHECK (event_result IN ('success', 'failure'))
);

CREATE INDEX IF NOT EXISTS idx_dataset_events_dataset_id
    ON dataset_events(dataset_id);

CREATE INDEX IF NOT EXISTS idx_dataset_events_actor_account_id
    ON dataset_events(actor_account_id);

CREATE INDEX IF NOT EXISTS idx_dataset_events_created_at
    ON dataset_events(created_at);