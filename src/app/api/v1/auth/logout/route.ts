import { NextResponse } from 'next/server';
import { clearSessionCookie, handler } from '@/server/http/handler';
import { invalidateSession, SESSION_COOKIE } from '@/server/auth/session';

export const POST = handler({ auth: false, rateLimit: false }, async ({ db, req }) => {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await invalidateSession(db, token);
  const res = new NextResponse(null, { status: 204 });
  clearSessionCookie(res);
  return res;
});
