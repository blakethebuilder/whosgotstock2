import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, invalidateSession } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (user) {
      const token = request.cookies.get('auth-token')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
      
      if (token) {
        await invalidateSession(user.id, token);
      }
    }
    
    // Clear cookie
    const response = successResponse({ message: 'Logged out successfully' });
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });
    
    return response;
    
  } catch (error: any) {
    console.error('Logout error:', error);
    return errorResponse('Logout failed', 500, 'LOGOUT_ERROR');
  }
}