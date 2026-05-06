import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { loadEnv } from '../config/env.js';
import { Unauthorized } from './errors.js';

export interface JwtPayload {
  sub: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  const env = loadEnv();
  const opts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

export function verifyToken(token: string): JwtPayload {
  const env = loadEnv();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string') {
      throw Unauthorized('Malformed token');
    }
    if (typeof decoded.sub !== 'string' || typeof (decoded as { email?: unknown }).email !== 'string') {
      throw Unauthorized('Malformed token payload');
    }
    return { sub: decoded.sub, email: (decoded as { email: string }).email };
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'UNAUTHORIZED') {
      throw err;
    }
    throw Unauthorized('Invalid or expired token');
  }
}
