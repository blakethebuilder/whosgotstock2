require('dotenv').config();
const fs = require('fs');
const path = require('path');

// --- Drivers Helper Functions ---
function normalizeCategory(rawCategory, supplierId) {
    if (!rawCategory) return 'Miscellaneous';
    const normalized = rawCategory.toLowerCase().trim();
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
    return rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();
}

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
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else current += char;
        }
        values.push(current.trim());
        const obj = {};
        headers.forEach((header, idx) => { obj[header] = values[idx] || ''; });
        results.push(obj);
    }
    return results;
}

const driverHelpers = { normalizeCategory, parseCSV };

// --- Core Logic ---
async function fetchFeed(url, supplier) {
    if (!url.startsWith('http')) return '';

    const headers = { 'User-Agent': 'Mozilla/5.0' };

    // Add authentication for JSON APIs
    if (supplier.type === 'json') {
        if (supplier.id === 'evenflow' && process.env.EVENFLOW_API_KEY) {
            headers['Authorization'] = `Bearer ${process.env.EVENFLOW_API_KEY}`;
            headers['X-API-Key'] = process.env.EVENFLOW_API_KEY;
        }
        // Add other JSON API authentication here as needed
    }

    const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(60000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
}

async function ingestData(client) {
    let suppliers = [];
    if (client) {
        try {
            const res = await client.query("SELECT * FROM suppliers WHERE enabled = true");
            suppliers = res.rows.map(r => ({ id: r.slug, name: r.name, url: r.url, type: r.type, enabled: r.enabled }));
        } catch (err) {
            console.error('DB Supplier Load Failed:', err);
        }
    }

    for (const supplier of suppliers) {
        console.log(`\n>>> Ingesting ${supplier.name} via Driver Plugin...`);
        try {
            // Determine driver: Prioritize specific supplier driver, fallback to generic type driver
            let driverKey = supplier.id;
            let driverPath = path.join(__dirname, 'drivers', `${driverKey}.js`);

            if (!fs.existsSync(driverPath)) {
                driverKey = supplier.type?.toLowerCase();
                driverPath = path.join(__dirname, 'drivers', `${driverKey}.js`);
            }

            if (!fs.existsSync(driverPath)) {
                console.error(`Driver missing: ${driverKey} at ${driverPath}`);
                continue;
            }

            const driver = require(driverPath);

            // For JSON APIs (like Evenflow), let the driver handle HTTP requests itself
            // For traditional APIs, fetch the data first
            let products;
            if (supplier.type === 'json') {
                products = await driver(supplier, null, driverHelpers);
            } else {
                const feedData = await fetchFeed(supplier.url, supplier);
                products = await driver(supplier, feedData, driverHelpers);
            }

            if (products && products.length > 0) {
                // Deduplication and Normalization Step
                const uniqueProducts = new Map();
                products.forEach(p => {
                    if (!p || !p.supplier_sku) return;

                    // Normalize SKU for robust matching
                    const normalizedSku = String(p.supplier_sku).trim().toUpperCase();
                    p.supplier_sku = normalizedSku;

                    // Ensure master_sku is also normalized
                    if (p.master_sku) {
                        p.master_sku = String(p.master_sku).trim().toUpperCase();
                    }

                    // Keep the first one found
                    if (!uniqueProducts.has(normalizedSku)) {
                        uniqueProducts.set(normalizedSku, p);
                    }
                });

                const finalProducts = Array.from(uniqueProducts.values());
                const duplicateCount = products.length - finalProducts.length;
                if (duplicateCount > 0) {
                    console.log(`Deduplication: Removed ${duplicateCount} duplicate SKUs from ${supplier.name} feed.`);
                }

                const chunkSize = 300;
                for (let i = 0; i < finalProducts.length; i += chunkSize) {
                    const chunk = finalProducts.slice(i, i + chunkSize);
                    const values = [];
                    const valueParams = [];
                    let paramIdx = 1;

                    chunk.forEach(p => {
                        valueParams.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8}, $${paramIdx + 9}, $${paramIdx + 10}, $${paramIdx + 11}, $${paramIdx + 12}, CURRENT_TIMESTAMP)`);
                        values.push(p.master_sku, p.supplier_sku, p.supplier_name, p.name, p.description, p.brand, p.price_ex_vat, p.qty_on_hand, p.raw_data, p.image_url, p.category, p.stock_jhb || 0, p.stock_cpt || 0);
                        paramIdx += 13;
                    });

                    const query = `
                        INSERT INTO products (master_sku, supplier_sku, supplier_name, name, description, brand, price_ex_vat, qty_on_hand, raw_data, image_url, category, stock_jhb, stock_cpt, last_updated)
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
                            last_updated = CURRENT_TIMESTAMP;
                    `;
                    await client.query(query, values);
                }
                console.log(`Success: Ingested ${finalProducts.length} products for ${supplier.name}.`);
            } else {
                console.log(`Warning: 0 products found for ${supplier.name}. Check driver or feed status.`);
            }
        } catch (err) {
            console.error(`Driver Error for ${supplier.name}:`, err.message);
        }
    }
}

module.exports = { ingestData };
