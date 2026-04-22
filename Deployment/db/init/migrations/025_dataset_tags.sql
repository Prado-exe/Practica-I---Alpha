CREATE TABLE IF NOT EXISTS dataset_tags (
    dataset_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (dataset_id, tag_id),

    CONSTRAINT fk_dataset_tags_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(dataset_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_dataset_tags_tag
        FOREIGN KEY (tag_id)
        REFERENCES tags(tag_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dataset_tags_tag_id
    ON dataset_tags(tag_id);