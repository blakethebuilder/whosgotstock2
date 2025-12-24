CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    master_sku VARCHAR(255),
    supplier_sku VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    price_ex_vat DECIMAL(10, 2) NOT NULL,
    qty_on_hand INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB,
    UNIQUE(supplier_name, supplier_sku)
);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_master_sku ON products(master_sku);
