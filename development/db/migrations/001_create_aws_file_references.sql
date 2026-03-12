CREATE TABLE IF NOT EXISTS aws_file_references (
    aws_file_reference_id BIGSERIAL PRIMARY KEY,
    referencia_aws TEXT NOT NULL,
    fecha_dataset TIMESTAMPTZ NULL,
    formato VARCHAR(100) NULL,
    objetivo TEXT NULL,
    tamano BIGINT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',

    file_category VARCHAR(100) NULL,
    file_scope VARCHAR(50) NULL, -- system_default / private_user / dataset / institution
    owner_account_id BIGINT NULL, -- FK se agrega después, cuando exista accounts
    storage_key TEXT NULL,
    mime_type VARCHAR(150) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aws_file_references_owner_account_id
    ON aws_file_references(owner_account_id);

CREATE INDEX IF NOT EXISTS idx_aws_file_references_file_category
    ON aws_file_references(file_category);