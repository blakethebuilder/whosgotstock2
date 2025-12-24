require('dotenv').config();
const { Client } = require('pg');
const { ingestData } = require('./src/ingestor');

async function getDbClient() {
  if (!process.env.DATABASE_URL) return null;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
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
