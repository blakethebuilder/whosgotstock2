import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    
    // Check if table exists and get structure
    let tableExists = false;
    let structure = [];
    let rowCount = 0;
    let sampleData = [];
    
    try {
      // Get table structure
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'evenflow_products' 
        ORDER BY ordinal_position
      `);
      
      structure = structureResult.rows;
      tableExists = structure.length > 0;
      
      if (tableExists) {
        // Get row count
        const countResult = await client.query('SELECT COUNT(*) FROM evenflow_products');
        rowCount = parseInt(countResult.rows[0].count);
        
        // Get sample data
        if (rowCount > 0) {
          const sampleResult = await client.query('SELECT * FROM evenflow_products LIMIT 5');
          sampleData = sampleResult.rows;
        }
      }
    } catch (err: any) {
      client.release();
      return NextResponse.json({ 
        tableExists: false,
        error: err.message 
      });
    }
    
    client.release();
    
    return NextResponse.json({
      tableExists,
      structure,
      rowCount,
      sampleData
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}