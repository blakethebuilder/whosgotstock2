import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { passphrase, role } = await request.json();
    
    // Get passphrases from environment variables
    const staffPassphrase = process.env.NEXT_PUBLIC_STAFF_PASSPHRASE;
    const managerPassphrase = process.env.NEXT_PUBLIC_MANAGER_PASSPHRASE;
    const adminPassphrase = process.env.ADMIN_PASSPHRASE; // Admin passphrase should be server-side only
    
    let isValid = false;
    let userRole = 'guest';
    
    // Check passphrase against requested role
    if (role === 'admin' && passphrase === adminPassphrase) {
      isValid = true;
      userRole = 'admin';
    } else if (role === 'manager' && passphrase === managerPassphrase) {
      isValid = true;
      userRole = 'manager';
    } else if (role === 'staff' && passphrase === staffPassphrase) {
      isValid = true;
      userRole = 'staff';
    }
    
    return NextResponse.json({
      success: isValid,
      role: isValid ? userRole : 'guest',
      message: isValid ? 'Authentication successful' : 'Invalid passphrase'
    });
    
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}