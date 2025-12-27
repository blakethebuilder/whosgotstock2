import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      // Check if users table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      const usersTableExists = tableCheck.rows[0].exists;
      
      // Check if user_sessions table exists
      const sessionsCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_sessions'
        );
      `);
      
      const sessionsTableExists = sessionsCheck.rows[0].exists;
      
      // Get table structure if it exists
      let usersColumns = [];
      if (usersTableExists) {
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          ORDER BY ordinal_position;
        `);
        usersColumns = columnsResult.rows;
      }
      
      return NextResponse.json({
        success: true,
        database: {
          connected: true,
          usersTableExists,
          sessionsTableExists,
          usersColumns,
          environment: {
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            nodeEnv: process.env.NODE_ENV
          }
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error('Database debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      environment: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}