import { NextResponse } from 'next/server';
import { handler, setSessionCookie } from '@/server/http/handler';
import { env } from '@/server/env';
import { login } from '@/server/services/auth';
import { LoginInput } from '@/lib/contracts';

export const POST = handler({ auth: false, body: LoginInput, rateLimit: 'auth' }, async ({ db, body, req, ip }) => {
  const { user, token, expiresAt } = await login(db, body, {
    ttlDays: env().SESSION_TTL_DAYS,
    userAgent: req.headers.get('user-agent'),
    ip,
  });
  const res = NextResponse.json({ data: { user } });
  setSessionCookie(res, token, expiresAt);
  return res;
});
