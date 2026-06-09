-- Migration: Create supplier_fetch_log table for tracking ingestion history
-- Date: June 09, 2026

CREATE TABLE IF NOT EXISTS supplier_fetch_log (
    id SERIAL PRIMARY KEY,
    supplier_slug VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'running',
    products_fetched INTEGER DEFAULT 0,
    products_ingested INTEGER DEFAULT 0,
    error_message TEXT,
    duration_seconds NUMERIC(10,2)
);

CREATE INDEX IF NOT EXISTS idx_fetch_log_supplier ON supplier_fetch_log(supplier_slug);
CREATE INDEX IF NOT EXISTS idx_fetch_log_started ON supplier_fetch_log(started_at DESC);
