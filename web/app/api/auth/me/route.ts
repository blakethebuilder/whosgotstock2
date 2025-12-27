import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return errorResponse('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }
    
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        emailVerified: user.email_verified
      }
    });
    
  } catch (error: any) {
    console.error('Get user error:', error);
    return errorResponse('Failed to get user', 500, 'GET_USER_ERROR');
  }
}