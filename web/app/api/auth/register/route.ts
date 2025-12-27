import { NextRequest } from 'next/server';
import { registerSchema } from '@/lib/validation';
import { createUser, generateToken, createSession, getUserByEmail } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    // Phase 1 Basic Auth - Registration endpoint
    const body = await request.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        validationResult.error.errors
      );
    }
    
    const { email, password, firstName, lastName, companyName, role } = validationResult.data;
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return errorResponse('User with this email already exists', 409, 'USER_EXISTS');
    }
    
    // Create user
    const user = await createUser({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      company_name: companyName,
      role
    });
    
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
        createdAt: user.created_at
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
    console.error('Registration error:', error);
    return errorResponse('Registration failed', 500, 'REGISTRATION_ERROR');
  }
}