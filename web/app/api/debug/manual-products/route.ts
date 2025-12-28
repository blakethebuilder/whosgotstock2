import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      // Check if table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'manual_products'
        );
      `);
      
      const tableExists = tableCheck.rows[0].exists;
      
      if (!tableExists) {
        return NextResponse.json({
          error: 'manual_products table does not exist',
          tableExists: false
        });
      }
      
      // Get table structure
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'manual_products' 
        ORDER BY ordinal_position;
      `);
      
      // Get row count
      const count = await client.query('SELECT COUNT(*) FROM manual_products');
      
      // Get sample data
      const sample = await client.query('SELECT * FROM manual_products LIMIT 5');
      
      return NextResponse.json({
        tableExists: true,
        structure: structure.rows,
        rowCount: parseInt(count.rows[0].count),
        sampleData: sample.rows
      });
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      tableExists: false
    }, { status: 500 });
  }
}