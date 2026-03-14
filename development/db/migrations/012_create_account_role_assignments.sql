CREATE TABLE IF NOT EXISTS account_role_assignments (
    account_role_assignment_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    institution_id BIGINT NULL,
    assigned_by_account_id BIGINT NULL,
    assignment_reason TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    starts_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_account_role_assignments_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_account_role_assignments_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_account_role_assignments_institution
        FOREIGN KEY (institution_id)
        REFERENCES institutions(institution_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_account_role_assignments_assigned_by
        FOREIGN KEY (assigned_by_account_id)
        REFERENCES accounts(account_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_account_role_assignments_account_id
    ON account_role_assignments(account_id);

CREATE INDEX IF NOT EXISTS idx_account_role_assignments_role_id
    ON account_role_assignments(role_id);

CREATE INDEX IF NOT EXISTS idx_account_role_assignments_institution_id
    ON account_role_assignments(institution_id);


CREATE UNIQUE INDEX IF NOT EXISTS uq_account_role_assignments_global
    ON account_role_assignments(account_id, role_id)
    WHERE institution_id IS NULL;


CREATE UNIQUE INDEX IF NOT EXISTS uq_account_role_assignments_institutional
    ON account_role_assignments(account_id, role_id, institution_id)
    WHERE institution_id IS NOT NULL;