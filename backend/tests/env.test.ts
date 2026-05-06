import { describe, expect, it } from 'vitest';
import { loadEnv, resetEnvCache } from '../src/config/env.js';

describe('env loader', () => {
  it('parses a valid environment', () => {
    resetEnvCache();
    const env = loadEnv({
      NODE_ENV: 'production',
      PORT: '5000',
      DATABASE_URL: 'postgresql://u:p@h:5432/db',
      JWT_SECRET: 'secret-with-at-least-32-characters-please',
      CORS_ORIGIN: 'https://stride.app',
    } as NodeJS.ProcessEnv);
    expect(env.NODE_ENV).toBe('production');
    expect(env.PORT).toBe(5000);
    expect(env.JWT_EXPIRES_IN).toBe('7d');
  });

  it('rejects a too-short JWT_SECRET', () => {
    resetEnvCache();
    expect(() =>
      loadEnv({
        DATABASE_URL: 'postgresql://x',
        JWT_SECRET: 'short',
      } as NodeJS.ProcessEnv),
    ).toThrowError(/JWT_SECRET/);
  });

  it('rejects when DATABASE_URL is missing', () => {
    resetEnvCache();
    expect(() =>
      loadEnv({
        JWT_SECRET: 'secret-with-at-least-32-characters-please',
      } as NodeJS.ProcessEnv),
    ).toThrowError(/DATABASE_URL/);
  });
});
