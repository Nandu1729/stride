import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn(async () => 1),
  },
}));

import healthRoutes from '../src/routes/health.routes.js';

function app() {
  const a = express();
  a.use('/api', healthRoutes as unknown as RequestHandler);
  return a;
}

describe('health routes', () => {
  it('healthz reports ok', async () => {
    const res = await request(app()).get('/api/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('readyz reports ready when db is reachable', async () => {
    const res = await request(app()).get('/api/readyz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });
});
