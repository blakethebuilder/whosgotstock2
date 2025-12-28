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
        'public': 0,
        'team': 1,
        'management': 2,
        'admin': 3
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
    const teamPassphrase = process.env.TEAM_ACCESS_CODE;
    const managementPassphrase = process.env.MANAGEMENT_ACCESS_CODE;
    const adminPassphrase = process.env.ADMIN_ACCESS_CODE;
    
    let isValid = false;
    let userRole = 'public';
    
    // Check passphrase against requested role
    if (role === 'admin' && passphrase === adminPassphrase) {
      isValid = true;
      userRole = 'admin';
    } else if (role === 'management' && passphrase === managementPassphrase) {
      isValid = true;
      userRole = 'management';
    } else if (role === 'team' && passphrase === teamPassphrase) {
      isValid = true;
      userRole = 'team';
    }
    
    return NextResponse.json({
      success: isValid,
      role: isValid ? userRole : 'public',
      message: isValid ? 'Access granted' : 'Invalid access code',
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