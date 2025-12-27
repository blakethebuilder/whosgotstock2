import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        
        // Get regular suppliers
        const suppliersResult = await client.query('SELECT name, slug FROM suppliers WHERE enabled = true ORDER BY name ASC');
        
        // Check if we have manual products (handle table not existing)
        let hasManualProducts = false;
        try {
            const manualCountResult = await client.query('SELECT COUNT(*) FROM manual_products');
            hasManualProducts = parseInt(manualCountResult.rows[0].count) > 0;
        } catch (err: any) {
            // Table doesn't exist, that's fine
            console.log('manual_products table does not exist yet');
        }
        
        client.release();
        
        const suppliers = suppliersResult.rows;
        
        // Add Even Flow if we have manual products
        if (hasManualProducts) {
            suppliers.push({
                name: 'Even Flow',
                slug: 'evenflow'
            });
        }
        
        return NextResponse.json(suppliers);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
