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
            const feedData = await fetchFeed(supplier.url, supplier);

            // Determine driver (slug or type override)
            const driverKey = (['xml', 'json'].includes(supplier.type?.toLowerCase())) ? supplier.id : supplier.type;
            const driverPath = path.join(__dirname, 'drivers', `${driverKey}.js`);

            if (!fs.existsSync(driverPath)) {
                console.error(`Driver missing: ${driverKey} at ${driverPath}`);
                continue;
            }

            const driver = require(driverPath);
            const products = await driver(supplier, feedData, driverHelpers);

            if (products && products.length > 0) {
                const chunkSize = 300;
                for (let i = 0; i < products.length; i += chunkSize) {
                    const chunk = products.slice(i, i + chunkSize);
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
                console.log(`Success: Ingested ${products.length} products for ${supplier.name}.`);
            }
        } catch (err) {
            console.error(`Driver Error for ${supplier.name}:`, err.message);
        }
    }
}

module.exports = { ingestData };
