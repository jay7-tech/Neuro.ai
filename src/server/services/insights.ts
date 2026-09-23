import { and, count, eq } from 'drizzle-orm';
import type { Executor } from '../db/client';
import { alerts } from '../db/schema';
import type { Actor } from '../http/handler';
import { requireAccess } from './access';
import { adherence } from './medications';
import { gameStats } from './games';
import { moodAnalytics } from './mood';

/**
 * One call that powers the clinician's patient overview. The four sub-queries are
 * independent, so they run concurrently rather than as a request waterfall.
 */
export async function patientSummary(db: Executor, actor: Actor, patientId: string, graceMinutes: number) {
  await requireAccess(db, actor, patientId, 'insights:read');
  const [adh, mood, games, [openAlerts]] = await Promise.all([
    adherence(db, actor, patientId, 30, graceMinutes),
    moodAnalytics(db, actor, patientId, 30),
    gameStats(db, actor, patientId, 30),
    db
      .select({ n: count() })
      .from(alerts)
      .where(and(eq(alerts.patientId, patientId), eq(alerts.status, 'open'))),
  ]);

  const flags: string[] = [];
  if (adh.adherenceRate !== null && adh.adherenceRate < 0.8)
    flags.push(`Medication adherence ${Math.round(adh.adherenceRate * 100)}% (target ≥ 80%)`);
  if (mood.decline.status === 'decline') flags.push(`Mood dropped ${mood.decline.drop} points vs. 2-week baseline`);
  if (mood.trend.direction === 'declining') flags.push('Mood trending downward over 30 days');
  const perf = games.weekly.map((w) => w.avgPerformance);
  if (perf.length >= 3 && perf.at(-1)! < perf[0] - 0.15)
    flags.push('Cognitive game performance declining week over week');

  return {
    adherence: { rate: adh.adherenceRate, onTimeRate: adh.onTimeRate, streakDays: adh.streakDays, daily: adh.daily },
    mood: { trend: mood.trend, decline: mood.decline, daily: mood.daily },
    games,
    openAlerts: openAlerts.n,
    flags,
  };
}
