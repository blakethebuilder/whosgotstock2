import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        
        // Check if suppliers table exists and what's in it
        const suppliersResult = await client.query('SELECT * FROM suppliers ORDER BY id ASC');
        
        // Check if settings table has the new tier structure
        const settingsResult = await client.query('SELECT * FROM settings ORDER BY key ASC');
        
        client.release();
        
        return NextResponse.json({
            suppliers: suppliersResult.rows,
            supplierCount: suppliersResult.rows.length,
            settings: settingsResult.rows,
            settingsCount: settingsResult.rows.length
        });
    } catch (err: any) {
        return NextResponse.json({ 
            error: err.message,
            code: err.code 
        }, { status: 500 });
    }
}