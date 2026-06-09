import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * POST /api/v1/marketing-snapshot/test
 *
 * Seeds mock data into the REAL products table (using the actual schema)
 * and channel_snapshots to simulate all three analytics scenarios:
 *
 *  A. Price Arbitrage  — same SKU listed by 2+ suppliers at different costs
 *  B. Supply Velocity  — stock drops in Power/Networking/Storage/Wireless
 *  C. Resurrection     — item returns from 14+ day zero-stock to live stock
 *
 * Uses INSERT ... ON CONFLICT DO UPDATE so it is safe to run multiple times.
 */
export async function POST(_request: NextRequest) {
  let client;
  try {
    client = await pool.connect();

    // Ensure channel_snapshots table exists before seeding
    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_snapshots (
        id                  SERIAL PRIMARY KEY,
        captured_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sku                 VARCHAR(255) NOT NULL,
        category            VARCHAR(255),
        min_dealer_cost     DECIMAL(10, 2),
        max_dealer_cost     DECIMAL(10, 2),
        total_channel_stock INTEGER,
        supplier_count      INTEGER
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_snapshots_sku ON channel_snapshots(sku);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_snapshots_captured ON channel_snapshots(captured_at);`);

    // -----------------------------------------------------------------------
    // Scenario A: Price Arbitrage
    // Insert same master_sku listed by two suppliers at different prices.
    // Uses ON CONFLICT (supplier_name, supplier_sku) DO UPDATE to be idempotent.
    // -----------------------------------------------------------------------
    const arbProducts = [
      // Ubiquiti Switch — ~23.6% variance between Linkqage and Pinnacle
      {
        master_sku: 'USW-24-POE', supplier_sku: 'USW-24-POE',
        supplier_name: '__TEST_Linkqage', name: 'UniFi 24-Port Gigabit PoE Switch',
        category: 'Networking', price_ex_vat: 7200, qty_on_hand: 15,
      },
      {
        master_sku: 'USW-24-POE', supplier_sku: 'USW-24-POE',
        supplier_name: '__TEST_Pinnacle', name: 'USW-24-POE UniFi 24 Port PoE Switch',
        category: 'Networking', price_ex_vat: 8900, qty_on_hand: 8,
      },
      // Sunsynk 5kW Inverter — ~34.6% variance between Rectron and Mustek
      {
        master_sku: 'SYN-INV-5K', supplier_sku: 'SYN-INV-5K',
        supplier_name: '__TEST_Rectron', name: 'Sunsynk 5kW Hybrid Inverter',
        category: 'Power Solutions', price_ex_vat: 18500, qty_on_hand: 20,
      },
      {
        master_sku: 'SYN-INV-5K', supplier_sku: 'SYN-INV-5K',
        supplier_name: '__TEST_Mustek', name: 'Sunsynk 5kW Hybrid Inverter 48V',
        category: 'Power Solutions', price_ex_vat: 24900, qty_on_hand: 10,
      },
    ];

    for (const p of arbProducts) {
      await client.query(`
        INSERT INTO products
          (master_sku, supplier_sku, supplier_name, name, description, brand,
           price_ex_vat, qty_on_hand, category, stock_jhb, stock_cpt, last_updated)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
        ON CONFLICT (supplier_name, supplier_sku)
        DO UPDATE SET
          master_sku    = EXCLUDED.master_sku,
          name          = EXCLUDED.name,
          price_ex_vat  = EXCLUDED.price_ex_vat,
          qty_on_hand   = EXCLUDED.qty_on_hand,
          category      = EXCLUDED.category,
          last_updated  = NOW();
      `, [
        p.master_sku, p.supplier_sku, p.supplier_name, p.name,
        'Test seed product', 'TEST', p.price_ex_vat, p.qty_on_hand,
        p.category, Math.floor(p.qty_on_hand / 2), Math.ceil(p.qty_on_hand / 2)
      ]);
    }

    // -----------------------------------------------------------------------
    // Scenario B & C: channel_snapshots historical data
    // Clear old test snapshots first, then seed fresh ones.
    // -----------------------------------------------------------------------
    await client.query(`
      DELETE FROM channel_snapshots
      WHERE sku IN ('SYN-INV-5K', 'MUB-LTE-01', 'AMD-5700X')
        AND captured_at >= NOW() - INTERVAL '20 days';
    `);

    const now = new Date();

    // Scenario B — Supply Chain Velocity
    // Sunsynk Inverter: dropped from 150 → 12 (implied 138 units sold in 7 days)
    await client.query(`
      INSERT INTO channel_snapshots
        (captured_at, sku, category, min_dealer_cost, max_dealer_cost, total_channel_stock, supplier_count)
      VALUES
        ($1, 'SYN-INV-5K', 'Power Solutions', 18500, 24900, 150, 2),
        ($2, 'SYN-INV-5K', 'Power Solutions', 18500, 24900, 12,  2)
    `, [
      new Date(now.getTime() - 7 * 86400000),
      now
    ]);

    // MikroTik LtAP (Wireless): dropped from 85 → 10 (75 units sold)
    await client.query(`
      INSERT INTO channel_snapshots
        (captured_at, sku, category, min_dealer_cost, max_dealer_cost, total_channel_stock, supplier_count)
      VALUES
        ($1, 'MUB-LTE-01', 'Networking', 2100, 2300, 85, 2),
        ($2, 'MUB-LTE-01', 'Networking', 2100, 2300, 10, 2)
    `, [
      new Date(now.getTime() - 7 * 86400000),
      now
    ]);

    // Scenario C — Resurrection
    // AMD Ryzen 7 5700X: zero stock for 15 days, landed 50 units today
    const resurrectionInserts: Promise<any>[] = [];
    for (let i = 15; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86400000);
      const stock = i === 0 ? 50 : 0;
      resurrectionInserts.push(
        client.query(`
          INSERT INTO channel_snapshots
            (captured_at, sku, category, min_dealer_cost, max_dealer_cost, total_channel_stock, supplier_count)
          VALUES ($1, 'AMD-5700X', 'Processors', 2800, 2800, $2, 1)
        `, [date, stock])
      );
    }
    await Promise.all(resurrectionInserts);

    return NextResponse.json({
      success: true,
      message: 'Mock data seeded successfully into real products + channel_snapshots tables.',
      scenarios_seeded: [
        'Scenario A: Price Arbitrage — Ubiquiti Switch (~23.6%) and Sunsynk Inverter (~34.6%) via __TEST_ supplier rows',
        'Scenario B: Supply Chain Velocity — Sunsynk Inverter (138 units/7d) and MikroTik LTE (75 units/7d)',
        'Scenario C: Resurrection Alert — AMD-5700X CPU (0 stock for 15 days → 50 units today)',
      ],
      note: 'Test supplier rows use __TEST_ prefix and can be safely deleted after testing.',
    });

  } catch (error: any) {
    console.error('Test Seeding Error:', error);
    return NextResponse.json(
      { error: 'Seeding failed', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
