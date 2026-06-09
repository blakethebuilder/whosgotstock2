import { Pool } from 'pg';

// Enhanced database configuration with security settings
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' 
        ? { rejectUnauthorized: false } 
        : false, // SSL configurable via environment variable
    max: process.env.DATABASE_MAX_CONNECTIONS ? parseInt(process.env.DATABASE_MAX_CONNECTIONS) : 10, // Max clients in pool, configurable with safe default
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
});

// Enhanced error handling and logging
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

pool.on('connect', () => {
    console.log('Database connected successfully');
});

export default pool;
