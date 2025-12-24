import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Try Database First
    const client = await pool.connect();
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
    const result = await client.query(query, values);
    client.release();
    return NextResponse.json({ results: result.rows });

  } catch (err) {
    console.warn('Database connection failed, falling back to local file:', err);

    // Fallback: Read from web/data/products.json
    try {
      const filePath = path.join(process.cwd(), 'data', 'products.json');
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ results: [] });
      }

      const fileData = fs.readFileSync(filePath, 'utf8');
      const products = JSON.parse(fileData);

      // Simple in-memory search
      const filtered = products.filter((p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.supplier_sku?.toLowerCase().includes(q)
      ).slice(0, 50);

      return NextResponse.json({ results: filtered });

    } catch (fileErr) {
      console.error("File read error:", fileErr);
      return NextResponse.json({ results: [] });
    }
  }
}
