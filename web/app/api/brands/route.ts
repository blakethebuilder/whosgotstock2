import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const supplier = searchParams.get('supplier');

    try {
        const client = await pool.connect();

        let query = `
            SELECT brand, COUNT(*) as count 
            FROM products 
        `;
        const params: any[] = [];

        if (supplier) {
            query += ` JOIN suppliers s ON products.supplier_name = s.name WHERE s.slug = $1 AND `;
            params.push(supplier);
        } else {
            query += ` WHERE `;
        }

        query += ` brand IS NOT NULL AND brand != '' 
            GROUP BY brand 
            ORDER BY count DESC 
            LIMIT 100
        `;

        const res = await client.query(query, params);

        client.release();
        return NextResponse.json(res.rows.map(r => r.brand));
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
