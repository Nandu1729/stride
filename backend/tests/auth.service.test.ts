import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../src/lib/prisma.js', () => ({ prisma: prismaMock }));

import { login, signup } from '../src/services/auth.service.js';
import { hashPassword } from '../src/lib/passwords.js';
import { HttpError } from '../src/lib/errors.js';

describe('auth.service.signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a user when email is unique', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: 'u1',
      name: 'Aanya',
      email: 'aanya@stride.app',
      createdAt: new Date('2026-05-06T10:00:00.000Z'),
    });

    const result = await signup({ name: 'Aanya', email: 'aanya@stride.app', password: 'StrongPass1' });
    expect(result.user.id).toBe('u1');
    expect(result.token).toMatch(/.+\..+\..+/);
    expect(prismaMock.user.create).toHaveBeenCalledOnce();
  });

  it('rejects when email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'existing' });

    await expect(
      signup({ name: 'Aanya', email: 'aanya@stride.app', password: 'StrongPass1' }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' });
  });
});

describe('auth.service.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('logs in with valid credentials', async () => {
    const passwordHash = await hashPassword('Sup3rSecret!');
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      name: 'Aanya',
      email: 'aanya@stride.app',
      passwordHash,
      createdAt: new Date(),
    });

    const result = await login({ email: 'aanya@stride.app', password: 'Sup3rSecret!' });
    expect(result.user.id).toBe('u1');
    expect(result.token).toBeTypeOf('string');
  });

  it('rejects when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    let err: unknown;
    try {
      await login({ email: 'no@one.app', password: 'whatever' });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(401);
  });

  it('rejects when password is wrong', async () => {
    const passwordHash = await hashPassword('correct');
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      name: 'A',
      email: 'a@b.c',
      passwordHash,
      createdAt: new Date(),
    });

    await expect(login({ email: 'a@b.c', password: 'wrong' })).rejects.toMatchObject({
      status: 401,
    });
  });
});
