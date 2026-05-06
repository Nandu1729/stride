import type { RequestHandler } from 'express';
import { ulid } from 'ulid';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
  }
}

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-request-id');
  const id = incoming && incoming.length <= 64 ? incoming : ulid();
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
};
