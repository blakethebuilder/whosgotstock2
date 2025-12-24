require('dotenv').config();
const { Client } = require('pg');
const { ingestData } = require('./src/ingestor');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Run ingestion
    await ingestData(client);
    
    console.log('Ingestion complete');
  } catch (err) {
    console.error('Error in worker:', err);
  } finally {
    await client.end();
  }
}

main();
