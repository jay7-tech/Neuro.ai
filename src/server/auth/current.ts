import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '../db/client';
import { env } from '../env';
import { SESSION_COOKIE, validateSession, type SessionUser } from './session';

/**
 * Current user for Server Components. `cache` dedupes the lookup across every
 * component rendered in one request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await validateSession(getDb(), token, env().SESSION_TTL_DAYS);
  return session?.user ?? null;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export function homePathFor(role: SessionUser['role']): string {
  return role === 'patient' ? '/patient' : role === 'caregiver' ? '/caregiver' : '/doctor';
}
