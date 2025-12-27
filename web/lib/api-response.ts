import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T, 
  meta?: ApiSuccessResponse<T>['meta']
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta })
  });
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string, 
  status: number = 500,
  code?: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details })
  }, { status });
}

/**
 * Handle database errors with appropriate status codes
 */
export function handleDatabaseError(err: any): NextResponse<ApiErrorResponse> {
  console.error('Database error:', err);
  
  // PostgreSQL specific error codes
  switch (err.code) {
    case '23505': // Unique violation
      return errorResponse('Duplicate entry found', 409, 'DUPLICATE_ENTRY');
    case '23503': // Foreign key violation
      return errorResponse('Referenced record not found', 400, 'FOREIGN_KEY_VIOLATION');
    case '23502': // Not null violation
      return errorResponse('Required field missing', 400, 'MISSING_REQUIRED_FIELD');
    case '42P01': // Undefined table
      return errorResponse('Database table not found', 500, 'TABLE_NOT_FOUND');
    default:
      return errorResponse('Database operation failed', 500, 'DATABASE_ERROR', {
        code: err.code,
        message: err.message
      });
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any, 
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!body[field] && body[field] !== 0 && body[field] !== false) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}