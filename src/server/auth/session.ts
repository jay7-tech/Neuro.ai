import { createHash, randomBytes } from 'node:crypto';
import { and, eq, lt, ne } from 'drizzle-orm';
import type { Executor } from '../db/client';
import { sessions, users, type User } from '../db/schema';

export const SESSION_COOKIE = 'neuro_session';
const DAY_MS = 86_400_000;

export type SessionUser = Pick<User, 'id' | 'email' | 'name' | 'role'>;
export type ValidatedSession = { sessionId: string; expiresAt: Date; user: SessionUser; renewed: boolean };

export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(
  db: Executor,
  userId: string,
  opts: { ttlDays: number; userAgent?: string | null; ip?: string | null },
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + opts.ttlDays * DAY_MS);
  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    expiresAt,
    userAgent: opts.userAgent?.slice(0, 255) ?? null,
    ip: opts.ip ?? null,
  });
  return { token, expiresAt };
}

/**
 * Validates a raw cookie token. Sessions slide: once past half their lifetime they are
 * extended on use, so active users stay signed in while idle sessions still expire.
 */
export async function validateSession(
  db: Executor,
  token: string | undefined | null,
  ttlDays: number,
): Promise<ValidatedSession | null> {
  if (!token || token.length > 128) return null;
  const id = hashToken(token);
  const [row] = await db
    .select({
      expiresAt: sessions.expiresAt,
      user: { id: users.id, email: users.email, name: users.name, role: users.role },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id))
    .limit(1);

  if (!row) return null;
  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }

  const ttlMs = ttlDays * DAY_MS;
  if (row.expiresAt.getTime() - now < ttlMs / 2) {
    const expiresAt = new Date(now + ttlMs);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    return { sessionId: id, expiresAt, user: row.user, renewed: true };
  }
  return { sessionId: id, expiresAt: row.expiresAt, user: row.user, renewed: false };
}

export async function invalidateSession(db: Executor, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

export async function invalidateUserSessions(db: Executor, userId: string, exceptSessionId?: string): Promise<void> {
  const byUser = eq(sessions.userId, userId);
  await db.delete(sessions).where(exceptSessionId ? and(byUser, ne(sessions.id, exceptSessionId)) : byUser);
}

export async function deleteExpiredSessions(db: Executor, now = new Date()): Promise<number> {
  const deleted = await db.delete(sessions).where(lt(sessions.expiresAt, now)).returning({ id: sessions.id });
  return deleted.length;
}
