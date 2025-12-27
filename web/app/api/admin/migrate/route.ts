import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const MIGRATION_SQL = `
-- User authentication tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'free',
    company_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);

-- User sessions for JWT token management
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET
);

-- User usage tracking (monthly)
CREATE TABLE IF NOT EXISTS user_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- '2024-12'
    searches_count INTEGER DEFAULT 0,
    quotes_generated INTEGER DEFAULT 0,
    last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month)
);

-- User subscription/billing info (for future use)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- 'free', 'professional', 'enterprise'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    billing_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Update function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin/partner role
    const user = await getUserFromRequest(request);
    
    // For now, allow migration without auth (since auth tables don't exist yet)
    // In production, you might want to add a special migration key
    const { migrationKey } = await request.json().catch(() => ({}));
    
    // Simple protection - require a migration key
    if (migrationKey !== 'migrate-auth-tables-2024') {
      return NextResponse.json({ 
        error: 'Migration key required',
        hint: 'Use migrationKey: "migrate-auth-tables-2024"'
      }, { status: 401 });
    }
    
    console.log('Starting database migration for user authentication tables...');
    
    const client = await pool.connect();
    
    try {
      // Execute the migration
      await client.query(MIGRATION_SQL);
      
      // Check if tables were created successfully
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'user_sessions', 'user_usage', 'user_subscriptions')
        ORDER BY table_name
      `);
      
      const createdTables = tablesResult.rows.map(row => row.table_name);
      
      console.log('Migration completed successfully. Created tables:', createdTables);
      
      return NextResponse.json({
        success: true,
        message: 'Database migration completed successfully',
        tablesCreated: createdTables,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check current migration status
    const client = await pool.connect();
    
    try {
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'user_sessions', 'user_usage', 'user_subscriptions')
        ORDER BY table_name
      `);
      
      const existingTables = tablesResult.rows.map(row => row.table_name);
      const requiredTables = ['users', 'user_sessions', 'user_usage', 'user_subscriptions'];
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      return NextResponse.json({
        migrationStatus: missingTables.length === 0 ? 'completed' : 'pending',
        existingTables,
        missingTables,
        allTablesExist: missingTables.length === 0
      });
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to check migration status',
      details: error.message
    }, { status: 500 });
  }
}