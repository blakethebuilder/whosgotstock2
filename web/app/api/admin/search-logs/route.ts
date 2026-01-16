import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT * FROM search_logs ORDER BY created_at DESC LIMIT 100');
        return NextResponse.json(result.rows);
    } catch (err: any) {
        console.error('Fetch search logs error:', err);
        return NextResponse.json({ error: 'Failed to fetch search logs' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
