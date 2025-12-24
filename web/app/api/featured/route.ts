import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();

        // Get list of enabled suppliers
        const suppliersRes = await client.query("SELECT name FROM suppliers WHERE enabled = true");
        const suppliers = suppliersRes.rows.map(r => r.name);

        const featured: Record<string, any[]> = {};

        for (const supplier of suppliers) {
            // Get 10 random or latest items that have images for this supplier
            // Using "ORDER BY last_updated DESC" implies latest ingest
            const res = await client.query(
                `SELECT * FROM products 
             WHERE supplier_name = $1 AND image_url IS NOT NULL 
             ORDER BY last_updated DESC 
             LIMIT 10`,
                [supplier]
            );
            featured[supplier] = res.rows;
        }

        client.release();
        return NextResponse.json(featured);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
