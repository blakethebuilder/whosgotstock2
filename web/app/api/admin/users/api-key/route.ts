import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import crypto from 'crypto';

/**
 * POST /api/admin/users/api-key
 * Body: { user_id: number, action: 'generate' | 'revoke' }
 *
 * generate → creates a new wgs_live_XXXX key, stores it in users.api_key
 * revoke   → sets users.api_key = NULL (disables access immediately)
 */
export async function POST(request: NextRequest) {
  const adminUser = await getUserFromRequest(request);
  if (!adminUser || !hasPermission(adminUser.role, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { user_id?: number; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { user_id, action } = body;
  if (!user_id || !action) {
    return NextResponse.json({ error: 'user_id and action are required' }, { status: 400 });
  }
  if (!['generate', 'revoke'].includes(action)) {
    return NextResponse.json({ error: 'action must be "generate" or "revoke"' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // Ensure api_key column exists (idempotent migration)
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR(64) UNIQUE;
    `);

    if (action === 'revoke') {
      await client.query('UPDATE users SET api_key = NULL WHERE id = $1', [user_id]);
      return NextResponse.json({ success: true, api_key: null, message: 'API key revoked.' });
    }

    // Generate a secure, prefixed key: wgs_live_<32 hex chars>
    const raw = crypto.randomBytes(24).toString('hex'); // 48 chars
    const newKey = `wgs_live_${raw}`;

    await client.query('UPDATE users SET api_key = $1 WHERE id = $2', [newKey, user_id]);

    // Return the full key — this is the ONLY time it's shown in plaintext
    return NextResponse.json({
      success: true,
      api_key: newKey,
      message: 'New API key generated. Store it securely — it will not be shown again in full.',
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

/**
 * GET /api/admin/users/api-key?user_id=X
 * Returns whether a user has an active key (masked) — never returns the full key.
 */
export async function GET(request: NextRequest) {
  const adminUser = await getUserFromRequest(request);
  if (!adminUser || !hasPermission(adminUser.role, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');
  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR(64) UNIQUE;`);

    const result = await client.query(
      'SELECT api_key FROM users WHERE id = $1',
      [parseInt(user_id, 10)]
    );
    const key: string | null = result.rows[0]?.api_key ?? null;

    return NextResponse.json({
      has_key: !!key,
      // Show only the prefix + last 4 chars for confirmation, never the full key
      masked_key: key ? `${key.substring(0, 12)}...${key.slice(-4)}` : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
