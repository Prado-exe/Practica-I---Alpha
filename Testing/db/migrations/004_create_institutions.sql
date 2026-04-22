CREATE TABLE IF NOT EXISTS institutions (
    institution_id BIGSERIAL PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(150) NULL,
    tax_identifier VARCHAR(50) NULL UNIQUE,
    institution_type VARCHAR(100) NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    main_thematic_area VARCHAR(150) NULL,
    data_role VARCHAR(100) NOT NULL,
    usage_license VARCHAR(100) NULL,
    logo_file_id BIGINT NOT NULL,
    access_level VARCHAR(20) NOT NULL,
    institution_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_institutions_logo_file
        FOREIGN KEY (logo_file_id)
        REFERENCES aws_file_references(aws_file_reference_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_institutions_access_level
        CHECK (access_level IN ('public', 'internal')),

    CONSTRAINT chk_institutions_status
        CHECK (institution_status IN ('active', 'inactive')),

    CONSTRAINT chk_institutions_description_length
        CHECK (char_length(description) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_institutions_status
    ON institutions(institution_status);

CREATE INDEX IF NOT EXISTS idx_institutions_access_level
    ON institutions(access_level);

CREATE INDEX IF NOT EXISTS idx_institutions_country_name
    ON institutions(country_name);


CREATE OR REPLACE FUNCTION trg_delete_institution_logo_fn()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM aws_file_references WHERE aws_file_reference_id = OLD.logo_file_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_delete_institution_logo
AFTER DELETE ON institutions
FOR EACH ROW
EXECUTE FUNCTION trg_delete_institution_logo_fn();