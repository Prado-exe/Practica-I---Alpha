CREATE TABLE IF NOT EXISTS news_post_files (
    news_post_file_id BIGSERIAL PRIMARY KEY,

    news_post_id BIGINT NOT NULL,
    aws_file_reference_id BIGINT NOT NULL,

    file_role VARCHAR(30) NOT NULL DEFAULT 'attachment',
    display_order INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_news_post_files_news_post
        FOREIGN KEY (news_post_id)
        REFERENCES news_posts(news_post_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_news_post_files_aws_file_reference
        FOREIGN KEY (aws_file_reference_id)
        REFERENCES aws_file_references(aws_file_reference_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_news_post_files_unique_file
        UNIQUE (news_post_id, aws_file_reference_id),

    CONSTRAINT chk_news_post_files_role
        CHECK (file_role IN ('cover', 'gallery', 'attachment')),

    CONSTRAINT chk_news_post_files_display_order
        CHECK (display_order >= 1)
);

CREATE INDEX IF NOT EXISTS idx_news_post_files_news_post_id
    ON news_post_files(news_post_id);

CREATE INDEX IF NOT EXISTS idx_news_post_files_aws_file_reference_id
    ON news_post_files(aws_file_reference_id);

CREATE INDEX IF NOT EXISTS idx_news_post_files_display_order
    ON news_post_files(news_post_id, display_order);