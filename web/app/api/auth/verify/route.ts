import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, generateToken } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { passphrase, role } = await request.json();
    
    // First, try to get authenticated user
    const user = await getUserFromRequest(request);
    
    if (user) {
      // User is authenticated, check if they have the required role
      const roleHierarchy = {
        'public': 0,
        'guest': 1,
        'team': 2,
        'reseller': 3,
        'admin': 4
      };
      
      const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
      const requiredLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0;
      
      if (userLevel >= requiredLevel) {
        return NextResponse.json({ 
          success: true, 
          role: user.role,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            companyName: user.company_name
          }
        });
      }
    }
    
    // Fall back to legacy passphrase system for internal access codes
    const guestPassphrase = process.env.GUEST_ACCESS_CODE || 'guest123';
    const teamPassphrase = process.env.TEAM_ACCESS_CODE;
    const managementPassphrase = process.env.MANAGEMENT_ACCESS_CODE;
    const adminPassphrase = process.env.ADMIN_ACCESS_CODE;
    
    let isValid = false;
    let userRole = 'public';
    
    // Check passphrase against requested role
    if (role === 'admin' && passphrase === adminPassphrase) {
      isValid = true;
      userRole = 'admin';
    } else if (role === 'reseller' && passphrase === managementPassphrase) {
      isValid = true;
      userRole = 'reseller';
    } else if (role === 'team' && passphrase === teamPassphrase) {
      isValid = true;
      userRole = 'team';
    } else if (role === 'guest' && passphrase === guestPassphrase) {
      isValid = true;
      userRole = 'guest';
    }
    
    const response = NextResponse.json({
      success: isValid,
      role: isValid ? userRole : 'public',
      message: isValid ? 'Access granted' : 'Invalid access code',
      legacy: isValid // Indicate this is legacy auth
    });

    if (isValid) {
      // Find a user with this role or default to a system token
      let userId = 0;
      let email = `${userRole}@system.local`;
      
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT id, email FROM users WHERE role = $1 LIMIT 1', [userRole]);
        if (result.rows.length > 0) {
          userId = result.rows[0].id;
          email = result.rows[0].email;
        }
      } catch (err) {
        console.error('Failed to find user for session:', err);
      } finally {
        client.release();
      }

      const token = generateToken({
        userId,
        email,
        role: userRole
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });
    }

    return response;
    
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}