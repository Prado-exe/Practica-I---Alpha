CREATE TABLE IF NOT EXISTS datasets (
    dataset_id BIGSERIAL PRIMARY KEY,

    owner_account_id BIGINT NOT NULL,
    institution_id BIGINT NULL,
    category_id BIGINT NOT NULL,
    license_id BIGINT NOT NULL,
    ods_objective_id SMALLINT NULL,

    title VARCHAR(255) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    body_content TEXT NULL,

    dataset_status VARCHAR(30) NOT NULL DEFAULT 'draft',
    access_level VARCHAR(20) NOT NULL DEFAULT 'public',

    creation_date DATE NOT NULL,
    geographic_coverage VARCHAR(255) NULL,
    update_frequency VARCHAR(100) NULL,
    source_url TEXT NULL,
    dashboard_url TEXT NULL,

    temporal_coverage_start DATE NULL,
    temporal_coverage_end DATE NULL,

    published_at TIMESTAMPTZ NULL,
    deleted_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_datasets_owner_account
        FOREIGN KEY (owner_account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_datasets_institution
        FOREIGN KEY (institution_id)
        REFERENCES institutions(institution_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_datasets_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_datasets_license
        FOREIGN KEY (license_id)
        REFERENCES licenses(license_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_datasets_ods_objective
        FOREIGN KEY (ods_objective_id)
        REFERENCES ods_objectives(ods_objective_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_datasets_status
        CHECK (
            dataset_status IN (
                'draft',
                'pending_validation',
                'published',
                'rejected',
                'archived',
                'deleted'
            )
        ),

    CONSTRAINT chk_datasets_access_level
        CHECK (access_level IN ('public', 'internal')),

    CONSTRAINT chk_datasets_summary_length
        CHECK (char_length(summary) <= 500),

    CONSTRAINT chk_datasets_temporal_coverage
        CHECK (
            temporal_coverage_start IS NULL
            OR temporal_coverage_end IS NULL
            OR temporal_coverage_end >= temporal_coverage_start
        )
);

CREATE INDEX IF NOT EXISTS idx_datasets_owner_account_id
    ON datasets(owner_account_id);

CREATE INDEX IF NOT EXISTS idx_datasets_institution_id
    ON datasets(institution_id);

CREATE INDEX IF NOT EXISTS idx_datasets_category_id
    ON datasets(category_id);

CREATE INDEX IF NOT EXISTS idx_datasets_license_id
    ON datasets(license_id);

CREATE INDEX IF NOT EXISTS idx_datasets_ods_objective_id
    ON datasets(ods_objective_id);

CREATE INDEX IF NOT EXISTS idx_datasets_status
    ON datasets(dataset_status);

CREATE INDEX IF NOT EXISTS idx_datasets_access_level
    ON datasets(access_level);

CREATE INDEX IF NOT EXISTS idx_datasets_creation_date
    ON datasets(creation_date);

CREATE INDEX IF NOT EXISTS idx_datasets_created_at
    ON datasets(created_at);