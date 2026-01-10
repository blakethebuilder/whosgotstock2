require('dotenv').config();
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');

// Utility to mask sensitive parts of a URL for logging
function maskUrl(url) {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        const params = urlObj.searchParams;
        
        // List of sensitive parameters to mask
        const sensitiveParams = ['u', 'p', 'CustomerToken', 'key', 'apiKey', 'token', 'pass', 'password', 'user', 'username'];
        
        sensitiveParams.forEach(param => {
            if (params.has(param)) {
                params.set(param, '********');
            }
        });
        
        return urlObj.toString();
    } catch (e) {
        // If not a valid URL, just return it masked generically if long
        return url.length > 20 ? url.substring(0, 15) + '...' : url;
    }
}

// Category Normalization Function
function normalizeCategory(rawCategory, supplierId) {
    if (!rawCategory) return 'Miscellaneous';
    const normalized = rawCategory.toLowerCase().trim();

    // Mapping rules
    if (normalized.includes('network') || supplierId === 'scoop') return 'Networking & Connectivity';
    if (normalized.includes('storage') || normalized.includes('hdd') || normalized.includes('ssd') || normalized.includes('drive')) return 'Storage';
    if (normalized.includes('memory') || normalized.includes('ram') || normalized.includes('ddr')) return 'Memory';
    if (normalized.includes('processor') || normalized.includes('cpu')) return 'Processors';
    if (normalized.includes('graphics') || normalized.includes('gpu') || normalized.includes('video card')) return 'Graphics Cards';
    if (normalized.includes('laptop') || normalized.includes('notebook')) return 'Laptops';
    if (normalized.includes('desktop') || normalized.includes('workstation')) return 'Desktops';
    if (normalized.includes('monitor') || normalized.includes('display')) return 'Displays';
    if (normalized.includes('printer') || normalized.includes('ink') || normalized.includes('toner')) return 'Printers & Supplies';
    if (normalized.includes('cable') || normalized.includes('connector')) return 'Cables & Connectivity';
    if (normalized.includes('ups') || normalized.includes('power') || normalized.includes('battery')) return 'Power Solutions';
    if (normalized.includes('security') || normalized.includes('camera') || normalized.includes('cctv')) return 'Security';
    
    // Default: Capitalize first letter
    return rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();
}

// CSV Parser for Mustek API
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const results = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
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
        values.push(current.trim());
        
        const obj = {};
        headers.forEach((header, idx) => {
            obj[header] = values[idx] || '';
        });
        results.push(obj);
    }
    return results;
}

async function fetchFeed(url) {
    if (!url.startsWith('http')) return ``;
    
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(60000) // Increased to 60s
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return await res.text();
    } catch (err) {
        console.error(`Fetch error for ${maskUrl(url)}:`, err.message);
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
    } catch (e) {}

    const supplierName = products.length > 0 ? products[0].supplier_name : '';
    if (!supplierName) return;

    const otherSuppliers = existing.filter(p => p.supplier_name !== supplierName);
    const all = [...otherSuppliers, ...products];

    try {
        if (!fs.existsSync(path.dirname(dataPath))) {
            fs.mkdirSync(path.dirname(dataPath), { recursive: true });
        }
        fs.writeFileSync(dataPath, JSON.stringify(all, null, 2));
        console.log(`Fallback: Saved ${all.length} total products to JSON.`);
    } catch (e) {
        console.error("Failed to save local file:", e.message);
    }
}

async function ingestData(client) {
    let suppliers = [];

    if (client) {
        console.log('Loading suppliers from Database...');
        try {
            const res = await client.query("SELECT * FROM suppliers WHERE enabled = true");
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
        console.log('Loading suppliers from file...');
        try {
            let suppliersData = fs.readFileSync(path.join(__dirname, 'suppliers.json'), 'utf8');
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

        console.log(`\n>>> Ingesting ${supplier.name}...`);
        
        try {
            const feedData = await fetchFeed(supplier.url);
            let products = [];
            let activeType = (supplier.type && !['xml', 'json', 'csv'].includes(supplier.type.toLowerCase()))
                ? supplier.type.toLowerCase()
                : supplier.id.toLowerCase();

            if (supplier.type === 'csv' || activeType === 'mustek') {
                const csvData = parseCSV(feedData);
                products = csvData
                    .filter(p => p.Status === 'Active')
                    .map(p => ({
                        supplier_sku: p.ItemId ? String(p.ItemId).trim().substring(0, 255) : 'UNKNOWN',
                        supplier_name: supplier.name,
                        name: (p.Description || '').substring(0, 250),
                        description: p.Description || '',
                        brand: (p.ProductLine || 'Mustek').substring(0, 100),
                        price_ex_vat: parseFloat(p.Price || 0),
                        qty_on_hand: parseInt(p.QtyAvailable || 0),
                        image_url: p['Primary Image'] || p.Thumbnail || '',
                        category: normalizeCategory(p.ProductLine, supplier.id),
                        master_sku: `${supplier.id}-${p.ItemId}`.substring(0, 255),
                        raw_data: JSON.stringify(p)
                    }));
            } else {
                const parser = new XMLParser();
                const parsed = parser.parse(feedData);

                if (activeType === 'syntech' && parsed.Pinnacle) activeType = 'pinnacle';
                if (activeType === 'pinnacle' && parsed.syntechstock) activeType = 'syntech';
                if (parsed.syntechstock && activeType !== 'syntech') activeType = 'syntech';
                if (parsed.Pinnacle && activeType !== 'pinnacle') activeType = 'pinnacle';

                if (activeType === 'scoop') {
                    const raw = Array.isArray(parsed.products?.product)
                        ? parsed.products.product
                        : (parsed.products?.product ? [parsed.products.product] : []);

                    products = raw.map(p => ({
                        supplier_sku: p.sku ? String(p.sku) : 'UNKNOWN',
                        supplier_name: supplier.name,
                        name: String(p.description || ''),
                        description: String(p.description || ''),
                        brand: String(p.manufacturer || ''),
                        price_ex_vat: parseFloat(p.dealer_price || 0),
                        qty_on_hand: parseInt(p.total_stock || 0),
                        image_url: String(p.image_url || ''),
                        category: normalizeCategory('Networking', 'scoop'),
                        master_sku: `${supplier.id}-${p.sku}`,
                        raw_data: JSON.stringify(p)
                    }));
                } else if (activeType === 'esquire') {
                    let raw = [];
                    if (parsed.ROOT?.products?.product) raw = parsed.ROOT.products.product;
                    else if (parsed.products?.product) raw = parsed.products.product;
                    if (!Array.isArray(raw)) raw = raw ? [raw] : [];

                    products = raw.map(p => {
                        let stockQty = 0;
                        if (p.AvailableQty !== undefined && p.AvailableQty !== null) {
                            const directNum = parseFloat(p.AvailableQty);
                            if (!isNaN(directNum) && directNum >= 0) {
                                stockQty = Math.floor(directNum);
                            } else if (typeof p.AvailableQty === 'string') {
                                const qtyStr = p.AvailableQty.toLowerCase().trim();
                                if (['yes', 'y', 'true', '1'].includes(qtyStr)) stockQty = 1;
                                else if (['no', 'n', 'false', '0'].includes(qtyStr)) stockQty = 0;
                                else {
                                    const numMatch = qtyStr.match(/(\d+)/);
                                    stockQty = numMatch ? parseInt(numMatch[1]) : (qtyStr.includes('in stock') ? 1 : 0);
                                }
                            }
                        }

                        return {
                            supplier_sku: p.ProductCode ? String(p.ProductCode) : 'UNKNOWN',
                            supplier_name: supplier.name,
                            name: String(p.ProductName || ''),
                            description: String(p.ProductDescription || ''),
                            brand: String(p.Brand || 'Esquire'),
                            price_ex_vat: parseFloat(p.Price || 0),
                            qty_on_hand: stockQty,
                            image_url: String(p.image || ''),
                            category: normalizeCategory(p.Category, 'esquire'),
                            master_sku: `${supplier.id}-${p.ProductCode}`,
                            raw_data: JSON.stringify(p)
                        };
                    });
                } else if (activeType === 'syntech') {
                    let raw = [];
                    if (parsed.syntechstock?.stock?.product) raw = parsed.syntechstock.stock.product;
                    else if (parsed.stock?.product) raw = parsed.stock.product;
                    if (!Array.isArray(raw)) raw = raw ? [raw] : [];

                    products = raw.map(p => {
                        const stock = (parseInt(p.cptstock || p.cpt_stock || 0)) +
                                    (parseInt(p.jhbstock || p.jhb_stock || 0)) +
                                    (parseInt(p.dbnstock || p.dbn_stock || 0));
                        return {
                            supplier_sku: p.sku ? String(p.sku) : 'UNKNOWN',
                            supplier_name: supplier.name,
                            name: String(p.name || ''),
                            description: String(p.description || ''),
                            brand: String(p.attributes?.brand || p.brand || 'Syntech'),
                            price_ex_vat: parseFloat(p.price || 0),
                            qty_on_hand: stock,
                            image_url: String(p.featured_image || p.image_url || ''),
                            category: normalizeCategory(p.categories || p.category, 'syntech'),
                            master_sku: `${supplier.id}-${p.sku}`,
                            raw_data: JSON.stringify(p)
                        };
                    });
                } else if (activeType === 'pinnacle') {
                    const root = parsed.Pinnacle || parsed;
                    const productKey = Object.keys(root).find(k => k.startsWith('PTH_'));
                    const raw = productKey ? (Array.isArray(root[productKey]) ? root[productKey] : [root[productKey]]) : [];

                    products = raw.map(p => ({
                        supplier_sku: p.StockCode ? String(p.StockCode) : 'UNKNOWN',
                        supplier_name: supplier.name,
                        name: String(p.ProdName || ''),
                        description: String(p.ProdDesc || ''),
                        brand: String(p.Brand || 'Pinnacle'),
                        price_ex_vat: parseFloat(p.ProdPriceExclVAT || 0),
                        qty_on_hand: parseInt(p.ProdQty || 0),
                        image_url: String(p.ProdImg || ''),
                        category: normalizeCategory(p.TopCat || p.category_tree, 'pinnacle'),
                        master_sku: `${supplier.id}-${p.StockCode}`,
                        raw_data: JSON.stringify(p)
                    }));
                }
            }

            // Deduplicate
            const seen = new Set();
            products = products.filter(p => {
                if (seen.has(p.supplier_sku)) return false;
                seen.add(p.supplier_sku);
                return true;
            });

            console.log(`Success: Found ${products.length} products for ${supplier.name}.`);

            if (products.length > 0) {
                if (client) {
                    const chunkSize = 300;
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
                    console.log(`Synced to DB.`);
                } else {
                    saveToLocalFile(products);
                }
            }
        } catch (err) {
            console.error(`Ingest failed for ${supplier.name}: ${err.message}`);
        }
    }
}

module.exports = { ingestData };
