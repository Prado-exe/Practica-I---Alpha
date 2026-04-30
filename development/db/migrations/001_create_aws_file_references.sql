CREATE TABLE IF NOT EXISTS aws_file_references (
    aws_file_reference_id BIGSERIAL PRIMARY KEY,

    storage_key TEXT NOT NULL,               -- key interna en S3
    file_url TEXT NOT NULL,                  -- URL pública o firmada
    file_format_id SMALLINT NOT NULL,        -- FK a file_formats
    file_size_bytes BIGINT NULL,             -- tamaño del archivo
    mime_type VARCHAR(150) NULL,
    file_category VARCHAR(100) NULL,         -- dataset, news, contact, etc.
    file_scope VARCHAR(50) NULL,             -- public, private, internal
    owner_account_id BIGINT NULL,            -- quién subió el archivo

    status VARCHAR(50) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_aws_file_owner_account
        FOREIGN KEY (owner_account_id)
        REFERENCES accounts(account_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_aws_file_format
        FOREIGN KEY (file_format_id)
        REFERENCES file_formats(file_format_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_aws_file_status
        CHECK (status IN ('active', 'archived', 'deleted')),

    CONSTRAINT chk_aws_file_scope
        CHECK (file_scope IN ('public', 'private', 'internal') OR file_scope IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_aws_file_owner_account_id
    ON aws_file_references(owner_account_id);

CREATE INDEX IF NOT EXISTS idx_aws_file_file_format_id
    ON aws_file_references(file_format_id);

CREATE INDEX IF NOT EXISTS idx_aws_file_file_category
    ON aws_file_references(file_category);

CREATE INDEX IF NOT EXISTS idx_aws_file_status
    ON aws_file_references(status);