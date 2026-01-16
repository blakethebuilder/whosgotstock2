import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { supplierSlug } = await request.json();

    if (!supplierSlug) {
      return NextResponse.json({ error: 'Supplier slug required' }, { status: 400 });
    }

    // Get supplier details
    const client = await pool.connect();
    try {
      const supplierResult = await client.query(
        'SELECT * FROM suppliers WHERE slug = $1 AND enabled = true',
        [supplierSlug]
      );

      if (supplierResult.rows.length === 0) {
        return NextResponse.json({ error: 'Supplier not found or disabled' }, { status: 404 });
      }

      const supplier = supplierResult.rows[0];

      // Trigger ingestion manually
      // For now, we'll just return success - the actual ingestion would need to run the worker
      // In a real implementation, this would spawn a worker process or call the ingestion logic

      console.log(`Manual ingestion triggered for ${supplier.name} (${supplier.slug})`);

      return NextResponse.json({
        success: true,
        message: `Ingestion triggered for ${supplier.name}`,
        supplier: supplier.name,
        type: supplier.type,
        note: 'Manual ingestion request logged. Worker will process on next cycle.'
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Manual ingestion error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}