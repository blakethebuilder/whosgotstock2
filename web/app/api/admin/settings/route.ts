import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT key, value FROM settings");
        client.release();

        const settings: Record<string, string> = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });

        // Default values
        if (!settings.update_interval_minutes) settings.update_interval_minutes = '60';
        if (!settings.guest_markup) settings.guest_markup = '15';
        if (!settings.staff_markup) settings.staff_markup = '10';
        if (!settings.manager_markup) settings.manager_markup = '5';
        if (!settings.admin_markup) settings.admin_markup = '0';

        return NextResponse.json(settings);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const client = await pool.connect();

        for (const [key, value] of Object.entries(body)) {
            await client.query(
                "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
                [key, (value as any).toString()]
            );
        }

        client.release();
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
