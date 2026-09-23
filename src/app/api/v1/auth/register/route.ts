import { NextResponse } from 'next/server';
import { handler, setSessionCookie } from '@/server/http/handler';
import { env } from '@/server/env';
import { register } from '@/server/services/auth';
import { RegisterInput } from '@/lib/contracts';

export const POST = handler({ auth: false, body: RegisterInput, rateLimit: 'auth' }, async ({ db, body, req, ip }) => {
  const { user, token, expiresAt } = await register(db, body, {
    ttlDays: env().SESSION_TTL_DAYS,
    userAgent: req.headers.get('user-agent'),
    ip,
  });
  const res = NextResponse.json({ data: { user } }, { status: 201 });
  setSessionCookie(res, token, expiresAt);
  return res;
});
