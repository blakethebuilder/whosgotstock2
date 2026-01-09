require('dotenv').config();
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');

// CSV Parser for Mustek API
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    // Parse header line - handle potential comma-in-quotes scenarios
    const headers = lines[0].split(',').map(h => h.trim());
    
    const results = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Simple CSV parsing - handles basic comma separation
        // For complex CSVs with quoted fields containing commas, use regex
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim()); // Push last value
        
        // Create object from headers and values
        const obj = {};
        headers.forEach((header, idx) => {
            obj[header] = values[idx] || '';
        });
        results.push(obj);
    }
    
    return results;
}

async function fetchFeed(url) {
    if (!url.startsWith('http')) {
        // Mock data fallback
        return ``;
    }
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return await res.text();
    } catch (err) {
        console.error(`Fetch inner error for ${url}:`, err.message);
        throw err;
    }
}

async function saveToLocalFile(products) {
    const dataPath = path.join(__dirname, '../../web/data/products.json');
    let existing = [];
    try {
        if (fs.existsSync(dataPath)) {
            existing = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (e) { }

    // Merge strategy: Filter out old items from this supplier and add new ones
    // For simplicity in this demo, we'll just append/replace by id logic if we had it,
    // but here we will effectively re-write the supplier's chunk.

    const supplierName = products.length > 0 ? products[0].supplier_name : '';
    console.log(`Saving ${products.length} products for ${supplierName} to file...`);
    if (!supplierName) return;

    const otherSuppliers = existing.filter(p => p.supplier_name !== supplierName);
    const all = [...otherSuppliers, ...products];

    fs.writeFileSync(dataPath, JSON.stringify(all, null, 2));
    console.log(`Saved total ${all.length} products to ${dataPath}`);
}

async function ingestData(client) {
    let suppliers = [];

    if (client) {
        console.log('Loading suppliers from Database...');
        try {
            const res = await client.query("SELECT * FROM suppliers WHERE enabled = true");
            // Map DB columns to internal expected format if different, but they are aligned (slug as id)
            suppliers = res.rows.map(r => ({
                id: r.slug,
                name: r.name,
                url: r.url,
                type: r.type,
                enabled: r.enabled
            }));
        } catch (err) {
            console.error('Failed to load suppliers from DB:', err);
        }
    } else {
        // Fallback to suppliers.json with environment variable substitution
        console.log('Loading suppliers from file...');
        try {
            let suppliersData = fs.readFileSync(path.join(__dirname, 'suppliers.json'), 'utf8');
            // Replace environment variables in the JSON
            suppliersData = suppliersData
                .replace(/blake@smartintegrate\.co\.za/g, process.env.ESQUIRE_EMAIL || 'blake@smartintegrate.co.za')
                .replace(/Smart@1991/g, process.env.ESQUIRE_PASSWORD || 'Smart@1991')
                .replace(/f49294f4-cf6b-429c-895f-d27d539cdac4/g, process.env.MUSTEK_CUSTOMER_TOKEN || 'f49294f4-cf6b-429c-895f-d27d539cdac4')
                .replace(/668EFF7-494A-43B9-90A8-E72B79648CFC/g, process.env.SYNTECH_API_KEY || '668EFF7-494A-43B9-90A8-E72B79648CFC')
                .replace(/942709f3-9b39-4e93-9a5e-cdd883453178/g, process.env.PINNACLE_API_KEY || '942709f3-9b39-4e93-9a5e-cdd883453178');
            suppliers = JSON.parse(suppliersData);
        } catch (err) {
            console.error('Failed to load suppliers from file:', err);
            return;
        }
    }

    for (const supplier of suppliers) {
        if (!supplier.enabled) continue;

        console.log(`Starting ingest for ${supplier.name} (Type: ${supplier.type})...`);

        try {
            const feedData = await fetchFeed(supplier.url);
            let products = [];
            let activeType = (supplier.type && supplier.type !== 'xml' && supplier.type !== 'json' && supplier.type !== 'csv')
                ? supplier.type.toLowerCase()
                : supplier.id.toLowerCase();

            // Handle CSV format (Mustek)
            if (supplier.type === 'csv' || activeType === 'mustek') {
                console.log(`Parsing CSV feed for ${supplier.name}...`);
                const csvData = parseCSV(feedData);
                console.log(`Parsed ${csvData.length} CSV rows for ${supplier.name}`);
                
                // Mustek CSV mapping
                // Headers: ItemId, Description, QtyAvailable, Price, SupplierItemId, ProductLine, Status, UPCBarcode, Primary Image, Thumbnail
                products = csvData
                    .filter(p => p.Status === 'Active') // Only include active products
                    .map(p => ({
                        supplier_sku: p.ItemId ? String(p.ItemId).trim().substring(0, 255) : 'UNKNOWN',
                        supplier_name: supplier.name,
                        name: (p.Description || '').substring(0, 250),
                        description: p.Description || '',
                        brand: (p.ProductLine || 'Mustek').substring(0, 100),
                        price_ex_vat: parseFloat(p.Price || 0),
                        qty_on_hand: parseInt(p.QtyAvailable || 0),
                        image_url: p['Primary Image'] || p.Thumbnail || '',
                        category: (p.ProductLine || 'General').substring(0, 100),
                        master_sku: `${supplier.id}-${p.ItemId}`.substring(0, 255),
                        raw_data: JSON.stringify(p)
                    }));
            } else {
                // XML parsing for other suppliers
                const parser = new XMLParser();
                const parsed = parser.parse(feedData);

                // SENSITIVE DETECTION: If structure doesn't match Type, try to auto-detect
                if (activeType === 'syntech' && parsed.Pinnacle) activeType = 'pinnacle';
                if (activeType === 'pinnacle' && parsed.syntechstock) activeType = 'syntech';
                if (parsed.syntechstock && activeType !== 'syntech') activeType = 'syntech';
                if (parsed.Pinnacle && activeType !== 'pinnacle') activeType = 'pinnacle';

            // Normalize data based on supplier structure (Schema Mapping)
            if (activeType === 'scoop') {
                // Scoop format: <products><product><sku>...</sku>...</product>...</products>
                const raw = Array.isArray(parsed.products?.product)
                    ? parsed.products.product
                    : (parsed.products?.product ? [parsed.products.product] : []);

                products = raw.map(p => ({
                    supplier_sku: p.sku ? String(p.sku) : 'UNKNOWN',
                    supplier_name: supplier.name,
                    name: p.description,
                    description: p.description,
                    brand: p.manufacturer,
                    price_ex_vat: parseFloat(p.dealer_price || 0),
                    qty_on_hand: parseInt(p.total_stock || 0),
                    image_url: p.image_url,
                    category: 'Network', // Scoop doesn't provide category in this feed, defaulting to Network
                    master_sku: `${supplier.id}-${p.sku}`,
                    raw_data: JSON.stringify(p)
                }));
            } else if (activeType === 'esquire') {
                // Esquire format
                let raw = [];
                if (parsed.ROOT?.products?.product) {
                    raw = parsed.ROOT.products.product;
                } else if (parsed.products?.product) {
                    raw = parsed.products.product;
                }

                if (!Array.isArray(raw)) raw = raw ? [raw] : [];

                products = raw.map(p => {
                    // Enhanced stock quantity handling for Esquire
                    let stockQty = 0;
                    
                    console.log(`Debug - Product: ${p.ProductCode}, AvailableQty: "${p.AvailableQty}" (type: ${typeof p.AvailableQty})`);
                    
                    if (p.AvailableQty !== undefined && p.AvailableQty !== null) {
                        // First try direct number parsing
                        const directNum = parseFloat(p.AvailableQty);
                        if (!isNaN(directNum) && directNum >= 0) {
                            stockQty = Math.floor(directNum);
                        } else if (typeof p.AvailableQty === 'string') {
                            const qtyStr = p.AvailableQty.toLowerCase().trim();
                            
                            // Handle various string formats
                            if (qtyStr === 'yes' || qtyStr === 'y' || qtyStr === 'true' || qtyStr === '1') {
                                stockQty = 1;
                            } else if (qtyStr === 'no' || qtyStr === 'n' || qtyStr === 'false' || qtyStr === '0') {
                                stockQty = 0;
                            } else if (qtyStr.includes('in stock') || qtyStr.includes('available')) {
                                // Try to extract number from "5 in stock", "10 available", etc.
                                const match = qtyStr.match(/(\d+)/);
                                stockQty = match ? parseInt(match[1]) : 1;
                            } else if (qtyStr.includes('out of stock') || qtyStr.includes('unavailable')) {
                                stockQty = 0;
                            } else {
                                // Last resort: try to extract any number from the string
                                const numMatch = qtyStr.match(/(\d+)/);
                                if (numMatch) {
                                    stockQty = parseInt(numMatch[1]);
                                } else {
                                    // If we can't parse anything, default to 0
                                    stockQty = 0;
                                    console.log(`Warning: Could not parse AvailableQty "${p.AvailableQty}" for product ${p.ProductCode}`);
                                }
                            }
                        }
                    }

                    return {
                        supplier_sku: p.ProductCode ? String(p.ProductCode) : 'UNKNOWN',
                        supplier_name: supplier.name,
                        name: p.ProductName,
                        description: p.ProductDescription || '',
                        brand: p.Brand || 'Esquire',
                        price_ex_vat: parseFloat(p.Price || 0),
                        qty_on_hand: stockQty,
                        image_url: p.image,
                        category: p.Category,
                        master_sku: `${supplier.id}-${p.ProductCode}`,
                        raw_data: JSON.stringify(p)
                    };
                });
            } else if (activeType === 'syntech') {
                // Syntech mapping
                let raw = [];
                if (parsed.syntechstock?.stock?.product) {
                    raw = parsed.syntechstock.stock.product;
                } else if (parsed.stock?.product) {
                    raw = parsed.stock.product;
                }

                if (!Array.isArray(raw)) raw = raw ? [raw] : [];

                products = raw.map(p => {
                    const stock = (parseInt(p.cptstock || p.cpt_stock || 0)) +
                        (parseInt(p.jhbstock || p.jhb_stock || 0)) +
                        (parseInt(p.dbnstock || p.dbn_stock || 0));
                    const catRaw = p.categories || p.category || '';
                    const mainCat = catRaw.split(',')[0].trim();

                    return {
                        supplier_sku: p.sku ? String(p.sku) : 'UNKNOWN',
                        supplier_name: supplier.name,
                        name: p.name,
                        description: p.description || '',
                        brand: p.attributes?.brand || p.brand || 'Syntech',
                        price_ex_vat: parseFloat(p.price || 0),
                        qty_on_hand: stock,
                        image_url: p.featured_image || p.image_url,
                        category: mainCat,
                        master_sku: `${supplier.id}-${p.sku}`,
                        raw_data: JSON.stringify(p)
                    };
                });
            } else if (activeType === 'pinnacle') {
                // Pinnacle: <Pinnacle><PTH_XaltPL_Feed_SPSMA064>...
                const root = parsed.Pinnacle || parsed;
                const keys = Object.keys(root);
                // Look for the specific dynamic tag that contains the products
                const productKey = keys.find(k => k.startsWith('PTH_'));
                const raw = productKey ? (Array.isArray(root[productKey]) ? root[productKey] : [root[productKey]]) : [];

                products = raw.map(p => ({
                    supplier_sku: p.StockCode ? String(p.StockCode) : 'UNKNOWN',
                    supplier_name: supplier.name,
                    name: p.ProdName,
                    description: p.ProdDesc || '',
                    brand: p.Brand || 'Pinnacle',
                    price_ex_vat: parseFloat(p.ProdPriceExclVAT || 0),
                    qty_on_hand: parseInt(p.ProdQty || 0),
                    image_url: p.ProdImg,
                    category: p.TopCat || p.category_tree || 'IT',
                    master_sku: `${supplier.id}-${p.StockCode || Math.random()}`,
                    raw_data: JSON.stringify(p)
                }));
            }
            } // End of XML parsing else block

            if (products.length === 0) {
                console.log(`Warning: 0 products found for ${supplier.name}. Active Parser: ${activeType}`);
                // console.log('Parsed Sample:', JSON.stringify(parsed).substring(0, 500));
            }

            // Deduplicate products based on supplier_sku before insertion
            const uniqueProducts = [];
            const seenSkus = new Set();
            for (const p of products) {
                if (!seenSkus.has(p.supplier_sku)) {
                    seenSkus.add(p.supplier_sku);
                    uniqueProducts.push(p);
                }
            }
            products = uniqueProducts;

            console.log(`Found ${products.length} products for ${supplier.name} (after deduplication).`);

            if (products.length > 0) {
                if (client) {
                    try {
                        // Chunking to avoid query size limits (e.g. 500 items)
                        const chunkSize = 500;
                        for (let i = 0; i < products.length; i += chunkSize) {
                            const chunk = products.slice(i, i + chunkSize);

                            const values = [];
                            const valueParams = [];
                            let paramIdx = 1;

                            chunk.forEach(p => {
                                valueParams.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8}, $${paramIdx + 9}, $${paramIdx + 10}, CURRENT_TIMESTAMP)`);
                                values.push(p.master_sku, p.supplier_sku, p.supplier_name, p.name, p.description, p.brand, p.price_ex_vat, p.qty_on_hand, p.raw_data, p.image_url, p.category);
                                paramIdx += 11;
                            });

                            const query = `
                                 INSERT INTO products (master_sku, supplier_sku, supplier_name, name, description, brand, price_ex_vat, qty_on_hand, raw_data, image_url, category, last_updated)
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
                                     last_updated = CURRENT_TIMESTAMP;
                             `;

                            await client.query(query, values);
                        }
                        console.log(`Synced to Postgres.`);
                    } catch (dbErr) {
                        console.error("Database write failed:", dbErr);
                        saveToLocalFile(products);
                    }
                } else {
                    console.log("No DB client, saving to local file.");
                    saveToLocalFile(products);
                }
            }
        } catch (err) {
            console.error(`Failed to ingest ${supplier.name}: ${err.message}`);
        }
    }
}

module.exports = { ingestData };
