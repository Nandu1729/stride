import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from '../src/lib/jwt.js';
import { HttpError } from '../src/lib/errors.js';

describe('jwt', () => {
  it('signs and verifies a token', () => {
    const token = signToken({ sub: 'user-1', email: 'demo@stride.app' });
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const payload = verifyToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('demo@stride.app');
  });

  it('rejects a tampered token', () => {
    const token = signToken({ sub: 'user-1', email: 'demo@stride.app' });
    const tampered = token.slice(0, -2) + 'aa';
    let err: unknown;
    try {
      verifyToken(tampered);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(401);
  });

  it('rejects a token signed with a different secret', () => {
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'different-secret-of-at-least-32-characters!';
    let err: unknown;
    try {
      verifyToken('not.a.real.token');
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(HttpError);
    process.env.JWT_SECRET = original;
  });
});
