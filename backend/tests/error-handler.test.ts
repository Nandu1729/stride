import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import {
  BadRequest,
  Forbidden,
  NotFound,
  Unauthorized,
} from '../src/lib/errors.js';
import { errorHandler, notFoundHandler } from '../src/middleware/error-handler.js';

function makeApp() {
  const app = express();
  app.use(express.json() as unknown as RequestHandler);

  app.get('/throw/bad', (_req, _res, next) => next(BadRequest('nope')));
  app.get('/throw/unauth', (_req, _res, next) => next(Unauthorized()));
  app.get('/throw/forbidden', (_req, _res, next) => next(Forbidden()));
  app.get('/throw/notfound', (_req, _res, next) => next(NotFound('Project')));
  app.get('/throw/zod', (_req, _res, next) => {
    const schema = z.object({ name: z.string().min(3) });
    const parsed = schema.safeParse({ name: 'a' });
    if (!parsed.success) next(parsed.error);
    else next(new Error('expected ZodError'));
  });
  app.get('/throw/unknown', (_req, _res, next) => next(new Error('boom')));

  app.use(notFoundHandler);
  app.use(errorHandler as unknown as RequestHandler);
  return app;
}

describe('error handler', () => {
  it('returns 400 for BadRequest', async () => {
    const res = await request(makeApp()).get('/throw/bad');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
  it('returns 401 for Unauthorized', async () => {
    const res = await request(makeApp()).get('/throw/unauth');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
  it('returns 403 for Forbidden', async () => {
    const res = await request(makeApp()).get('/throw/forbidden');
    expect(res.status).toBe(403);
  });
  it('returns 404 for NotFound', async () => {
    const res = await request(makeApp()).get('/throw/notfound');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/Project not found/);
  });
  it('flattens Zod errors as 400', async () => {
    const res = await request(makeApp()).get('/throw/zod');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
  it('hides unknown errors behind 500', async () => {
    const res = await request(makeApp()).get('/throw/unknown');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL');
  });
  it('returns 404 for unknown routes', async () => {
    const res = await request(makeApp()).get('/totally/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

it('ZodError sanity', () => {
  const schema = z.object({ x: z.number() });
  const result = schema.safeParse({ x: 'no' });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toBeInstanceOf(ZodError);
  }
});
