import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  
  try {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT p.id::text, p.name, p.price_ex_vat, p.qty_on_hand, s.name as supplier_name
        FROM products p
        JOIN suppliers s ON p.supplier_name = s.name
        WHERE p.name ILIKE $1
        LIMIT 10
      `, [`%${q}%`]);
      
      return NextResponse.json({
        success: true,
        count: res.rowCount,
        results: res.rows
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      stack: err.stack
    }, { status: 500 });
  }
}
