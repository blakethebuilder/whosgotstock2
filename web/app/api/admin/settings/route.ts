import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT value FROM settings WHERE key = 'update_interval_minutes'");
        client.release();
        const val = result.rows.length > 0 ? result.rows[0].value : '60';
        return NextResponse.json({ interval: val });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { interval } = await request.json();
        const client = await pool.connect();
        await client.query(
            "INSERT INTO settings (key, value) VALUES ('update_interval_minutes', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
            [interval.toString()]
        );
        client.release();
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
