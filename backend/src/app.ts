import path from 'node:path';
import fs from 'node:fs';
import express, { type Express, type RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { loadEnv } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { generalLimiter } from './middleware/rate-limit.js';
import { requestId } from './middleware/request-id.js';

import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/projects.routes.js';
import { tasksRouter, projectTasksRouter } from './routes/tasks.routes.js';
import healthRoutes from './routes/health.routes.js';

export function buildApp(): Express {
  const env = loadEnv();
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ requestId: (req as unknown as { id?: string }).id }),
      autoLogging: { ignore: (req) => req.url === '/api/healthz' || req.url === '/api/readyz' },
    }) as unknown as RequestHandler,
  );
  app.use(helmet({ contentSecurityPolicy: false }) as unknown as RequestHandler);
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }) as unknown as RequestHandler,
  );
  app.use(cookieParser() as unknown as RequestHandler);
  app.use(express.json({ limit: '1mb' }) as unknown as RequestHandler);
  app.use(generalLimiter as unknown as RequestHandler);

  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/projects/:id/tasks', projectTasksRouter);
  app.use('/api/tasks', tasksRouter);

  // Serve built web in production when WEB_DIST_DIR is set.
  if (env.WEB_DIST_DIR) {
    const webDir = path.resolve(env.WEB_DIST_DIR);
    if (fs.existsSync(webDir)) {
      app.use(express.static(webDir) as unknown as RequestHandler);
      app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
          res.sendFile(path.join(webDir, 'index.html'));
          return;
        }
        next();
      });
    } else {
      logger.warn({ webDir }, 'WEB_DIST_DIR set but directory does not exist; web not served');
    }
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
