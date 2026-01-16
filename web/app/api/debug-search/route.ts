import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q') || '';
  
  try {
    const client = await pool.connect();
    try {
      // 1. Basic check
      const checkRes = await client.query('SELECT NOW()');
      
      // 2. Simple search
      const searchRes = await client.query(`
        SELECT p.id::text, p.name, p.price_ex_vat, p.qty_on_hand, s.name as supplier_name
        FROM products p
        JOIN suppliers s ON p.supplier_name = s.name
        WHERE p.name ILIKE $1
        LIMIT 5
      `, [`%${rawQuery}%`]);
      
      return NextResponse.json({
        dbTime: checkRes.rows[0].now,
        count: searchRes.rowCount,
        results: searchRes.rows
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      code: err.code
    }, { status: 500 });
  }
}
