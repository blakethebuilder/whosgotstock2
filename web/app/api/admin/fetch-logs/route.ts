import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // Get the latest fetch logs, grouped to show the most recent per supplier
      // plus a full history of the last 50 entries
      const result = await client.query(`
        SELECT 
          id,
          supplier_slug,
          supplier_name,
          started_at,
          finished_at,
          status,
          products_fetched,
          products_ingested,
          error_message,
          duration_seconds
        FROM supplier_fetch_log
        ORDER BY started_at DESC
        LIMIT 50
      `);

      return NextResponse.json(result.rows);

    } finally {
      client.release();
    }

  } catch (error: any) {
    // If table doesn't exist yet, return empty array gracefully
    if (error.message?.includes('does not exist')) {
      return NextResponse.json([]);
    }
    console.error('Fetch logs error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
