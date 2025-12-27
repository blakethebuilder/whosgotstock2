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
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                raw_data JSONB,
                image_url TEXT,
                description TEXT,
                category VARCHAR(255),
                UNIQUE(supplier_name, supplier_sku)
            );
        `);

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

        // Insert default settings
        await client.query(`
            INSERT INTO settings (key, value) VALUES 
            ('update_interval_minutes', '60'),
            ('free_markup', '15'),
            ('professional_markup', '5'),
            ('enterprise_markup', '0'),
            ('staff_markup', '10'),
            ('partner_markup', '0')
            ON CONFLICT (key) DO NOTHING;
        `);

        // Insert default suppliers
        await client.query(`
            INSERT INTO suppliers (name, slug, url, type, enabled) VALUES 
            ('Scoop', 'scoop', 'https://scoop.co.za/scoop_pricelist.xml', 'xml', true),
            ('Esquire', 'esquire', 'https://api.esquire.co.za/api/DataFeed?u=blake@smartintegrate.co.za&p=Smart@1991&t=xml&m=10&o=ascending&r=RoundNone&rm=10&min=0', 'xml', true)
            ON CONFLICT (slug) DO NOTHING;
        `);

        // Create indexes
        await client.query(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_products_master_sku ON products(master_sku);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`);

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