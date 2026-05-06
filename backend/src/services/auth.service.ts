import { Conflict, Unauthorized } from '../lib/errors.js';
import { signToken } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/passwords.js';
import { prisma } from '../lib/prisma.js';
import type { LoginInput, SignupInput } from '../schemas/auth.js';

export interface AuthResult {
  user: { id: string; name: string; email: string; createdAt: Date };
  token: string;
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw Conflict('An account with that email already exists');

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, name: input.name, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = signToken({ sub: user.id, email: user.email });
  return { user, token };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw Unauthorized('Email or password is incorrect');

  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) throw Unauthorized('Email or password is incorrect');

  const token = signToken({ sub: user.id, email: user.email });
  return {
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    token,
  };
}
