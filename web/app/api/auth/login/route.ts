import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { validateUserCredentials, generateToken, createSession } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        validationResult.error.errors
      );
    }
    
    const { email, password } = validationResult.data;
    
    // Validate credentials
    const user = await validateUserCredentials(email, password);
    if (!user) {
      return errorResponse('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    // Create session
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     undefined;
    
    await createSession(user.id, token, userAgent, ipAddress);
    
    // Set HTTP-only cookie
    const response = successResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        lastLogin: user.last_login
      },
      token
    });
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
    
    return response;
    
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse('Login failed', 500, 'LOGIN_ERROR');
  }
}