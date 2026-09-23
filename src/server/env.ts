import { z } from 'zod';

/**
 * Environment is validated once at boot. A misconfigured deployment fails fast
 * with a readable error instead of surfacing as a runtime 500 later.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  /** Public origin, used for CSRF origin checks and absolute links. */
  APP_URL: z.string().url().default('http://localhost:9002'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  GEMINI_API_KEY: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(1).optional()),
  /** Missed-dose grace period before a scheduled dose is considered missed. */
  DOSE_GRACE_MINUTES: z.coerce.number().int().positive().default(60),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
