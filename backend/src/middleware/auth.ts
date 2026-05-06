import type { RequestHandler } from 'express';
import { Forbidden, Unauthorized } from '../lib/errors.js';
import { verifyToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import type { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.header('authorization');
    let token: string | undefined;
    if (header?.startsWith('Bearer ')) {
      token = header.slice('Bearer '.length).trim();
    } else if (typeof req.cookies?.stride_token === 'string') {
      token = req.cookies.stride_token;
    }
    if (!token) throw Unauthorized();

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw Unauthorized('Account no longer exists');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export function requireRole(role: Role): RequestHandler {
  return async (req, _res, next) => {
    try {
      const projectId = req.params.projectId ?? req.params.id;
      if (!projectId) throw Forbidden('Project context missing');
      if (!req.user) throw Unauthorized();

      const membership = await prisma.membership.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } },
        select: { role: true },
      });
      if (!membership) throw Forbidden('You are not a member of this project');
      if (role === 'ADMIN' && membership.role !== 'ADMIN') {
        throw Forbidden('Admin role required for this action');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireMember(): RequestHandler {
  return requireRole('MEMBER');
}
