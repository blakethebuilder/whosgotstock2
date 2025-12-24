const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');

async function fetchXmlFeed(url) {
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
        } catch (e) {
            console.error("Failed to read suppliers from DB:", e);
        }
    } else {
        console.log('Loading suppliers from local JSON (No DB)...');
        const suppliersPath = path.join(__dirname, '../suppliers.json');
        if (fs.existsSync(suppliersPath)) {
            suppliers = JSON.parse(fs.readFileSync(suppliersPath, 'utf8'));
        }
    }

    for (const supplier of suppliers) {
        if (!supplier.enabled) continue;

        console.log(`Starting ingest for ${supplier.name} (Type: ${supplier.type})...`);

        try {
            const xmlData = await fetchXmlFeed(supplier.url);
            const parser = new XMLParser();
            const parsed = parser.parse(xmlData);

            let products = [];
            let activeType = (supplier.type && supplier.type !== 'xml' && supplier.type !== 'json')
                ? supplier.type.toLowerCase()
                : supplier.id.toLowerCase();

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

                products = raw.map(p => ({
                    supplier_sku: p.ProductCode ? String(p.ProductCode) : 'UNKNOWN',
                    supplier_name: supplier.name,
                    name: p.ProductName,
                    brand: 'Esquire',
                    price_ex_vat: parseFloat(p.Price || 0),
                    qty_on_hand: parseInt(p.AvailableQty) || (p.AvailableQty === 'Yes' ? 100 : 0),
                    image_url: p.image,
                    category: p.Category,
                    master_sku: `${supplier.id}-${p.ProductCode}`,
                    raw_data: JSON.stringify(p)
                }));
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
                    brand: p.Brand || 'Pinnacle',
                    price_ex_vat: parseFloat(p.ProdPriceExclVAT || 0),
                    qty_on_hand: parseInt(p.ProdQty || 0),
                    image_url: p.ProdImg,
                    category: p.TopCat || p.category_tree || 'IT',
                    master_sku: `${supplier.id}-${p.StockCode || Math.random()}`,
                    raw_data: JSON.stringify(p)
                }));
            }

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
                                valueParams.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8}, $${paramIdx + 9}, CURRENT_TIMESTAMP)`);
                                values.push(p.master_sku, p.supplier_sku, p.supplier_name, p.name, p.brand, p.price_ex_vat, p.qty_on_hand, p.raw_data, p.image_url, p.category);
                                paramIdx += 10;
                            });

                            const query = `
                                INSERT INTO products (master_sku, supplier_sku, supplier_name, name, brand, price_ex_vat, qty_on_hand, raw_data, image_url, category, last_updated)
                                VALUES ${valueParams.join(',')}
                                ON CONFLICT (supplier_name, supplier_sku) 
                                DO UPDATE SET 
                                    name = EXCLUDED.name,
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
