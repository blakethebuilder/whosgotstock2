import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM suppliers ORDER BY id ASC');
        client.release();
        return NextResponse.json(result.rows);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, id, name, url, slug, enabled } = body;
        const client = await pool.connect();

        if (action === 'toggle') {
            await client.query('UPDATE suppliers SET enabled = $1 WHERE id = $2', [enabled, id]);
        } else if (action === 'create') {
            await client.query(
                'INSERT INTO suppliers (name, slug, url, enabled) VALUES ($1, $2, $3, true)',
                [name, slug, url]
            );
        } else if (action === 'delete') {
            await client.query('DELETE FROM suppliers WHERE id = $1', [id]);
        }

        client.release();
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
