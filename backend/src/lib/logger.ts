import pino from 'pino';
import { loadEnv } from '../config/env.js';

const env = loadEnv();

const transport =
  env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
      }
    : undefined;

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'stride-backend' },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash'],
    censor: '[REDACTED]',
  },
  ...(transport ? { transport } : {}),
});
