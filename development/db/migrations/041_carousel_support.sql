-- Agrega categoría 'carrusel' para slides del carrusel principal
INSERT INTO news_categories (name) VALUES ('carrusel') ON CONFLICT (name) DO NOTHING;

-- Columna para URL de imagen del slide del carrusel
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS image_url TEXT NULL;

-- Columna para el enlace "Ver más" del slide (ej: /noticias/mi-noticia)
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS link_url TEXT NULL;
