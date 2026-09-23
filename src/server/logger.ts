import pino from 'pino';

/**
 * Structured JSON logs in production (ship to any log pipeline),
 * human-readable output in development. Sensitive fields are redacted at the source.
 */
const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info');

export const logger = pino({
  level,
  base: { service: process.env.SERVICE_NAME ?? 'neuro-ai-web' },
  redact: {
    paths: ['password', '*.password', 'passwordHash', '*.passwordHash', 'token', '*.token', 'req.headers.cookie'],
    censor: '[redacted]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
