import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ results: [] });
    }

    // Simple fuzzy search using ILIKE
    // In production we might use efficient full-text search (tsvector)
    const query = `
    SELECT * FROM products 
    WHERE 
      name ILIKE $1 OR 
      brand ILIKE $1 OR 
      supplier_sku ILIKE $1 OR
      master_sku ILIKE $1
    LIMIT 50
  `;

    const values = [`%${q}%`];

    try {
        const client = await pool.connect();
        const result = await client.query(query, values);
        client.release();

        return NextResponse.json({ results: result.rows });
    } catch (err: any) {
        console.error('Search error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
