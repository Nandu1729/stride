import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router: Router = Router();

router.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.get('/readyz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'unavailable', error: (err as Error).message });
  }
});

export default router;
