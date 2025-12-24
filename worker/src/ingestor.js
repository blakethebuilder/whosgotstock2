const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');

async function fetchXmlFeed(url) {
    if (!url.startsWith('http')) {
        // Mock data fallback
        return ``;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    return await res.text();
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

    const parser = new XMLParser();

    for (const supplier of suppliers) {
        if (!supplier.enabled) continue;

        console.log(`Starting ingest for ${supplier.name}...`);

        try {
            const xmlData = await fetchXmlFeed(supplier.url);
            const parsed = parser.parse(xmlData);

            let products = [];

            // Normalize data based on supplier structure (Schema Mapping)
            if (supplier.id === 'scoop') {
                // Scoop format: <products><product><sku>...</sku>...</product>...</products>
                const raw = Array.isArray(parsed.products.product)
                    ? parsed.products.product
                    : [parsed.products.product];

                products = raw.map(p => ({
                    supplier_sku: p.code ? String(p.code) : 'UNKNOWN',
                    supplier_name: supplier.name,
                    name: p.description, // Scoop uses 'description'
                    brand: p.brand,
                    price_ex_vat: parseFloat(p.price || 0),
                    qty_on_hand: parseInt(p.stock || 0),
                    image_url: p.image, // Scoop uses 'image'
                    category: p.category, // Scoop uses 'category'
                    master_sku: `${supplier.id}-${p.code}`,
                    raw_data: JSON.stringify(p)
                }));
            } else if (supplier.id === 'esquire') {
                // Esquire format
                let raw = [];
                if (parsed.ROOT?.products?.product) {
                    raw = parsed.ROOT.products.product;
                } else if (parsed.products?.product) {
                    raw = parsed.products.product;
                }

                if (!Array.isArray(raw)) raw = [raw];

                products = raw.map(p => ({
                    supplier_sku: p.ProductCode ? String(p.ProductCode) : 'UNKNOWN',
                    supplier_name: supplier.name,
                    name: p.ProductName,
                    brand: 'Esquire', // No specific brand field easily found, or use mapping later
                    price_ex_vat: parseFloat(p.Price || 0),
                    qty_on_hand: parseInt(p.AvailableQty) || (p.AvailableQty === 'Yes' ? 100 : 0),
                    image_url: p.image,
                    category: p.Category, // Esquire uses 'Category'
                    master_sku: `${supplier.id}-${p.ProductCode}`,
                    raw_data: JSON.stringify(p)
                }));
            } else if (supplier.id === 'syntech') {
                // Syntech format: <syntechstock><stock><product>...</product></stock></syntechstock>
                // fast-xml-parser usually handles this. Structure seen in curl:
                // parsed.syntechstock.stock.product

                let raw = [];
                if (parsed.syntechstock?.stock?.product) {
                    raw = parsed.syntechstock.stock.product;
                } else if (parsed.stock?.product) {
                    raw = parsed.stock.product;
                }

                if (!Array.isArray(raw)) raw = [raw];

                products = raw.map(p => {
                    // Stock is split into regions
                    const stock = (parseInt(p.cptstock) || 0) + (parseInt(p.jhbstock) || 0) + (parseInt(p.dbnstock) || 0);
                    // Categories are comma separated, take the first one or the whole string
                    const catRaw = p.categories || p.category || '';
                    const mainCat = catRaw.split(',')[0].trim();

                    return {
                        supplier_sku: p.sku ? String(p.sku) : 'UNKNOWN',
                        supplier_name: supplier.name,
                        name: p.name,
                        brand: p.attributes?.brand || 'Syntech',
                        price_ex_vat: parseFloat(p.price || 0),
                        qty_on_hand: stock,
                        image_url: p.featured_image,
                        category: mainCat,
                        master_sku: `${supplier.id}-${p.sku}`,
                        raw_data: JSON.stringify(p)
                    };
                });
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
