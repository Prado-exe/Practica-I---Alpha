CREATE TABLE IF NOT EXISTS dataset_files (
    dataset_file_id BIGSERIAL PRIMARY KEY,

    dataset_id BIGINT NOT NULL,
    aws_file_reference_id BIGINT NOT NULL,

    file_role VARCHAR(30) NOT NULL DEFAULT 'source',
    display_name VARCHAR(255) NOT NULL,
    file_format VARCHAR(20) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    downloads_count BIGINT NOT NULL DEFAULT 0,

    -- 👇 NUEVA COLUMNA: Identifica si el archivo está en espera de aprobación
    is_pending_validation BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_dataset_files_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(dataset_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_dataset_files_aws_file_reference
        FOREIGN KEY (aws_file_reference_id)
        REFERENCES aws_file_references(aws_file_reference_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_dataset_files_file_role
        CHECK (file_role IN ('source', 'preview', 'documentation', 'attachment')),

    CONSTRAINT chk_dataset_files_file_format
        CHECK (file_format IN ('csv', 'json', 'xml', 'xlsx', 'pdf', 'zip', 'txt')),

    CONSTRAINT chk_dataset_files_file_size_bytes
        CHECK (file_size_bytes > 0),

    CONSTRAINT uq_dataset_files_dataset_file_ref
        UNIQUE (dataset_id, aws_file_reference_id)
);

CREATE INDEX IF NOT EXISTS idx_dataset_files_dataset_id
    ON dataset_files(dataset_id);

CREATE INDEX IF NOT EXISTS idx_dataset_files_aws_file_reference_id
    ON dataset_files(aws_file_reference_id);

CREATE INDEX IF NOT EXISTS idx_dataset_files_pending
    ON dataset_files(is_pending_validation);