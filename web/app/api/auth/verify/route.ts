import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { passphrase, role } = await request.json();
    
    // Get passphrases from environment variables
    const professionalPassphrase = process.env.NEXT_PUBLIC_PROFESSIONAL_PASSPHRASE;
    const enterprisePassphrase = process.env.NEXT_PUBLIC_ENTERPRISE_PASSPHRASE;
    const staffPassphrase = process.env.NEXT_PUBLIC_STAFF_PASSPHRASE;
    const partnerPassphrase = process.env.PARTNER_PASSPHRASE; // Partner passphrase should be server-side only
    
    let isValid = false;
    let userRole = 'free';
    
    // Check passphrase against requested role
    if (role === 'partner' && passphrase === partnerPassphrase) {
      isValid = true;
      userRole = 'partner';
    } else if (role === 'enterprise' && passphrase === enterprisePassphrase) {
      isValid = true;
      userRole = 'enterprise';
    } else if (role === 'staff' && passphrase === staffPassphrase) {
      isValid = true;
      userRole = 'staff';
    } else if (role === 'professional' && passphrase === professionalPassphrase) {
      isValid = true;
      userRole = 'professional';
    }
    
    return NextResponse.json({
      success: isValid,
      role: isValid ? userRole : 'free',
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