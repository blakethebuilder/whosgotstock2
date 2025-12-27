const XLSX = require('xlsx');
const fs = require('fs');

// Helper function to sanitize price strings (same as API)
function sanitizePrice(priceStr) {
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

// Helper function to find header row (same as API)
function findHeaderRow(sheetData) {
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

// Helper function to map columns (same as API)
function mapColumns(headerRow) {
  const mapping = {};
  
  headerRow.forEach((cell, index) => {
    const cellText = String(cell || '').toLowerCase().trim();
    
    if (cellText.includes('item code') || cellText.includes('ef code') || cellText.includes('model') || cellText === 'sku') {
      mapping.sku = index;
    }
    else if (cellText.includes('description') || cellText.includes('name') || cellText.includes('product')) {
      mapping.name = index;
    }
    else if (cellText.includes('price') || cellText.includes('cost') || cellText.includes('amount')) {
      mapping.price = index;
    }
  });
  
  return mapping;
}

// Main test function
function testExcelFile(filePath) {
  console.log(`\n🔍 Testing Excel file: ${filePath}\n`);
  
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    console.log(`📊 Found ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}\n`);
    
    const allProducts = {};
    let totalProcessed = 0;
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n📋 Processing sheet: "${sheetName}"`);
      
      // Skip junk sheets
      if (sheetName.toLowerCase().includes('index') || 
          sheetName.toLowerCase().includes('summary') ||
          sheetName.toLowerCase().includes('contents')) {
        console.log(`   ⏭️  Skipping junk sheet`);
        continue;
      }

      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      if (sheetData.length < 2) {
        console.log(`   ⚠️  Empty sheet, skipping`);
        continue;
      }

      // Find header row
      const headerRowIndex = findHeaderRow(sheetData);
      const headerRow = sheetData[headerRowIndex];
      
      console.log(`   📍 Header row found at index ${headerRowIndex}`);
      console.log(`   📝 Headers: ${headerRow.join(' | ')}`);
      
      // Map columns
      const columnMapping = mapColumns(headerRow);
      console.log(`   🗺️  Column mapping:`, columnMapping);
      
      if (!columnMapping.sku || !columnMapping.price) {
        console.log(`   ❌ Missing required columns (SKU: ${columnMapping.sku !== undefined}, Price: ${columnMapping.price !== undefined})`);
        continue;
      }

      let sheetProducts = 0;
      
      // Process first 5 data rows as sample
      const sampleRows = Math.min(5, sheetData.length - headerRowIndex - 1);
      console.log(`   📦 Processing ${sampleRows} sample products:`);
      
      for (let i = headerRowIndex + 1; i <= headerRowIndex + sampleRows; i++) {
        const row = sheetData[i];
        if (!row || row.length === 0) continue;

        const sku = String(row[columnMapping.sku] || '').trim();
        const name = String(row[columnMapping.name] || '').trim();
        const rawPrice = row[columnMapping.price];

        if (!sku || !rawPrice) continue;

        const price = sanitizePrice(rawPrice);
        if (price <= 0) continue;

        console.log(`      • SKU: ${sku} | Name: ${name || 'N/A'} | Price: R${price} (from: ${rawPrice})`);

        const product = {
          sku,
          name: name || sku,
          price,
          category: sheetName,
          source_type: 'manual_upload'
        };

        // Deduplication: keep lowest price
        if (!allProducts[sku] || allProducts[sku].price > price) {
          allProducts[sku] = product;
        }

        sheetProducts++;
        totalProcessed++;
      }
      
      console.log(`   ✅ ${sheetProducts} products processed from this sheet`);
      
      // Show total rows available
      const totalRows = sheetData.length - headerRowIndex - 1;
      if (totalRows > sampleRows) {
        console.log(`   📊 (${totalRows - sampleRows} more rows available in full processing)`);
      }
    }
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`   Total unique products: ${Object.keys(allProducts).length}`);
    console.log(`   Total rows processed: ${totalProcessed}`);
    console.log(`   Categories found: ${[...new Set(Object.values(allProducts).map(p => p.category))].join(', ')}`);
    
    // Show sample of final products
    console.log(`\n📋 Sample of final products after deduplication:`);
    Object.values(allProducts).slice(0, 5).forEach(product => {
      console.log(`   • ${product.sku} - ${product.name} - R${product.price} (${product.category})`);
    });
    
  } catch (error) {
    console.error('❌ Error processing file:', error.message);
  }
}

// Usage
const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: node test-excel-parser.js <path-to-excel-file>');
  console.log('Example: node test-excel-parser.js ./evenflow-pricelist.xlsx');
} else {
  testExcelFile(filePath);
}