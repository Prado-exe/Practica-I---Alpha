CREATE TABLE IF NOT EXISTS ods_objectives (
    ods_objective_id SMALLSERIAL PRIMARY KEY,
    objective_code VARCHAR(20) NOT NULL UNIQUE,
    objective_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ods_objectives_code
    ON ods_objectives(objective_code);