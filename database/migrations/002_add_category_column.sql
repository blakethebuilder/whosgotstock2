-- Migration: Add category column to products table
-- Run this on the production database to add the category field

ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'xml';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_source_type ON products(source_type);