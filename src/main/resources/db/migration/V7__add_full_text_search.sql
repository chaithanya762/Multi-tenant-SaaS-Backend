-- ============================================================
-- V7: Full-Text Search on Products
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
