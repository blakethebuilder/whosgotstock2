-- Create separate tables for each manual supplier

-- Even Flow products table
CREATE TABLE IF NOT EXISTS evenflow_products (
    id SERIAL PRIMARY KEY,
    ef_code VARCHAR(255) NOT NULL,
    product_name TEXT NOT NULL,
    description TEXT,
    standard_price DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    category VARCHAR(255),
    sheet_name VARCHAR(255),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB,
    UNIQUE(ef_code)
);

-- Linkqage products table
CREATE TABLE IF NOT EXISTS linkqage_products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(255),
    product_name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    category VARCHAR(255),
    product_url TEXT,
    image_url TEXT,
    in_stock BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB,
    UNIQUE(product_name, price)
);

-- Generic manual products table for other suppliers
CREATE TABLE IF NOT EXISTS manual_supplier_products (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(255),
    product_name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    category VARCHAR(255),
    product_url TEXT,
    image_url TEXT,
    in_stock BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB,
    UNIQUE(supplier_name, product_name, price)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_evenflow_products_ef_code ON evenflow_products(ef_code);
CREATE INDEX IF NOT EXISTS idx_evenflow_products_category ON evenflow_products(category);
CREATE INDEX IF NOT EXISTS idx_evenflow_products_search ON evenflow_products USING gin(to_tsvector('english', product_name));

CREATE INDEX IF NOT EXISTS idx_linkqage_products_name ON linkqage_products(product_name);
CREATE INDEX IF NOT EXISTS idx_linkqage_products_category ON linkqage_products(category);
CREATE INDEX IF NOT EXISTS idx_linkqage_products_search ON linkqage_products USING gin(to_tsvector('english', product_name));

CREATE INDEX IF NOT EXISTS idx_manual_supplier_products_supplier ON manual_supplier_products(supplier_name);
CREATE INDEX IF NOT EXISTS idx_manual_supplier_products_name ON manual_supplier_products(product_name);
CREATE INDEX IF NOT EXISTS idx_manual_supplier_products_search ON manual_supplier_products USING gin(to_tsvector('english', product_name));