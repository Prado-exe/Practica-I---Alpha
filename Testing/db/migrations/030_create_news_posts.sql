CREATE TABLE IF NOT EXISTS news_posts (
    news_post_id BIGSERIAL PRIMARY KEY,

    author_account_id BIGINT NOT NULL,

    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary VARCHAR(500) NULL,
    content TEXT NOT NULL,

    post_status VARCHAR(30) NOT NULL DEFAULT 'draft',
    access_level VARCHAR(20) NOT NULL DEFAULT 'public',

    published_at TIMESTAMPTZ NULL,
    deleted_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_news_posts_author_account
        FOREIGN KEY (author_account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_news_posts_status
        CHECK (
            post_status IN (
                'draft',
                'published',
                'archived',
                'deleted'
            )
        ),

    CONSTRAINT chk_news_posts_access_level
        CHECK (access_level IN ('public', 'internal')),

    CONSTRAINT chk_news_posts_summary_length
        CHECK (summary IS NULL OR char_length(summary) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_news_posts_author_account_id
    ON news_posts(author_account_id);

CREATE INDEX IF NOT EXISTS idx_news_posts_status
    ON news_posts(post_status);

CREATE INDEX IF NOT EXISTS idx_news_posts_access_level
    ON news_posts(access_level);

CREATE INDEX IF NOT EXISTS idx_news_posts_published_at
    ON news_posts(published_at);

CREATE INDEX IF NOT EXISTS idx_news_posts_created_at
    ON news_posts(created_at);