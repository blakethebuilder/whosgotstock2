import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();
    
    // Get all products from manual_products table
    const manualProductsResult = await client.query(`
      SELECT * FROM manual_products 
      WHERE supplier_name = 'Even Flow'
      ORDER BY id
    `);
    
    let migratedCount = 0;
    
    if (manualProductsResult.rows.length > 0) {
      await client.query('BEGIN');
      
      for (const product of manualProductsResult.rows) {
        try {
          // Insert into evenflow_products table
          await client.query(`
            INSERT INTO evenflow_products (
              ef_code, product_name, description, standard_price, 
              selling_price, category, sheet_name, raw_data, last_updated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (ef_code) DO UPDATE SET
              product_name = EXCLUDED.product_name,
              description = EXCLUDED.description,
              standard_price = EXCLUDED.standard_price,
              selling_price = EXCLUDED.selling_price,
              category = EXCLUDED.category,
              sheet_name = EXCLUDED.sheet_name,
              raw_data = EXCLUDED.raw_data,
              last_updated = EXCLUDED.last_updated
          `, [
            product.ef_code,
            product.product_name,
            product.description,
            product.standard_price,
            product.selling_price,
            product.category,
            product.sheet_name,
            product.raw_data,
            product.last_updated
          ]);
          
          migratedCount++;
        } catch (err) {
          console.error('Error migrating product:', product.ef_code, err);
        }
      }
      
      await client.query('COMMIT');
      
      // Remove EvenFlow products from manual_products table
      const deleteResult = await client.query(`
        DELETE FROM manual_products 
        WHERE supplier_name = 'Even Flow'
      `);
      
      console.log(`Deleted ${deleteResult.rowCount} products from manual_products`);
    }
    
    client.release();
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully migrated ${migratedCount} EvenFlow products from manual_products to evenflow_products table`,
      foundProducts: manualProductsResult.rows.length,
      migratedCount,
      deletedFromManual: manualProductsResult.rows.length
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}