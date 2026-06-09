-- Migration: Add pg_trgm extension and create GIN trigram indexes for sub-10ms search speeds
-- Date: June 09, 2026

-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN trigram indexes on products columns
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON products USING gin (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm ON products USING gin (supplier_sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_desc_trgm ON products USING gin (description gin_trgm_ops);
