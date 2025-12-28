import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import pool from './db';

// Types
export interface User {
  id: number;
  email: string;
  role: 'public' | 'team' | 'management' | 'admin';
  company_name?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
  email_verified: boolean;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days
const SALT_ROUNDS = 12;

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT utilities
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Database utilities
export async function createUser(userData: {
  email: string;
  password: string;
  role?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
}): Promise<User> {
  const client = await pool.connect();
  
  try {
    const passwordHash = await hashPassword(userData.password);
    
    const result = await client.query(
      `INSERT INTO users (email, password_hash, role, company_name, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, company_name, first_name, last_name, created_at, last_login, is_active, email_verified`,
      [
        userData.email.toLowerCase(),
        passwordHash,
        userData.role || 'public',
        userData.company_name,
        userData.first_name,
        userData.last_name
      ]
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT id, email, role, company_name, first_name, last_name, created_at, last_login, is_active, email_verified
       FROM users WHERE email = $1 AND is_active = true`,
      [email.toLowerCase()]
    );
    
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function getUserById(id: number): Promise<User | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT id, email, role, company_name, first_name, last_name, created_at, last_login, is_active, email_verified
       FROM users WHERE id = $1 AND is_active = true`,
      [id]
    );
    
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function validateUserCredentials(email: string, password: string): Promise<User | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT id, email, password_hash, role, company_name, first_name, last_name, created_at, last_login, is_active, email_verified
       FROM users WHERE email = $1 AND is_active = true`,
      [email.toLowerCase()]
    );
    
    const user = result.rows[0];
    if (!user) return null;
    
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) return null;
    
    // Update last login
    await client.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } finally {
    client.release();
  }
}

// Session management
export async function createSession(userId: number, token: string, userAgent?: string, ipAddress?: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await client.query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tokenHash, expiresAt, userAgent, ipAddress]
    );
  } finally {
    client.release();
  }
}

export async function invalidateSession(userId: number, token: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Get all sessions for this user to find the matching token
    const sessions = await client.query(
      'SELECT id, token_hash FROM user_sessions WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP',
      [userId]
    );
    
    for (const session of sessions.rows) {
      const isMatch = await bcrypt.compare(token, session.token_hash);
      if (isMatch) {
        await client.query('DELETE FROM user_sessions WHERE id = $1', [session.id]);
        break;
      }
    }
  } finally {
    client.release();
  }
}

// Request utilities
export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  return getUserById(payload.userId);
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

// Role utilities
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'public': 0,
    'team': 1,
    'management': 2,
    'admin': 3
  };
  
  return (roleHierarchy[userRole as keyof typeof roleHierarchy] || 0) >= 
         (roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0);
}