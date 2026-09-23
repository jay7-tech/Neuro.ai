import { and, asc, eq, gte } from 'drizzle-orm';
import type { Database, Executor } from '../db/client';
import { moodEntries, patients } from '../db/schema';
import { notFound } from '../errors';
import type { Actor } from '../http/handler';
import { dailyAverages, detectDecline, trend } from '../domain/mood';
import { localDate } from '../domain/time';
import { publish } from '../realtime/bus';
import { requireAccess } from './access';

export async function recordMood(
  db: Database,
  actor: Actor,
  patientId: string,
  input: { score: number; note: string | null },
) {
  await requireAccess(db, actor, patientId, 'mood:write');
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(moodEntries)
      .values({ patientId, ...input, recordedBy: actor.user.id })
      .returning();
    await publish(tx, patientId, 'mood.recorded', row.id);
    return row;
  });
}

export async function moodPoints(db: Executor, patientId: string, since: Date) {
  return db
    .select({ score: moodEntries.score, at: moodEntries.recordedAt, note: moodEntries.note })
    .from(moodEntries)
    .where(and(eq(moodEntries.patientId, patientId), gte(moodEntries.recordedAt, since)))
    .orderBy(asc(moodEntries.recordedAt));
}

export async function moodAnalytics(db: Executor, actor: Actor, patientId: string, days: number, now = new Date()) {
  await requireAccess(db, actor, patientId, 'mood:read');
  const [p] = await db.select({ tz: patients.timezone }).from(patients).where(eq(patients.id, patientId));
  if (!p) throw notFound('Patient');

  // Always load enough history for the decline detector's 17-day window.
  const lookback = Math.max(days, 17);
  const points = await moodPoints(db, patientId, new Date(now.getTime() - lookback * 86_400_000));
  const inRange = points.filter((pt) => pt.at.getTime() >= now.getTime() - days * 86_400_000);

  return {
    days,
    daily: dailyAverages(inRange, (d) => localDate(d, p.tz)),
    trend: trend(inRange),
    decline: detectDecline(points, now),
    latest: inRange.at(-1) ?? null,
    entries: inRange.slice(-20).reverse(),
  };
}
