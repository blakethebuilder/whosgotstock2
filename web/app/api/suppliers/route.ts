import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { successResponse, handleDatabaseError } from '@/lib/api-response';

export async function GET() {
    try {
        const client = await pool.connect();
        
        // Get regular suppliers
        const suppliersResult = await client.query('SELECT name, slug FROM suppliers WHERE enabled = true ORDER BY name ASC');
        
        // Check if we have manual products
        const manualCountResult = await client.query('SELECT COUNT(*) FROM manual_products');
        const hasManualProducts = parseInt(manualCountResult.rows[0].count) > 0;
        
        client.release();
        
        const suppliers = suppliersResult.rows;
        
        // Add Even Flow if we have manual products
        if (hasManualProducts) {
            suppliers.push({
                name: 'Even Flow',
                slug: 'evenflow'
            });
        }
        
        return successResponse(suppliers);
    } catch (err: any) {
        return handleDatabaseError(err);
    }
}
