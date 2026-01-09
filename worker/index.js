require('dotenv').config();
const { Client } = require('pg');
const { ingestData } = require('./src/ingestor');

async function getDbClient() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set - worker cannot connect to database');
    return null;
  }
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  await client.connect();
  console.log('Database connected successfully');
  return client;
}

async function runWorkerLoop() {
  console.log("Worker started.");

  while (true) {
    let client = null;
    let intervalMinutes = 60; // Default

    try {
      console.log("----------------------------------------");
      console.log("Starting job cycle: " + new Date().toISOString());

      client = await getDbClient();

      // 1. Get Interval Setting
      if (client) {
        const res = await client.query("SELECT value FROM settings WHERE key = 'update_interval_minutes'");
        if (res.rows.length > 0) {
          intervalMinutes = parseInt(res.rows[0].value) || 60;
        }
      }

      // 2. Run Ingestion (Passing client allows Ingestor to query 'suppliers' table)
      await ingestData(client);

    } catch (err) {
      console.error('Job cycle error:', err);
    } finally {
      if (client) await client.end();
    }

    console.log(`Job finished. Sleeping for ${intervalMinutes} minutes...`);
    // Sleep
    await new Promise(resolve => setTimeout(resolve, intervalMinutes * 60 * 1000));
  }
}

runWorkerLoop();
