
CREATE TABLE IF NOT EXISTS news_categories (
    news_category_id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


INSERT INTO news_categories (name) VALUES
('datasets'), 
('indicadores'), 
('eventos'), 
('plataformas')
ON CONFLICT (name) DO NOTHING;


CREATE TABLE IF NOT EXISTS news_posts (
    news_post_id BIGSERIAL PRIMARY KEY,
    author_account_id BIGINT NOT NULL,

    post_type VARCHAR(20) NOT NULL, 

    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary VARCHAR(500) NULL,
    content TEXT NOT NULL,


    news_category_id SMALLINT NULL,
    category_id BIGINT NULL,
    dataset_id BIGINT NULL,

    post_status VARCHAR(30) NOT NULL DEFAULT 'draft',
    access_level VARCHAR(20) NOT NULL DEFAULT 'public',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,

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
        CHECK (summary IS NULL OR char_length(summary) <= 500),

    CONSTRAINT chk_news_posts_type
        CHECK (post_type IN ('news', 'post')),

    CONSTRAINT chk_news_posts_logic
        CHECK (
            (post_type = 'news' AND news_category_id IS NOT NULL AND category_id IS NULL) OR
            (post_type = 'post' AND category_id IS NOT NULL AND news_category_id IS NULL)
        ),

    CONSTRAINT fk_news_posts_news_category
        FOREIGN KEY (news_category_id)
        REFERENCES news_categories(news_category_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_news_posts_general_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_news_posts_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(dataset_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_news_posts_author_account_id ON news_posts(author_account_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_type ON news_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_news_posts_status ON news_posts(post_status);
CREATE INDEX IF NOT EXISTS idx_news_posts_access_level ON news_posts(access_level);
CREATE INDEX IF NOT EXISTS idx_news_posts_published_at ON news_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_news_posts_created_at ON news_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_news_posts_is_featured ON news_posts(is_featured);