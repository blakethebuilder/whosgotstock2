require('dotenv').config();
const { Client } = require('pg');
const { ingestData } = require('./src/ingestor');

// Create a dummy client interface if connection fails, so we can pass 'null' or handle it
async function main() {
  let client = null;
  try {
    if (process.env.DATABASE_URL) {
      client = new Client({
        connectionString: process.env.DATABASE_URL,
      });
      await client.connect();
      console.log('Connected to PostgreSQL');
    } else {
      console.log('No DATABASE_URL provided. Running in file-only mode.');
    }
  } catch (err) {
    console.error('Could not connect to PostgreSQL:', err.message);
    console.log('Proceeding in file-only mode.');
    client = null;
  }

  try {
    // Run ingestion
    await ingestData(client);
    console.log('Ingestion complete');
  } catch (err) {
    console.error('Error in worker:', err);
  } finally {
    if (client) await client.end();
  }
}

main();
