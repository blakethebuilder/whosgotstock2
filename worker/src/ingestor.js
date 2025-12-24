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
    console.log('Loading suppliers configuration...');
    const suppliersPath = path.join(__dirname, '../suppliers.json');
    const suppliers = JSON.parse(fs.readFileSync(suppliersPath, 'utf8'));

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
                    supplier_sku: p.sku,
                    supplier_name: supplier.name,
                    name: p.description,
                    brand: p.manufacturer,
                    price_ex_vat: parseFloat(p.dealer_price || 0),
                    qty_on_hand: parseInt(p.total_stock || 0),
                    master_sku: `${supplier.id}-${p.sku}`,
                    raw_data: JSON.stringify(p)
                }));
            }
            // ... (keep other adapter logic if needed)

            console.log(`Found ${products.length} products for ${supplier.name}.`);

            // Try Postgres
            try {
                if (client) {
                    for (const p of products) {
                        const query = `
                            INSERT INTO products (
                                supplier_sku, supplier_name, name, brand, price_ex_vat, qty_on_hand, raw_data, master_sku
                            ) VALUES (
                                $1, $2, $3, $4, $5, $6, $7, $8
                            )
                            ON CONFLICT (supplier_name, supplier_sku) 
                            DO UPDATE SET
                                name = EXCLUDED.name,
                                brand = EXCLUDED.brand,
                                price_ex_vat = EXCLUDED.price_ex_vat,
                                qty_on_hand = EXCLUDED.qty_on_hand,
                                last_updated = CURRENT_TIMESTAMP,
                                raw_data = EXCLUDED.raw_data
                        `;
                        const values = [
                            p.supplier_sku, p.supplier_name, p.name, p.brand,
                            p.price_ex_vat, p.qty_on_hand, p.raw_data, p.master_sku
                        ];
                        await client.query(query, values);
                    }
                    console.log(`Synced to Postgres.`);
                } else {
                    throw new Error("No DB Client");
                }
            } catch (dbErr) {
                console.log("Database write failed (or no client), falling back to local file.");
                saveToLocalFile(products);
            }

        } catch (err) {
            console.error(`Failed to ingest ${supplier.name}: ${err.message}`);
        }
    }
}

module.exports = { ingestData };
