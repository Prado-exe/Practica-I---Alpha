CREATE TABLE file_formats (
    file_format_id SMALLSERIAL PRIMARY KEY,
    format_code VARCHAR(20) NOT NULL UNIQUE,   -- csv, xlsx, pdf
    format_name VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);