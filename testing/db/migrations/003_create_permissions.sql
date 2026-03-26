CREATE TABLE IF NOT EXISTS permissions (
    permission_id BIGSERIAL PRIMARY KEY,
    code VARCHAR(150) NOT NULL UNIQUE,
    module_code VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);