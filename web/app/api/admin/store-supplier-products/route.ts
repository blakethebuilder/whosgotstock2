import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

interface Product {
  name: string;
  price: number;
  link?: string;
  image?: string;
  supplier: string;
  rawPriceText?: string;
  description?: string;
  category?: string;
  productCode?: string;
  inStock?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { supplier, products }: { supplier: string, products: Product[] } = await request.json();
    
    if (!supplier || !products || !Array.isArray(products)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Supplier name and products array are required' 
      }, { status: 400 });
    }

    const client = await pool.connect();
    let insertedCount = 0;
    let updatedCount = 0;

    try {
      await client.query('BEGIN');

      for (const product of products) {
        let query: string;
        let values: any[];

        switch (supplier.toLowerCase()) {
          case 'linkqage':
            query = `
              INSERT INTO linkqage_products (
                product_name, description, price, category, product_url, image_url, 
                in_stock, raw_data, last_updated
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
              ON CONFLICT (product_name, price) 
              DO UPDATE SET 
                description = EXCLUDED.description,
                category = EXCLUDED.category,
                product_url = EXCLUDED.product_url,
                image_url = EXCLUDED.image_url,
                in_stock = EXCLUDED.in_stock,
                raw_data = EXCLUDED.raw_data,
                last_updated = CURRENT_TIMESTAMP
              RETURNING (xmax = 0) AS inserted
            `;
            values = [
              product.name,
              product.description || null,
              product.price,
              product.category || null,
              product.link || null,
              product.image || null,
              product.inStock !== false,
              JSON.stringify(product)
            ];
            break;

          // Evenflow manual imports removed - now uses official JSON API

          default:
            // Use generic manual_supplier_products table
            query = `
              INSERT INTO manual_supplier_products (
                supplier_name, product_code, product_name, description, price, 
                category, product_url, image_url, in_stock, raw_data, last_updated
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
              ON CONFLICT (supplier_name, product_name, price) 
              DO UPDATE SET 
                product_code = EXCLUDED.product_code,
                description = EXCLUDED.description,
                category = EXCLUDED.category,
                product_url = EXCLUDED.product_url,
                image_url = EXCLUDED.image_url,
                in_stock = EXCLUDED.in_stock,
                raw_data = EXCLUDED.raw_data,
                last_updated = CURRENT_TIMESTAMP
              RETURNING (xmax = 0) AS inserted
            `;
            values = [
              supplier,
              product.productCode || null,
              product.name,
              product.description || null,
              product.price,
              product.category || null,
              product.link || null,
              product.image || null,
              product.inStock !== false,
              JSON.stringify(product)
            ];
            break;
        }

        const result = await client.query(query, values);
        if (result.rows[0]?.inserted) {
          insertedCount++;
        } else {
          updatedCount++;
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${products.length} products for ${supplier}`,
        inserted: insertedCount,
        updated: updatedCount,
        total: products.length
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Store supplier products error:', error);
    return NextResponse.json({
      success: false,
      message: `Failed to store products: ${error.message}`
    }, { status: 500 });
  }
}