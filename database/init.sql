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
    image_url TEXT,
    UNIQUE(supplier_name, supplier_sku)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'xml',
    enabled BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT
);

-- Seed Initial Data
INSERT INTO settings (key, value) VALUES ('update_interval_minutes', '60') ON CONFLICT DO NOTHING;

INSERT INTO suppliers (name, slug, url, type, enabled) VALUES 
('Scoop', 'scoop', 'https://scoop.co.za/scoop_pricelist.xml', 'xml', true),
('Esquire', 'esquire', 'https://api.esquire.co.za/api/DataFeed?u=blake@smartintegrate.co.za&p=Smart@1991&t=xml&m=10&o=ascending&r=RoundNone&rm=10&min=0', 'xml', true)
ON CONFLICT (slug) DO NOTHING;

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_master_sku ON products(master_sku);
CREATE INDEX idx_products_category ON products(category);
