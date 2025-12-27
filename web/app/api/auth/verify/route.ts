import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { passphrase, role } = await request.json();
    
    // First, try to get authenticated user
    const user = await getUserFromRequest(request);
    
    if (user) {
      // User is authenticated, check if they have the required role
      const roleHierarchy = {
        'free': 0,
        'professional': 1,
        'enterprise': 2,
        'staff': 3,
        'partner': 4
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
    
    // Fall back to legacy passphrase system
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
      message: isValid ? 'Authentication successful' : 'Invalid passphrase',
      legacy: isValid // Indicate this is legacy auth
    });
    
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}