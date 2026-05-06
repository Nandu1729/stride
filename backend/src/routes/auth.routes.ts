import { Router } from 'express';
import { loadEnv } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { validateBody } from '../middleware/validate.js';
import { LoginSchema, SignupSchema } from '../schemas/auth.js';
import { login, signup } from '../services/auth.service.js';

const router: Router = Router();

const COOKIE_NAME = 'stride_token';

function cookieOptions() {
  const env = loadEnv();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.COOKIE_SECURE,
    maxAge: sevenDays,
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

router.post('/signup', authLimiter, validateBody(SignupSchema), async (req, res, next) => {
  try {
    const result = await signup(req.body);
    res.cookie(COOKIE_NAME, result.token, cookieOptions());
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/login', authLimiter, validateBody(LoginSchema), async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.cookie(COOKIE_NAME, result.token, cookieOptions());
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
