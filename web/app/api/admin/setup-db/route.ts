import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
    try {
        const client = await pool.connect();
        
        // Create tables
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                master_sku VARCHAR(255),
                supplier_sku VARCHAR(255) NOT NULL,
                supplier_name VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                brand VARCHAR(255),
                price_ex_vat DECIMAL(10, 2) NOT NULL,
                qty_on_hand INTEGER DEFAULT 0,
                stock_jhb INTEGER DEFAULT 0,
                stock_cpt INTEGER DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                raw_data JSONB,
                image_url TEXT,
                description TEXT,
                category VARCHAR(255),
                UNIQUE(supplier_name, supplier_sku)
            );
        `);

        // Migration: Add columns if they don't exist
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_jhb INTEGER DEFAULT 0;`);
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_cpt INTEGER DEFAULT 0;`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL UNIQUE,
                url TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'xml',
                enabled BOOLEAN DEFAULT true
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS settings (
                key VARCHAR(255) PRIMARY KEY,
                value TEXT
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS manual_products (
                id SERIAL PRIMARY KEY,
                supplier_sku VARCHAR(255) NOT NULL,
                supplier_name VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                brand VARCHAR(255),
                price_ex_vat DECIMAL(10, 2) NOT NULL,
                qty_on_hand INTEGER DEFAULT 0,
                category VARCHAR(255),
                description TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                raw_data JSONB,
                UNIQUE(supplier_name, supplier_sku)
            );
        `);

        // Create supplier_fetch_log table
        await client.query(`
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
        `);

        // Insert default settings
        await client.query(`
            INSERT INTO settings (key, value) VALUES
            ('update_interval_minutes', '60'),
            ('free_markup', '15'),
            ('professional_markup', '5'),
            ('enterprise_markup', '0'),
            ('staff_markup', '10'),
            ('partner_markup', '0'),
            ('EVENFLOW_EMAIL', 'blake@smartintegrate.co.za'),
            ('EVENFLOW_PASSWORD', 'Smart@2026!')
            ON CONFLICT (key) DO NOTHING;
        `);

        // Insert default suppliers (including Linkqage, Mustek, Syntech, Pinnacle)
        await client.query(`
            INSERT INTO suppliers (name, slug, url, type, enabled) VALUES
            ('Scoop', 'scoop', 'https://scoop.co.za/scoop_pricelist.xml', 'xml', true),
            ('Esquire', 'esquire', 'https://api.esquire.co.za/api/DataFeed?u=blake@smartintegrate.co.za&p=Smart@1991&t=xml&m=10&o=ascending&r=RoundNone&rm=10&min=0', 'xml', true),
            ('Even Flow', 'evenflow', 'https://www.evenflow.online/B2BPricingFeed/GetB2BPricing', 'json', true),
            ('Mustek', 'mustek', 'https://api.mustek.co.za/Customer/ItemsStock.ashx?CustomerToken=f49294f4-cf6b-429c-895f-d27d539cdac4', 'csv', true),
            ('Syntech', 'syntech', 'https://www.syntech.co.za/feeds/feedhandler.php?key=668EEFF7-494A-43B9-908B-E72B79648CFC&feed=syntech-xml-full', 'xml', true),
            ('Pinnacle', 'pinnacle', 'https://www.pinnacle.co.za/pinnacle/productfeed/xml/id/8756/uid/942709f3-9b39-4e93-9a5e-cdd883453178/', 'xml', true),
            ('Linkqage', 'linkqage', 'https://linkqage.ftgdrop.co.za/api/v1/feed/', 'json', true)
            ON CONFLICT (slug) DO NOTHING;
        `);

        // Create indexes
        await client.query(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_products_master_sku ON products(master_sku);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_fetch_log_supplier ON supplier_fetch_log(supplier_slug);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_fetch_log_started ON supplier_fetch_log(started_at DESC);`);

        // Fix existing Linkqage relative image URLs in the database
        await client.query(`
            UPDATE products 
            SET image_url = raw_data->'attributes'->'metadata'->>'primary_image_tenancy_url' 
            WHERE supplier_name = 'Linkqage' 
              AND (image_url LIKE 'product_primary%' OR image_url IS NULL OR image_url = '');
        `);

        client.release();
        
        return NextResponse.json({ 
            success: true, 
            message: 'Database setup completed successfully' 
        });
    } catch (err: any) {
        return NextResponse.json({ 
            error: err.message,
            code: err.code 
        }, { status: 500 });
    }
}