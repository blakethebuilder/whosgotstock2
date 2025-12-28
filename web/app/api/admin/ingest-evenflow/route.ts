import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

interface ProcessingResult {
  totalProcessed: number;
  newItems: number;
  updatedItems: number;
  errors: string[];
  categories: string[];
}

// Helper function to sanitize price strings
function sanitizePrice(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  
  // Convert to string and clean
  let cleaned = String(priceStr)
    .replace(/R\s*/gi, '') // Remove R currency symbol
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/,/g, '.') // Replace comma decimals with dots
    .replace(/[^\d.-]/g, ''); // Keep only digits, dots, and minus
  
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

// Helper function to find header row in sheet data
function findHeaderRow(sheetData: any[][]): number {
  const headerKeywords = ['item code', 'ef code', 'model', 'description', 'standard price', 'price', 'sku'];
  
  for (let i = 0; i < Math.min(10, sheetData.length); i++) {
    const row = sheetData[i];
    if (!row) continue;
    
    const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');
    const matchCount = headerKeywords.filter(keyword => rowText.includes(keyword)).length;
    
    if (matchCount >= 2) { // Need at least 2 keywords to consider it a header
      return i;
    }
  }
  
  return 0; // Default to first row if no clear header found
}

// Helper function to map columns
function mapColumns(headerRow: any[]): { [key: string]: number } {
  const mapping: { [key: string]: number } = {};
  
  headerRow.forEach((cell, index) => {
    const cellText = String(cell || '').toLowerCase().trim();
    
    // Map SKU/Item Code columns - prioritize EF Code
    if (cellText.includes('ef code') || cellText === 'ef code') {
      mapping.sku = index;
    }
    else if (!mapping.sku && (cellText.includes('item code') || cellText.includes('model') || cellText === 'sku')) {
      mapping.sku = index;
    }
    // Map description columns
    else if (cellText.includes('description') || cellText.includes('name') || cellText.includes('product')) {
      mapping.name = index;
    }
    // Map price columns - prioritize Standard Price, then Selling Price
    else if (cellText.includes('standard price') || cellText === 'standard price') {
      mapping.price = index;
    }
    else if (!mapping.price && (cellText.includes('selling price') || cellText.includes('price') || cellText.includes('cost') || cellText.includes('amount'))) {
      mapping.price = index;
    }
  });
  
  return mapping;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Only .xlsx files are supported' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Import xlsx dynamically (since it's a Node.js library)
    const XLSX = await import('xlsx');
    
    // Parse the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const result: ProcessingResult = {
      totalProcessed: 0,
      newItems: 0,
      updatedItems: 0,
      errors: [],
      categories: []
    };

    // Store all products for deduplication
    const allProducts: { [sku: string]: any } = {};

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      // Skip junk sheets
      if (sheetName.toLowerCase().includes('index') || 
          sheetName.toLowerCase().includes('summary') ||
          sheetName.toLowerCase().includes('contents')) {
        continue;
      }

      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      if (sheetData.length < 2) continue; // Skip empty sheets

      // Find header row
      const headerRowIndex = findHeaderRow(sheetData as any[][]);
      const headerRow = sheetData[headerRowIndex] as any[];
      
      // Map columns
      const columnMapping = mapColumns(headerRow);
      
      if (!columnMapping.sku || !columnMapping.price) {
        result.errors.push(`Sheet "${sheetName}": Could not find required columns (SKU and Price)`);
        continue;
      }

      result.categories.push(sheetName);

      // Process data rows
      for (let i = headerRowIndex + 1; i < sheetData.length; i++) {
        const row = sheetData[i] as any[];
        if (!row || row.length === 0) continue;

        try {
          const rawSku = String(row[columnMapping.sku] || '').trim();
          const rawName = String(row[columnMapping.name] || '').trim();
          const rawPrice = row[columnMapping.price];

          if (!rawSku || !rawPrice) continue;

          // Truncate fields to fit database constraints (VARCHAR 255)
          const sku = rawSku.substring(0, 255);
          const name = (rawName || rawSku).substring(0, 255);
          const category = sheetName.substring(0, 255);

          const price = sanitizePrice(rawPrice);
          if (price <= 0) continue;

          const product = {
            sku,
            name,
            price,
            category,
            source_type: 'manual_upload'
          };

          // Deduplication: keep lowest price
          if (!allProducts[sku] || allProducts[sku].price > price) {
            allProducts[sku] = product;
          }

          result.totalProcessed++;
        } catch (rowError: any) {
          result.errors.push(`Sheet "${sheetName}", Row ${i + 1}: ${rowError.message}`);
          continue;
        }
      }
    }

    // Insert/Update products in evenflow_products table
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const product of Object.values(allProducts)) {
        const { sku, name, price, category } = product as any;

        const upsertQuery = `
          INSERT INTO evenflow_products (
            ef_code, product_name, standard_price, 
            category, sheet_name, raw_data, last_updated
          ) VALUES (
            $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP
          )
          ON CONFLICT (ef_code) 
          DO UPDATE SET 
            product_name = EXCLUDED.product_name,
            standard_price = EXCLUDED.standard_price,
            category = EXCLUDED.category,
            sheet_name = EXCLUDED.sheet_name,
            raw_data = EXCLUDED.raw_data,
            last_updated = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS is_new;
        `;

        const upsertResult = await client.query(upsertQuery, [
          sku, name, price, category, category, JSON.stringify(product)
        ]);

        if (upsertResult.rows[0]?.is_new) {
          result.newItems++;
        } else {
          result.updatedItems++;
        }
      }

      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        totalProcessed: Object.keys(allProducts).length // Actual unique products processed
      }
    });

  } catch (error: any) {
    console.error('Excel ingestion error:', error);
    return NextResponse.json(
      { error: `Processing failed: ${error.message}` },
      { status: 500 }
    );
  }
}