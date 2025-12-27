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
    
    if (matchCount >= 2) {
      return i;
    }
  }
  
  return 0;
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
      mapping.standardPrice = index;
    }
    else if (cellText.includes('selling price') || cellText === 'selling price') {
      mapping.sellingPrice = index;
    }
    else if (!mapping.standardPrice && !mapping.sellingPrice && (cellText.includes('price') || cellText.includes('cost') || cellText.includes('amount'))) {
      mapping.standardPrice = index;
    }
  });
  
  return mapping;
}

export async function POST(request: NextRequest) {
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
    
    // Import xlsx dynamically
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
      
      if (sheetData.length < 2) continue;

      // Find header row
      const headerRowIndex = findHeaderRow(sheetData as any[][]);
      const headerRow = sheetData[headerRowIndex] as any[];
      
      // Map columns
      const columnMapping = mapColumns(headerRow);
      
      if (!columnMapping.sku || (!columnMapping.standardPrice && !columnMapping.sellingPrice)) {
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
          const rawStandardPrice = row[columnMapping.standardPrice];
          const rawSellingPrice = row[columnMapping.sellingPrice];

          if (!rawSku || (!rawStandardPrice && !rawSellingPrice)) continue;

          const efCode = rawSku.substring(0, 255);
          const productName = (rawName || rawSku).substring(0, 500); // Allow longer names
          const category = sheetName.substring(0, 255);

          const standardPrice = sanitizePrice(rawStandardPrice);
          const sellingPrice = sanitizePrice(rawSellingPrice);

          if (standardPrice <= 0 && sellingPrice <= 0) continue;

          const product = {
            efCode,
            productName,
            standardPrice,
            sellingPrice,
            category,
            sheetName
          };

          // Deduplication: keep lowest standard price (or selling price if no standard)
          const currentPrice = standardPrice > 0 ? standardPrice : sellingPrice;
          if (!allProducts[efCode] || 
              (allProducts[efCode].standardPrice > 0 ? allProducts[efCode].standardPrice : allProducts[efCode].sellingPrice) > currentPrice) {
            allProducts[efCode] = product;
          }

          result.totalProcessed++;
        } catch (rowError: any) {
          result.errors.push(`Sheet "${sheetName}", Row ${i + 1}: ${rowError.message}`);
          continue;
        }
      }
    }

    // Insert/Update products in manual_products table
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const product of Object.values(allProducts)) {
        const { efCode, productName, standardPrice, sellingPrice, category, sheetName } = product as any;

        const upsertQuery = `
          INSERT INTO manual_products (
            ef_code, supplier_name, product_name, 
            standard_price, selling_price, category, sheet_name,
            raw_data, last_updated
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP
          )
          ON CONFLICT (supplier_name, ef_code) 
          DO UPDATE SET 
            product_name = EXCLUDED.product_name,
            standard_price = EXCLUDED.standard_price,
            selling_price = EXCLUDED.selling_price,
            category = EXCLUDED.category,
            sheet_name = EXCLUDED.sheet_name,
            raw_data = EXCLUDED.raw_data,
            last_updated = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS is_new;
        `;

        const upsertResult = await client.query(upsertQuery, [
          efCode, 'Even Flow', productName, 
          standardPrice, sellingPrice, category, sheetName,
          JSON.stringify(product)
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
        totalProcessed: Object.keys(allProducts).length
      }
    });

  } catch (error: any) {
    console.error('Manual products ingestion error:', error);
    return NextResponse.json(
      { error: `Processing failed: ${error.message}` },
      { status: 500 }
    );
  }
}