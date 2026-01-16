import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // Get supplier statistics
      const statsQuery = `
        SELECT
          s.name as supplier_name,
          s.slug as supplier_slug,
          s.type as supplier_type,
          s.enabled,
          COUNT(p.id) as total_products,
          COUNT(CASE WHEN p.qty_on_hand > 0 THEN 1 END) as products_in_stock,
          MAX(p.last_updated) as last_updated,
          AVG(p.price_ex_vat) as avg_price,
          MIN(p.price_ex_vat) as min_price,
          MAX(p.price_ex_vat) as max_price
        FROM suppliers s
        LEFT JOIN products p ON s.name = p.supplier_name
        GROUP BY s.id, s.name, s.slug, s.type, s.enabled
        ORDER BY s.name ASC
      `;

      const result = await client.query(statsQuery);

      const stats = result.rows.map(row => ({
        supplier_name: row.supplier_name,
        supplier_slug: row.supplier_slug,
        supplier_type: row.supplier_type,
        enabled: row.enabled,
        total_products: parseInt(row.total_products) || 0,
        products_in_stock: parseInt(row.products_in_stock) || 0,
        last_updated: row.last_updated,
        avg_price: row.avg_price ? parseFloat(row.avg_price).toFixed(2) : '0.00',
        min_price: row.min_price ? parseFloat(row.min_price).toFixed(2) : '0.00',
        max_price: row.max_price ? parseFloat(row.max_price).toFixed(2) : '0.00'
      }));

      return NextResponse.json(stats);

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Supplier stats error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}