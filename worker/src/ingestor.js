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
            return;
        }
    }

    console.log(`Starting parallel feed fetching and parsing for ${suppliers.length} suppliers...`);

    // Define a task for fetching and parsing a single supplier
    const fetchTasks = suppliers.map(async (supplier) => {
        const startedAt = new Date();
        let logId = null;

        // Rate limit: Skip if the supplier was fetched too recently
        if (client) {
            try {
                const lastRunRes = await client.query(
                    `SELECT started_at, status FROM supplier_fetch_log 
                     WHERE supplier_slug = $1 
                     ORDER BY started_at DESC LIMIT 1`,
                    [supplier.id]
                );
                if (lastRunRes.rows.length > 0) {
                    const lastRun = new Date(lastRunRes.rows[0].started_at);
                    const lastStatus = lastRunRes.rows[0].status;
                    const diffMs = startedAt - lastRun;
                    const diffMins = diffMs / (1000 * 60);
                    
                    // Enforce a minimum interval to prevent rate limit blocks:
                    // 15 mins default for successful fetches, 5 mins default for errors/other statuses
                    const minInterval = lastStatus === 'success'
                        ? (parseInt(process.env.MIN_FETCH_INTERVAL_MINUTES) || 15)
                        : (parseInt(process.env.MIN_RETRY_INTERVAL_MINUTES) || 5);

                    if (diffMins < minInterval) {
                        console.log(`[Rate Limit] Skipping ${supplier.name}: Last fetch (${lastStatus}) was ${diffMins.toFixed(1)} minutes ago (min interval: ${minInterval} mins).`);
                        return {
                            supplier,
                            products: null,
                            startedAt,
                            logId: null,
                            error: null,
                            skipped: true
                        };
                    }
                }
            } catch (checkErr) {
                if (!checkErr.message.includes('does not exist')) {
                    console.warn(`Rate limit check warning for ${supplier.name}: ${checkErr.message}`);
                }
            }
        }

        // Insert a fetch log entry (if table exists)
        try {
            const logRes = await client.query(
                `INSERT INTO supplier_fetch_log (supplier_slug, supplier_name, started_at, status)
                 VALUES ($1, $2, $3, 'running') RETURNING id`,
                [supplier.id, supplier.name, startedAt]
            );
            logId = logRes.rows[0].id;
        } catch (logErr) {
            // Table may not exist yet on first deploy — skip logging silently
            if (!logErr.message.includes('does not exist')) {
                console.warn(`Fetch log insert warning: ${logErr.message}`);
            }
        }

        try {
            // Determine driver: Prioritize specific supplier driver, fallback to generic type driver
            let driverKey = supplier.id;
            let driverPath = path.join(__dirname, 'drivers', `${driverKey}.js`);

            if (!fs.existsSync(driverPath)) {
                driverKey = supplier.type?.toLowerCase();
                driverPath = path.join(__dirname, 'drivers', `${driverKey}.js`);
            }

            if (!fs.existsSync(driverPath)) {
                throw new Error(`Driver missing: ${driverKey}`);
            }

            const driver = require(driverPath);

            console.log(`[Fetch] Starting: ${supplier.name}`);
            let products;
            if (supplier.type === 'json') {
                products = await driver(supplier, null, driverHelpers);
            } else {
                const feedData = await fetchFeed(supplier.url, supplier);
                products = await driver(supplier, feedData, driverHelpers);
            }

            console.log(`[Fetch] Completed: ${supplier.name} (${products ? products.length : 0} items fetched)`);
            return {
                supplier,
                products,
                startedAt,
                logId,
                error: null
            };
        } catch (err) {
            console.error(`[Fetch] Failed: ${supplier.name} - Error: ${err.message}`);
            return {
                supplier,
                products: null,
                startedAt,
                logId,
                error: err
            };
        }
    });

    // Process all fetches in parallel
    const results = await Promise.all(fetchTasks);

    // Now write to the database sequentially to prevent connection pool clogging and lock conflicts
    for (const result of results) {
        const { supplier, products, startedAt, logId, error, skipped } = result;

        if (skipped) {
            continue;
        }

        if (error) {
            // Update fetch log with error
            if (logId) {
                await client.query(
                    `UPDATE supplier_fetch_log SET status = 'error', finished_at = NOW(),
                     error_message = $1, duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at)) WHERE id = $2`,
                    [error.message, logId]
                ).catch(() => {});
            }
            continue;
        }

        const productsFetched = products ? products.length : 0;

        try {
            if (products && products.length > 0) {
                console.log(`\n>>> Writing products to DB for ${supplier.name}...`);

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

                // Stale Cleanup: Delete discontinued products for this supplier
                // Any product belonging to this supplier whose last_updated is older than startedAt (minus a margin of 2 seconds)
                const deleteMarginTime = new Date(startedAt.getTime() - 2000);
                const deleteRes = await client.query(
                    `DELETE FROM products WHERE supplier_name = $1 AND last_updated < $2`,
                    [supplier.name, deleteMarginTime]
                );
                if (deleteRes.rowCount > 0) {
                    console.log(`Stale Cleanup: Deleted ${deleteRes.rowCount} discontinued products for ${supplier.name}.`);
                }

                console.log(`Success: Ingested ${finalProducts.length} products for ${supplier.name}.`);

                // Update fetch log with success
                if (logId) {
                    await client.query(
                        `UPDATE supplier_fetch_log SET status = 'success', finished_at = NOW(),
                         products_fetched = $1, products_ingested = $2,
                         duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at)) WHERE id = $3`,
                        [productsFetched, finalProducts.length, logId]
                    ).catch(() => {});
                }
            } else {
                console.log(`Warning: 0 products found for ${supplier.name}. Check driver or feed status.`);

                // Update fetch log with zero results
                if (logId) {
                    await client.query(
                        `UPDATE supplier_fetch_log SET status = 'success', finished_at = NOW(),
                         products_fetched = 0, products_ingested = 0,
                         duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at)) WHERE id = $1`,
                        [logId]
                    ).catch(() => {});
                }
            }
        } catch (err) {
            console.error(`Driver Error for ${supplier.name}:`, err.message);

            // Update fetch log with error
            if (logId) {
                await client.query(
                    `UPDATE supplier_fetch_log SET status = 'error', finished_at = NOW(),
                     error_message = $1, duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at)) WHERE id = $2`,
                    [err.message, logId]
                ).catch(() => {});
            }
        }
    }

    // Write a daily channel snapshot (once per UTC day, idempotent)
    await writeChannelSnapshot(client);
}

// ---------------------------------------------------------------------------
// Channel Snapshot Writer
// Aggregates the live products table into channel_snapshots once per UTC day.
// Idempotent: skips if a snapshot row already exists for today's date.
// ---------------------------------------------------------------------------
async function writeChannelSnapshot(client) {
    if (!client) return;

    try {
        // Check if we've already written a snapshot today (UTC date)
        const todayCheck = await client.query(`
            SELECT 1 FROM channel_snapshots
            WHERE captured_at >= CURRENT_DATE
              AND captured_at <  CURRENT_DATE + INTERVAL '1 day'
            LIMIT 1;
        `);

        if (todayCheck.rows.length > 0) {
            console.log('[Snapshot] Daily channel snapshot already written for today. Skipping.');
            return;
        }

        console.log('[Snapshot] Writing daily channel_snapshots aggregation...');

        // Aggregate live products table: one row per unique SKU (master_sku, falling back to supplier_sku)
        // Groups across all suppliers so total_channel_stock = sum of all distributor qty for that SKU
        const result = await client.query(`
            INSERT INTO channel_snapshots
                (captured_at, sku, category, min_dealer_cost, max_dealer_cost, total_channel_stock, supplier_count)
            SELECT
                NOW()                                          AS captured_at,
                COALESCE(NULLIF(master_sku, ''), supplier_sku) AS sku,
                MAX(category)                                  AS category,
                MIN(price_ex_vat)                              AS min_dealer_cost,
                MAX(price_ex_vat)                              AS max_dealer_cost,
                SUM(qty_on_hand)                               AS total_channel_stock,
                COUNT(DISTINCT supplier_name)                  AS supplier_count
            FROM products
            WHERE price_ex_vat IS NOT NULL
              AND price_ex_vat > 0
            GROUP BY COALESCE(NULLIF(master_sku, ''), supplier_sku)
            HAVING SUM(qty_on_hand) >= 0;  -- include zero-stock rows so resurrections can be detected
        `);

        console.log(`[Snapshot] Done. Wrote ${result.rowCount} SKU snapshot rows for ${new Date().toISOString().split('T')[0]}.`);

    } catch (err) {
        // Non-fatal: analytics will still work on existing data; log and continue.
        console.error('[Snapshot] Failed to write channel snapshot:', err.message);
    }
}

// ---------------------------------------------------------------------------
// Test connection function for Docker health checks
// ---------------------------------------------------------------------------
async function testConnection() {
  const { Client } = require('pg');
  
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    
    console.log('Worker health check: Database connection successful');
    process.exit(0);
  } catch (error) {
    console.error('Worker health check failed:', error.message);
    process.exit(1);
  }
}

module.exports = { ingestData, writeChannelSnapshot, testConnection };
