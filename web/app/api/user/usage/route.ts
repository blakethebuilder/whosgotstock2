import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  let client;
  try {
    client = await pool.connect();

    // Get total product count
    const productCountRes = await client.query('SELECT COUNT(*) FROM products');
    const totalProducts = parseInt(productCountRes.rows[0].count);

    // Get active supplier count
    const supplierCountRes = await client.query('SELECT COUNT(*) FROM suppliers WHERE enabled = true');
    const totalSuppliers = parseInt(supplierCountRes.rows[0].count);

    // Mock usage data for now - would normally be per-user
    const usageData = {
      searchesThisMonth: 12,
      searchLimit: 25,
      quotesGenerated: 4,
      isLimitReached: false,
      totalProducts,
      totalSuppliers
    };

    return NextResponse.json(usageData);
  } catch (error: any) {
    console.error('Usage calculation error:', error);
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.message.includes('connection')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch usage data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}