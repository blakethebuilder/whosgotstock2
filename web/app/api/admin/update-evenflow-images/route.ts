import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();

    try {
      // Check if Evenflow products have image URLs in raw_data that we can extract
      const checkResult = await client.query(`
        SELECT COUNT(*) as total_products,
               COUNT(CASE WHEN raw_data->>'ImageUrl' IS NOT NULL THEN 1 END) as with_image_url,
               COUNT(CASE WHEN raw_data->>'Image' IS NOT NULL THEN 1 END) as with_image,
               COUNT(CASE WHEN raw_data->>'ProductImage' IS NOT NULL THEN 1 END) as with_product_image
        FROM products
        WHERE supplier_name = 'Even Flow'
      `);

      console.log('Evenflow image check:', checkResult.rows[0]);

      // Update products with image URLs from raw_data if available
      const updateResult = await client.query(`
        UPDATE products
        SET image_url = COALESCE(
          raw_data->>'ImageUrl',
          raw_data->>'Image',
          raw_data->>'ProductImage',
          ''
        )
        WHERE supplier_name = 'Even Flow'
        AND (image_url IS NULL OR image_url = '')
        AND (
          raw_data->>'ImageUrl' IS NOT NULL OR
          raw_data->>'Image' IS NOT NULL OR
          raw_data->>'ProductImage' IS NOT NULL
        )
      `);

      return NextResponse.json({
        success: true,
        message: `Updated ${updateResult.rowCount} Evenflow products with image URLs`,
        stats: checkResult.rows[0],
        updated: updateResult.rowCount
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Image update error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}