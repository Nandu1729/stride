import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/passwords.js';

describe('passwords', () => {
  it('hashes a password and verifies it', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    expect(hash).not.toEqual('Sup3rSecret!');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(verifyPassword(hash, 'Sup3rSecret!')).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false);
  });

  it('produces distinct hashes for the same password (random salt)', async () => {
    const a = await hashPassword('same-password');
    const b = await hashPassword('same-password');
    expect(a).not.toEqual(b);
  });
});
