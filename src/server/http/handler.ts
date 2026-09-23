import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type z, type ZodTypeAny } from 'zod';
import { getDb, type Database } from '../db/client';
import { env } from '../env';
import { AppError, forbidden, unauthenticated } from '../errors';
import { logger } from '../logger';
import { SESSION_COOKIE, validateSession, type SessionUser } from '../auth/session';
import { RATE_LIMITS, rateLimiter, type RateLimitRule } from './rate-limit';

export type Actor = { user: SessionUser; requestId: string; ip: string | null };

type Infer<T> = T extends ZodTypeAny ? z.infer<T> : undefined;

type Config<P, B, Q, A extends boolean> = {
  /** Default true. When false, `actor` may be null. */
  auth?: A;
  params?: P;
  body?: B;
  query?: Q;
  rateLimit?: keyof typeof RATE_LIMITS | RateLimitRule | false;
  /** HTTP status for successful non-Response results. */
  status?: number;
};

type Ctx<P, B, Q, A extends boolean> = {
  req: NextRequest;
  db: Database;
  requestId: string;
  ip: string | null;
  params: Infer<P>;
  body: Infer<B>;
  query: Infer<Q>;
  actor: A extends false ? Actor | null : Actor;
};

type RouteContext = { params: Promise<Record<string, string | string[]>> };

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
}

/**
 * Cookie-authenticated APIs are CSRF targets. SameSite=Lax already blocks most
 * cross-site POSTs; we additionally reject mutating requests whose Origin is not ours.
 */
function assertSameOrigin(req: NextRequest): void {
  if (!MUTATING.has(req.method)) return;
  const origin = req.headers.get('origin');
  if (!origin) return; // non-browser clients (curl, tests) do not send Origin
  const allowed = new Set([new URL(env().APP_URL).origin, req.nextUrl.origin]);
  if (!allowed.has(origin)) throw forbidden('Cross-origin request rejected');
}

export function errorResponse(err: unknown, requestId: string): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, details: err.details, requestId } },
      { status: err.status },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          requestId,
        },
      },
      { status: 422 },
    );
  }
  // Unique-constraint violation that slipped past service-level checks (e.g. a race).
  if (typeof err === 'object' && err && 'code' in err && (err as { code?: string }).code === '23505') {
    return NextResponse.json(
      { error: { code: 'CONFLICT', message: 'Resource already exists', requestId } },
      { status: 409 },
    );
  }
  logger.error({ err, requestId }, 'unhandled error');
  return NextResponse.json(
    { error: { code: 'INTERNAL', message: 'Something went wrong', requestId } },
    { status: 500 },
  );
}

async function parseBody(req: NextRequest): Promise<unknown> {
  const type = req.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) throw new AppError('BAD_REQUEST', 'Expected application/json body');
  try {
    return await req.json();
  } catch {
    throw new AppError('BAD_REQUEST', 'Malformed JSON body');
  }
}

/**
 * Wraps a route handler with the cross-cutting concerns every endpoint needs:
 * request ids, session auth + sliding renewal, CSRF origin check, rate limiting,
 * Zod validation of params/query/body, uniform error envelopes and access logging.
 */
export function handler<
  P extends ZodTypeAny | undefined = undefined,
  B extends ZodTypeAny | undefined = undefined,
  Q extends ZodTypeAny | undefined = undefined,
  A extends boolean = true,
>(config: Config<P, B, Q, A>, fn: (ctx: Ctx<P, B, Q, A>) => Promise<unknown>) {
  return async (req: NextRequest, routeCtx: RouteContext): Promise<Response> => {
    const started = performance.now();
    const requestId = req.headers.get('x-request-id')?.slice(0, 64) || randomUUID();
    const ip = clientIp(req);
    let status = 500;
    let userId: string | undefined;
    let renewal: { token: string; expiresAt: Date } | null = null;

    try {
      assertSameOrigin(req);
      const db = getDb();

      const token = req.cookies.get(SESSION_COOKIE)?.value;
      const session = token ? await validateSession(db, token, env().SESSION_TTL_DAYS) : null;
      if (session?.renewed && token) renewal = { token, expiresAt: session.expiresAt };
      const requireAuth = config.auth !== false;
      if (requireAuth && !session) throw unauthenticated();
      userId = session?.user.id;

      if (config.rateLimit !== false) {
        const rule =
          typeof config.rateLimit === 'object' ? config.rateLimit : RATE_LIMITS[config.rateLimit ?? 'api'];
        const bucket = typeof config.rateLimit === 'string' ? config.rateLimit : 'api';
        const key = `${bucket}:${session?.user.id ?? ip ?? 'anon'}`;
        const result = rateLimiter().take(key, rule);
        if (!result.allowed) {
          const res = errorResponse(new AppError('RATE_LIMITED', 'Too many requests, slow down'), requestId);
          res.headers.set('Retry-After', String(result.retryAfterSec));
          status = 429;
          return res;
        }
      }

      const rawParams = await routeCtx.params;
      const params = config.params ? config.params.parse(rawParams) : undefined;
      const query = config.query ? config.query.parse(Object.fromEntries(req.nextUrl.searchParams)) : undefined;
      const body = config.body ? config.body.parse(await parseBody(req)) : undefined;

      const actor: Actor | null = session ? { user: session.user, requestId, ip } : null;
      const result = await fn({ req, db, requestId, ip, params, body, query, actor } as Ctx<P, B, Q, A>);

      const res =
        result instanceof Response
          ? result
          : result === undefined
            ? new NextResponse(null, { status: 204 })
            : NextResponse.json({ data: result }, { status: config.status ?? 200 });
      status = res.status;
      res.headers.set('x-request-id', requestId);
      if (renewal && res instanceof NextResponse) setSessionCookie(res, renewal.token, renewal.expiresAt);
      return res;
    } catch (err) {
      const res = errorResponse(err, requestId);
      status = res.status;
      res.headers.set('x-request-id', requestId);
      return res;
    } finally {
      logger.info(
        {
          requestId,
          method: req.method,
          path: req.nextUrl.pathname,
          status,
          userId,
          durationMs: Math.round(performance.now() - started),
        },
        'request',
      );
    }
  };
}

export function setSessionCookie(res: NextResponse, token: string, expiresAt: Date): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}
