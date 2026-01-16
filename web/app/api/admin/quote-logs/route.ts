import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT * FROM quote_logs ORDER BY created_at DESC LIMIT 100');
        return NextResponse.json(result.rows);
    } catch (err: any) {
        console.error('Fetch quote logs error:', err);
        return NextResponse.json({ error: 'Failed to fetch quote logs' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}

export async function POST(request: Request) {
    let client;
    try {
        const { items, totalExVat, totalIncVat, userRole } = await request.json();
        client = await pool.connect();
        await client.query(
            'INSERT INTO quote_logs (items, total_ex_vat, total_inc_vat, user_role) VALUES ($1, $2, $3, $4)',
            [JSON.stringify(items), totalExVat, totalIncVat, userRole]
        );
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Log quote error:', err);
        return NextResponse.json({ error: 'Failed to log quote' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
