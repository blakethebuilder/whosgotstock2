import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Retrieve marketing snapshot token from env or default for dev testing
const HERMES_API_TOKEN = process.env.HERMES_API_TOKEN || 'hermes_sec_auth_token_2026';

export async function GET(request: NextRequest) {
  // 1. Bearer Token Authentication check
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized. Bearer token missing.' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  if (token !== HERMES_API_TOKEN) {
    return NextResponse.json(
      { error: 'Forbidden. Invalid API token.' },
      { status: 403 }
    );
  }

  let client;
  try {
    client = await pool.connect();

    // Verify/create tables if they don't exist (for seamless deployment/local testing)
    await ensureMarketingTables(client);

    // Run high-performance queries using parallel database calls
    const [arbitrageRes, velocityRes, resurrectionRes] = await Promise.all([
      runPriceArbitrageQuery(client),
      runSupplyChainVelocityQuery(client),
      runResurrectionAlertQuery(client),
    ]);

    // Construct highly dense, key-optimized response structure
    return NextResponse.json({
      price_arb: arbitrageRes,
      sc_velocity: velocityRes,
      resurrect: resurrectionRes,
      ts: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Marketing Snapshot API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

// A. Price Arbitrage Query (Top 12 variance anomalies)
async function runPriceArbitrageQuery(client: any) {
  const query = `
    SELECT 
      p.sku,
      p.product_name AS name,
      MIN(sf.dealer_cost) AS min_p,
      MAX(sf.dealer_cost) AS max_p,
      ROUND(((MAX(sf.dealer_cost) - MIN(sf.dealer_cost)) / NULLIF(MIN(sf.dealer_cost), 0)) * 100, 2) AS v_pct,
      (SELECT supplier_name FROM supplier_feeds WHERE product_id = p.id ORDER BY dealer_cost ASC LIMIT 1) AS low_s,
      (SELECT supplier_name FROM supplier_feeds WHERE product_id = p.id ORDER BY dealer_cost DESC LIMIT 1) AS high_s
    FROM products p
    JOIN supplier_feeds sf ON p.id = sf.product_id
    WHERE sf.stock_count > 0
    GROUP BY p.id, p.sku, p.product_name
    HAVING COUNT(DISTINCT sf.supplier_name) >= 2
    ORDER BY v_pct DESC
    LIMIT 12;
  `;
  const res = await client.query(query);
  return res.rows;
}

// B. Supply Chain Velocity Query (Top 12 stock drops over 7 trailing days)
async function runSupplyChainVelocityQuery(client: any) {
  const query = `
    WITH latest_snapshot AS (
      SELECT DISTINCT ON (sku) sku, category, total_channel_stock, captured_at
      FROM channel_snapshots
      WHERE captured_at >= NOW() - INTERVAL '1 day'
      ORDER BY sku, captured_at DESC
    ),
    historical_snapshot AS (
      SELECT DISTINCT ON (sku) sku, total_channel_stock, captured_at
      FROM channel_snapshots
      WHERE captured_at BETWEEN NOW() - INTERVAL '8 days' AND NOW() - INTERVAL '6 days'
      ORDER BY sku, captured_at DESC
    )
    SELECT 
      l.sku,
      COALESCE(p.product_name, l.sku) AS name,
      l.category AS cat,
      (h.total_channel_stock - l.total_channel_stock) AS qty_sold,
      l.total_channel_stock AS cur_stk
    FROM latest_snapshot l
    JOIN historical_snapshot h ON l.sku = h.sku
    LEFT JOIN products p ON l.sku = p.sku
    WHERE l.category IN ('Power', 'Networking', 'Storage', 'Wireless')
      AND h.total_channel_stock > l.total_channel_stock
    ORDER BY qty_sold DESC
    LIMIT 12;
  `;
  const res = await client.query(query);
  return res.rows;
}

// C. Resurrection Alert Query (Top 5 sudden stock injections after dry spell)
async function runResurrectionAlertQuery(client: any) {
  const query = `
    WITH stock_history AS (
      SELECT 
        sku,
        MAX(total_channel_stock) AS max_stock_in_dry_period
      FROM channel_snapshots
      WHERE captured_at BETWEEN NOW() - INTERVAL '16 days' AND NOW() - INTERVAL '2 days'
      GROUP BY sku
    ),
    current_stock AS (
      SELECT DISTINCT ON (sku) sku, total_channel_stock, captured_at
      FROM channel_snapshots
      WHERE captured_at >= NOW() - INTERVAL '1 day'
      ORDER BY sku, captured_at DESC
    )
    SELECT 
      c.sku,
      COALESCE(p.product_name, c.sku) AS name,
      c.total_channel_stock AS cur_stk
    FROM current_stock c
    JOIN stock_history h ON c.sku = h.sku
    LEFT JOIN products p ON c.sku = p.sku
    WHERE h.max_stock_in_dry_period = 0
      AND c.total_channel_stock > 15
    ORDER BY c.total_channel_stock DESC
    LIMIT 5;
  `;
  const res = await client.query(query);
  return res.rows;
}

// Helper to construct marketing schema if missing
async function ensureMarketingTables(client: any) {
  // Check if products table exists first
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'supplier_feeds'
    );
  `);
  
  if (!tableCheck.rows[0].exists) {
    console.log('Marketing schema tables missing. Initializing tables...');
    
    // Ensure parent products has SKU column
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(255) UNIQUE NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure index on sku
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_feeds (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        supplier_name VARCHAR(255) NOT NULL,
        dealer_cost DECIMAL(10, 2) NOT NULL,
        stock_count INTEGER DEFAULT 0,
        warehouse_location VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_snapshots (
        id SERIAL PRIMARY KEY,
        captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sku VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        min_dealer_cost DECIMAL(10, 2),
        max_dealer_cost DECIMAL(10, 2),
        total_channel_stock INTEGER,
        supplier_count INTEGER
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_snapshots_sku ON channel_snapshots(sku);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_snapshots_captured ON channel_snapshots(captured_at);`);
    
    console.log('Marketing Schema initialized.');
  }
}
