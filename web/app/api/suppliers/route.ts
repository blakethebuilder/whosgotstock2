import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        console.log('Suppliers API: Starting request');
        
        // Check if DATABASE_URL is set
        if (!process.env.DATABASE_URL) {
            console.error('DATABASE_URL environment variable is not set');
            return NextResponse.json({ 
                error: 'Database configuration missing',
                debug: 'DATABASE_URL not set'
            }, { status: 500 });
        }
        
        console.log('Suppliers API: DATABASE_URL is set, attempting connection');
        const client = await pool.connect();
        console.log('Suppliers API: Database connected successfully');
        
        // Get regular suppliers
        const suppliersResult = await client.query('SELECT name, slug FROM suppliers WHERE enabled = true ORDER BY name ASC');
        console.log('Suppliers API: Query executed, found', suppliersResult.rows.length, 'suppliers');
        
        // Check if we have evenflow products (handle table not existing)
        let hasEvenflowProducts = false;
        try {
            const evenflowCountResult = await client.query('SELECT COUNT(*) FROM evenflow_products');
            hasEvenflowProducts = parseInt(evenflowCountResult.rows[0].count) > 0;
            console.log('Suppliers API: EvenFlow products check completed, has evenflow products:', hasEvenflowProducts);
        } catch (err: any) {
            // Table doesn't exist, that's fine
            console.log('Suppliers API: evenflow_products table does not exist yet');
        }
        
        client.release();
        console.log('Suppliers API: Database connection released');
        
        const suppliers = suppliersResult.rows;
        
        // Add Even Flow if we have evenflow products
        if (hasEvenflowProducts) {
            suppliers.push({
                name: 'Even Flow',
                slug: 'evenflow'
            });
        }
        
        console.log('Suppliers API: Returning', suppliers.length, 'suppliers');
        return NextResponse.json(suppliers);
    } catch (err: any) {
        console.error('Suppliers API error:', err);
        return NextResponse.json({ 
            error: err.message,
            code: err.code,
            stack: err.stack
        }, { status: 500 });
    }
}
