import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Registration test - received body:', body);
    
    // Test validation
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors);
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      }, { status: 400 });
    }
    
    console.log('Validation passed:', validationResult.data);
    
    // Test environment variables
    const hasJwtSecret = !!process.env.JWT_SECRET;
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    return NextResponse.json({
      success: true,
      message: 'Test passed',
      data: validationResult.data,
      environment: {
        hasJwtSecret,
        hasDatabaseUrl,
        nodeEnv: process.env.NODE_ENV
      }
    });
    
  } catch (error: any) {
    console.error('Test registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error.message
    }, { status: 500 });
  }
}