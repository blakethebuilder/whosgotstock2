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

      console.log(`Manual ingestion request logged for ${supplier.name} (${supplier.slug})`);

      // For now, just log the request. The worker will handle actual ingestion.
      // In a production setup, this could trigger the worker via a message queue or API call.

      return NextResponse.json({
        success: true,
        message: `Ingestion request logged for ${supplier.name}. Worker will process on next cycle.`,
        supplier: supplier.name,
        type: supplier.type,
        note: 'Check worker logs in ~8 hours for actual ingestion results.'
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Manual ingestion API error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
          return results;
        }
      });

      if (products && products.length > 0) {
        console.log(`Fetched ${products.length} products from ${supplier.name}`);

        // Insert products in batches
        const chunkSize = 300;
        let totalInserted = 0;

        for (let i = 0; i < products.length; i += chunkSize) {
          const chunk = products.slice(i, i + chunkSize);
          const values: any[] = [];
          const valueParams: string[] = [];
          let paramIdx = 1;

          chunk.forEach((p: any) => {
            valueParams.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8}, $${paramIdx + 9}, $${paramIdx + 10}, $${paramIdx + 11}, $${paramIdx + 12}, CURRENT_TIMESTAMP)`);
            values.push(
              p.master_sku, p.supplier_sku, p.supplier_name, p.name, p.description, p.brand,
              p.price_ex_vat, p.qty_on_hand, p.raw_data, p.image_url, p.category,
              p.stock_jhb || 0, p.stock_cpt || 0
            );
            paramIdx += 13;
          });

          const query = `
            INSERT INTO products (
              master_sku, supplier_sku, supplier_name, name, description, brand,
              price_ex_vat, qty_on_hand, raw_data, image_url, category, stock_jhb, stock_cpt, last_updated
            )
            VALUES ${valueParams.join(',')}
            ON CONFLICT (supplier_name, supplier_sku)
            DO UPDATE SET
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              brand = EXCLUDED.brand,
              price_ex_vat = EXCLUDED.price_ex_vat,
              qty_on_hand = EXCLUDED.qty_on_hand,
              raw_data = EXCLUDED.raw_data,
              image_url = EXCLUDED.image_url,
              category = EXCLUDED.category,
              stock_jhb = EXCLUDED.stock_jhb,
              stock_cpt = EXCLUDED.stock_cpt,
              last_updated = CURRENT_TIMESTAMP
          `;

          await client.query(query, values);
          totalInserted += chunk.length;
          console.log(`Inserted/updated ${totalInserted}/${products.length} products`);
        }

        return { success: true, productsCount: products.length };
      } else {
        console.log(`No products fetched from ${supplier.name}`);
        return { success: true, productsCount: 0 };
      }
    } else {
      // For other supplier types, we can't easily run them manually
      console.log(`Manual ingestion not supported for ${supplier.type} suppliers`);
      return { success: false, error: `Manual ingestion not supported for ${supplier.type} suppliers` };
    }

  } catch (error: any) {
    console.error('Manual ingestion error:', error);
    return { success: false, error: error.message };
  }
}

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

      console.log(`Manual ingestion request logged for ${supplier.name} (${supplier.slug})`);

      // Just log the request - the worker will handle actual ingestion
      // In production, this could send a message to trigger the worker

      return NextResponse.json({
        success: true,
        message: `Ingestion request logged for ${supplier.name}. Worker will process on next cycle.`,
        supplier: supplier.name,
        type: supplier.type,
        note: 'Check worker logs in ~8 hours for actual ingestion results.'
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Manual ingestion API error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
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

      console.log(`Manual ingestion triggered for ${supplier.name} (${supplier.slug}) - starting actual ingestion`);

      // Actually run the ingestion
      const result = await runManualIngestion(client, supplier);
      console.log(`Manual ingestion completed for ${supplier.name}:`, result);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Successfully ingested ${result.productsCount} products for ${supplier.name}`,
          supplier: supplier.name,
          type: supplier.type,
          productsCount: result.productsCount
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error,
          supplier: supplier.name
        }, { status: 500 });
      }

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Manual ingestion API error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}