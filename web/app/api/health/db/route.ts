import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        
        // Test basic connection
        const result = await client.query('SELECT NOW()');
        
        // Check if required tables exist
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('suppliers', 'settings', 'products', 'manual_products')
        `);
        
        client.release();
        
        const existingTables = tablesResult.rows.map(row => row.table_name);
        const requiredTables = ['suppliers', 'settings', 'products', 'manual_products'];
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        return NextResponse.json({
            status: 'connected',
            timestamp: result.rows[0].now,
            existingTables,
            missingTables,
            allTablesExist: missingTables.length === 0
        });
    } catch (err: any) {
        return NextResponse.json({ 
            status: 'error',
            error: err.message,
            code: err.code 
        }, { status: 500 });
    }
}