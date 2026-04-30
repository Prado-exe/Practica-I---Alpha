CREATE TABLE IF NOT EXISTS dataset_stats (
    dataset_stats_id BIGSERIAL PRIMARY KEY,
    dataset_id BIGINT NOT NULL UNIQUE,
    views_count BIGINT NOT NULL DEFAULT 0,
    downloads_count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_dataset_stats_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(dataset_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);