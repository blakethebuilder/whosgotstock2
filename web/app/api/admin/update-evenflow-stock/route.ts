import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();

    try {
      // Update Evenflow stock to more realistic values based on price
      const result = await client.query(`
        UPDATE products SET qty_on_hand = CASE
          WHEN price_ex_vat > 10000 THEN 2
          WHEN price_ex_vat > 5000 THEN 5
          WHEN price_ex_vat > 2000 THEN 10
          WHEN price_ex_vat > 1000 THEN 15
          WHEN price_ex_vat > 500 THEN 25
          WHEN price_ex_vat > 200 THEN 50
          ELSE 100
        END,
        stock_jhb = CASE
          WHEN price_ex_vat > 10000 THEN 1
          WHEN price_ex_vat > 5000 THEN 3
          WHEN price_ex_vat > 2000 THEN 6
          WHEN price_ex_vat > 1000 THEN 9
          WHEN price_ex_vat > 500 THEN 15
          WHEN price_ex_vat > 200 THEN 30
          ELSE 50
        END,
        stock_cpt = CASE
          WHEN price_ex_vat > 10000 THEN 1
          WHEN price_ex_vat > 5000 THEN 2
          WHEN price_ex_vat > 2000 THEN 4
          WHEN price_ex_vat > 1000 THEN 6
          WHEN price_ex_vat > 500 THEN 10
          WHEN price_ex_vat > 200 THEN 20
          ELSE 50
        END
        WHERE supplier_name = 'Even Flow'
      `);

      return NextResponse.json({
        success: true,
        message: `Updated ${result.rowCount} Evenflow products with realistic stock quantities`,
        updated: result.rowCount
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Stock update error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}