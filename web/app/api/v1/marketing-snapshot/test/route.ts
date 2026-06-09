import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  let client;
  try {
    client = await pool.connect();

    // 1. Clean existing records for test consistency
    console.log('Cleaning mock tables...');
    await client.query('TRUNCATE TABLE supplier_feeds, channel_snapshots, products RESTART IDENTITY CASCADE;');

    // 2. Insert Mock Products
    console.log('Inserting mock products...');
    const productsRes = await client.query(`
      INSERT INTO products (sku, product_name, category) VALUES
      ('UBNT-SW-24', 'Ubiquiti UniFi 24-Port PoE Switch', 'Networking'),
      ('SYN-INV-5K', 'Sunsynk 5kW Hybrid Inverter', 'Power'),
      ('SEAGATE-12TB', 'Seagate IronWolf 12TB NAS HDD', 'Storage'),
      ('MUB-LTE-01', 'MikroTik LtAP mini LTE kit', 'Wireless'),
      ('RTX-4080-GPU', 'ASUS ROG Strix RTX 4080', 'Graphics'),
      ('AMD-5700X', 'AMD Ryzen 7 5700X CPU', 'Processors')
      RETURNING id, sku;
    `);
    
    const prodMap = new Map<string, number>();
    productsRes.rows.forEach((row: any) => {
      prodMap.set(row.sku, row.id);
    });

    // 3. Insert Mock Supplier Feeds (Simulating Price Arbitrage)
    console.log('Inserting mock supplier feeds...');
    await client.query(`
      INSERT INTO supplier_feeds (product_id, supplier_name, dealer_cost, stock_count, warehouse_location) VALUES
      ($1, 'Linkqage', 7200.00, 15, 'JHB'),
      ($1, 'Pinnacle', 8900.00, 8, 'CPT'),  -- Variance check (~23.6%)
      
      ($2, 'Rectron', 18500.00, 20, 'CPT'),
      ($2, 'Mustek', 24900.00, 10, 'JHB'),   -- Variance check (~34.6%)
      
      ($3, 'Syntech', 4200.00, 45, 'JHB'),
      ($3, 'Rectron', 4150.00, 30, 'JHB'),   -- Muted variance
      
      ($5, 'Pinnacle', 22000.00, 5, 'JHB')   -- Single supplier (should be ignored by arbitrage query)
    `, [
      prodMap.get('UBNT-SW-24'),
      prodMap.get('SYN-INV-5K'),
      prodMap.get('SEAGATE-12TB'),
      prodMap.get('RTX-4080-GPU')
    ]);

    // 4. Insert Historical Snapshots (Simulating Supply Chain Velocity & Resurrection)
    console.log('Generating historical snapshots...');
    
    // Time references
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    // Scenario B: Supply Chain Velocity (High drops in trailing 7 days)
    // sunsynk inverter (Power) dropped from 150 to 12
    await client.query(`
      INSERT INTO channel_snapshots (captured_at, sku, category, min_dealer_cost, max_dealer_cost, total_channel_stock, supplier_count) VALUES
      ($1, 'SYN-INV-5K', 'Power', 18500.00, 24900.00, 150, 2), -- 7 days ago
      ($2, 'SYN-INV-5K', 'Power', 18500.00, 24900.00, 12, 2)   -- Today (Implied sales: 138 units)
    `, [sevenDaysAgo, now]);

    // MikroTik LtAP (Wireless) dropped from 85 to 10
    await client.query(`
      INSERT INTO channel_snapshots (captured_at, sku, category, min_dealer_cost, max_dealer_cost, total_channel_stock, supplier_count) VALUES
      ($1, 'MUB-LTE-01', 'Wireless', 2100.00, 2300.00, 85, 2),
      ($2, 'MUB-LTE-01', 'Wireless', 2100.00, 2300.00, 10, 2)  -- Today (Implied sales: 75 units)
    `, [sevenDaysAgo, now]);

    // Scenario C: Resurrection (Dry spell of 0 stock for 14+ days, sudden injection of >15 units today)
    // AMD 5700X CPU: stock 0 for 15 days, today stock is 50
    const insertSnapshotPromises = [];
    for (let i = 15; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const stock = i === 0 ? 50 : 0; // Stock is 50 today, 0 for all previous days
      insertSnapshotPromises.push(
        client.query(`
          INSERT INTO channel_snapshots (captured_at, sku, category, min_dealer_cost, max_dealer_cost, total_channel_stock, supplier_count) VALUES
          ($1, 'AMD-5700X', 'Processors', 2800.00, 2800.00, $2, 1)
        `, [date, stock])
      );
    }
    await Promise.all(insertSnapshotPromises);

    return NextResponse.json({
      success: true,
      message: 'Clean mock data seeded successfully.',
      scenarios_seeded: [
        'Scenario A: Price Arbitrage variance of Sunsynk Inverter (~34.6%) and Ubiquiti Switch (~23.6%)',
        'Scenario B: Supply Chain Velocity drops on Sunsynk Inverter (138 sold) and MikroTik LTE (75 sold)',
        'Scenario C: Resurrection alert on AMD-5700X CPU (0 stock for 15 days, today 50 units)'
      ]
    });

  } catch (error: any) {
    console.error('Test Seeding Error:', error);
    return NextResponse.json({ error: 'Seeding failed', details: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
