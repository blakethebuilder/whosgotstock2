-- Migration: Add description column to products table
-- Run this on the production database to add the description field

ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
