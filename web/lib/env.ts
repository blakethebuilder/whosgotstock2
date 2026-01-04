// Environment variable validation and type safety
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  
  // Access Codes
  TEAM_ACCESS_CODE: z.string().min(8, 'TEAM_ACCESS_CODE must be at least 8 characters'),
  MANAGEMENT_ACCESS_CODE: z.string().min(8, 'MANAGEMENT_ACCESS_CODE must be at least 8 characters'),
  ADMIN_ACCESS_CODE: z.string().min(8, 'ADMIN_ACCESS_CODE must be at least 8 characters'),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().regex(/^\d+$/).transform(Number).default('900000'),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment validation failed:');
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

export const env = validatedEnv;

// Helper function to check if we're in production
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';

// Validate critical environment variables on startup
export function validateEnvironment(): void {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'TEAM_ACCESS_CODE',
    'MANAGEMENT_ACCESS_CODE',
    'ADMIN_ACCESS_CODE'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    process.exit(1);
  }

  // Warn about insecure defaults
  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
    console.warn('⚠️  Using default JWT_SECRET in production is insecure!');
  }

  console.log('✅ Environment validation passed');
}