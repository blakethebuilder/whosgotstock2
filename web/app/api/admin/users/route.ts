import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserFromRequest, hasPermission, createUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !hasPermission(user.role, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, email, role, company_name, first_name, last_name, created_at, last_login, is_active, email_verified 
       FROM users ORDER BY created_at DESC`
    );
    return NextResponse.json({ users: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const adminUser = await getUserFromRequest(request);
  if (!adminUser || !hasPermission(adminUser.role, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, password, role, company_name, first_name, last_name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const newUser = await createUser({
      email,
      password,
      role: role || 'public',
      company_name,
      first_name,
      last_name
    });

    return NextResponse.json({ user: newUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const adminUser = await getUserFromRequest(request);
  if (!adminUser || !hasPermission(adminUser.role, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idStr = searchParams.get('id');
  if (!idStr) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const id = parseInt(idStr, 10);
  if (adminUser.id === id) {
    return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
