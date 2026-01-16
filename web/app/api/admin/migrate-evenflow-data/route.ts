import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();

    // Check for existing EvenFlow products in evenflow_products table
    console.log('Starting Evenflow migration...');
    const existingProductsResult = await client.query(`
      SELECT * FROM evenflow_products
      ORDER BY last_updated DESC
    `);

    console.log('Found', existingProductsResult.rows.length, 'products in evenflow_products table');

    let migratedCount = 0;

    if (existingProductsResult.rows.length > 0) {
      console.log('Starting migration transaction...');
      await client.query('BEGIN');

      for (const product of existingProductsResult.rows) {
        try {
          console.log('Migrating product:', product.ef_code, product.product_name);
          // Insert into main products table
          await client.query(`
            INSERT INTO products (
              master_sku, supplier_sku, supplier_name, name, description, brand,
              price_ex_vat, qty_on_hand, stock_jhb, stock_cpt, image_url, category, raw_data, last_updated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (supplier_name, supplier_sku) DO UPDATE SET
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              brand = EXCLUDED.brand,
              price_ex_vat = EXCLUDED.price_ex_vat,
              qty_on_hand = EXCLUDED.qty_on_hand,
              stock_jhb = EXCLUDED.stock_jhb,
              stock_cpt = EXCLUDED.stock_cpt,
              image_url = EXCLUDED.image_url,
              category = EXCLUDED.category,
              raw_data = EXCLUDED.raw_data,
              last_updated = EXCLUDED.last_updated
          `, [
            `evenflow-${product.ef_code}`,
            product.ef_code,
            'Even Flow',
            product.product_name,
            product.description || product.product_name,
            'Evenflow',
            product.standard_price || product.selling_price || 0,
            (product.standard_price || product.selling_price || 0) > 0 ? 100 : 0,
            0,
            0,
            '',
            product.category,
            product.raw_data || {},
            product.last_updated
          ]);

          migratedCount++;
          console.log('Successfully migrated product:', product.ef_code);
        } catch (err) {
          console.error('Error migrating product:', product.ef_code, err);
        }
      }

      await client.query('COMMIT');
    }
    
    client.release();
    
    return NextResponse.json({
      success: true,
      message: `Migrated ${migratedCount} EvenFlow products from evenflow_products to main products table`,
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