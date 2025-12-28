import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();
    
    // Check for existing EvenFlow products in main products table
    const existingProductsResult = await client.query(`
      SELECT * FROM products 
      WHERE supplier_name ILIKE '%even flow%' 
         OR supplier_name ILIKE '%manual upload%'
         OR brand ILIKE '%even flow%'
    `);
    
    let migratedCount = 0;
    
    if (existingProductsResult.rows.length > 0) {
      await client.query('BEGIN');
      
      for (const product of existingProductsResult.rows) {
        try {
          // Insert into evenflow_products table
          await client.query(`
            INSERT INTO evenflow_products (
              ef_code, product_name, standard_price, 
              category, sheet_name, raw_data, last_updated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (ef_code) DO NOTHING
          `, [
            product.supplier_sku,
            product.name,
            product.price_ex_vat,
            product.category || 'Uncategorized',
            product.category || 'Migrated',
            product.raw_data || {},
            product.last_updated
          ]);
          
          migratedCount++;
        } catch (err) {
          console.error('Error migrating product:', product.supplier_sku, err);
        }
      }
      
      await client.query('COMMIT');
      
      // Optionally remove from main products table
      await client.query(`
        DELETE FROM products 
        WHERE supplier_name ILIKE '%even flow%' 
           OR supplier_name ILIKE '%manual upload%'
           OR brand ILIKE '%even flow%'
      `);
    }
    
    client.release();
    
    return NextResponse.json({ 
      success: true,
      message: `Migrated ${migratedCount} EvenFlow products to evenflow_products table`,
      foundProducts: existingProductsResult.rows.length,
      migratedCount
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}