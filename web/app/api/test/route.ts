import { NextResponse } from 'next/server';

export async function GET() {
    try {
        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'Database connection updated - testing new DATABASE_URL',
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                DATABASE_URL_SET: !!process.env.DATABASE_URL,
                DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0
            }
        });
    } catch (err: any) {
        return NextResponse.json({ 
            status: 'error',
            error: err.message
        }, { status: 500 });
    }
}