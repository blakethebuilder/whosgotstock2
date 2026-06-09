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

    // Ensure only channel_snapshots table exists (products table already exists with correct schema)
    await ensureChannelSnapshotsTable(client);

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

// ---------------------------------------------------------------------------
// A. Price Arbitrage Query
// Uses the real products table: master_sku/supplier_sku groups across supplier_name rows.
// Finds SKUs stocked by ≥2 different suppliers and ranks by dealer cost variance %.
// ---------------------------------------------------------------------------
async function runPriceArbitrageQuery(client: any) {
  const query = `
    WITH grouped AS (
      SELECT
        COALESCE(NULLIF(master_sku, ''), supplier_sku)          AS sku,
        MAX(name)                                                AS name,
        MIN(price_ex_vat)                                        AS min_p,
        MAX(price_ex_vat)                                        AS max_p,
        COUNT(DISTINCT supplier_name)                            AS sup_count
      FROM products
      WHERE qty_on_hand > 0
        AND price_ex_vat IS NOT NULL
        AND price_ex_vat > 0
      GROUP BY COALESCE(NULLIF(master_sku, ''), supplier_sku)
      HAVING COUNT(DISTINCT supplier_name) >= 2
    )
    SELECT
      g.sku,
      g.name,
      g.min_p,
      g.max_p,
      ROUND(((g.max_p - g.min_p) / NULLIF(g.min_p, 0)) * 100, 2) AS v_pct,
      (
        SELECT supplier_name FROM products
        WHERE COALESCE(NULLIF(master_sku, ''), supplier_sku) = g.sku
          AND qty_on_hand > 0
        ORDER BY price_ex_vat ASC LIMIT 1
      ) AS low_s,
      (
        SELECT supplier_name FROM products
        WHERE COALESCE(NULLIF(master_sku, ''), supplier_sku) = g.sku
          AND qty_on_hand > 0
        ORDER BY price_ex_vat DESC LIMIT 1
      ) AS high_s
    FROM grouped g
    ORDER BY v_pct DESC
    LIMIT 12;
  `;
  const res = await client.query(query);
  return res.rows;
}

// ---------------------------------------------------------------------------
// B. Supply Chain Velocity Query
// Compares today's channel_snapshot vs 7-days-ago snapshot.
// Returns top 12 SKUs with the biggest implied stock drops (Power/Networking/Storage/Wireless).
// ---------------------------------------------------------------------------
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
      COALESCE(
        (SELECT name FROM products WHERE COALESCE(NULLIF(master_sku, ''), supplier_sku) = l.sku LIMIT 1),
        l.sku
      ) AS name,
      l.category AS cat,
      (h.total_channel_stock - l.total_channel_stock) AS qty_sold,
      l.total_channel_stock AS cur_stk
    FROM latest_snapshot l
    JOIN historical_snapshot h ON l.sku = h.sku
    WHERE l.category IN ('Power', 'Networking', 'Storage', 'Wireless',
                         'Power Solutions', 'Networking & Connectivity')
      AND h.total_channel_stock > l.total_channel_stock
    ORDER BY qty_sold DESC
    LIMIT 12;
  `;
  const res = await client.query(query);
  return res.rows;
}

// ---------------------------------------------------------------------------
// C. Resurrection Alert Query
// Items that had zero stock across all distributors for 14+ consecutive days
// but have landed fresh stock (>15 units) in the last 48 hours.
// ---------------------------------------------------------------------------
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
      COALESCE(
        (SELECT name FROM products WHERE COALESCE(NULLIF(master_sku, ''), supplier_sku) = c.sku LIMIT 1),
        c.sku
      ) AS name,
      c.total_channel_stock AS cur_stk
    FROM current_stock c
    JOIN stock_history h ON c.sku = h.sku
    WHERE h.max_stock_in_dry_period = 0
      AND c.total_channel_stock > 15
    ORDER BY c.total_channel_stock DESC
    LIMIT 5;
  `;
  const res = await client.query(query);
  return res.rows;
}

// ---------------------------------------------------------------------------
// Ensure only channel_snapshots exists — products table already exists.
// Does NOT attempt to recreate or alter the products table.
// ---------------------------------------------------------------------------
async function ensureChannelSnapshotsTable(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS channel_snapshots (
      id            SERIAL PRIMARY KEY,
      captured_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sku           VARCHAR(255) NOT NULL,
      category      VARCHAR(255),
      min_dealer_cost  DECIMAL(10, 2),
      max_dealer_cost  DECIMAL(10, 2),
      total_channel_stock INTEGER,
      supplier_count      INTEGER
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_snapshots_sku
    ON channel_snapshots(sku);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_snapshots_captured
    ON channel_snapshots(captured_at);
  `);
}
