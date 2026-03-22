CREATE TABLE IF NOT EXISTS contact_message_files (
    contact_message_file_id BIGSERIAL PRIMARY KEY,

    contact_message_id BIGINT NOT NULL,
    aws_file_reference_id BIGINT NOT NULL,

    file_role VARCHAR(30) NOT NULL DEFAULT 'attachment',
    display_order INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_contact_message_files_contact_message
        FOREIGN KEY (contact_message_id)
        REFERENCES contact_messages(contact_message_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_contact_message_files_aws_file_reference
        FOREIGN KEY (aws_file_reference_id)
        REFERENCES aws_file_references(aws_file_reference_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_contact_message_files_unique_file
        UNIQUE (contact_message_id, aws_file_reference_id),

    CONSTRAINT chk_contact_message_files_role
        CHECK (file_role IN ('attachment', 'supporting_document')),

    CONSTRAINT chk_contact_message_files_display_order
        CHECK (display_order >= 1)
);

CREATE INDEX IF NOT EXISTS idx_contact_message_files_contact_message_id
    ON contact_message_files(contact_message_id);

CREATE INDEX IF NOT EXISTS idx_contact_message_files_aws_file_reference_id
    ON contact_message_files(aws_file_reference_id);