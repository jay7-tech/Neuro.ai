import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED = ['/patient', '/caregiver', '/doctor'];

/**
 * Edge-level gate: bounce requests without a session cookie before any rendering work.
 * This is only a fast path — the cookie is fully validated against the database in
 * the server layouts and in every API call.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !req.cookies.has('neuro_session')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');
  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'] };
