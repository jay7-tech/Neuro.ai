import { and, desc, eq, gte, sql } from 'drizzle-orm';
import type { Database, Executor } from '../db/client';
import { gameSessions, type Difficulty, type GameType } from '../db/schema';
import type { Actor } from '../http/handler';
import { performance, recommend, PROMOTE_WINDOW } from '../domain/difficulty';
import { publish } from '../realtime/bus';
import { requireAccess } from './access';

type SessionInput = { game: GameType; difficulty: Difficulty; score: number; maxScore: number; mistakes: number; durationMs: number };

async function recentAtLevel(db: Executor, patientId: string, game: GameType, level: Difficulty) {
  const rows = await db
    .select({ performance: gameSessions.performance })
    .from(gameSessions)
    .where(and(eq(gameSessions.patientId, patientId), eq(gameSessions.game, game), eq(gameSessions.difficulty, level)))
    .orderBy(desc(gameSessions.createdAt))
    .limit(PROMOTE_WINDOW);
  return rows.map((r) => r.performance);
}

async function currentLevel(db: Executor, patientId: string, game: GameType): Promise<Difficulty> {
  const [last] = await db
    .select({ difficulty: gameSessions.difficulty })
    .from(gameSessions)
    .where(and(eq(gameSessions.patientId, patientId), eq(gameSessions.game, game)))
    .orderBy(desc(gameSessions.createdAt))
    .limit(1);
  return last?.difficulty ?? 'easy';
}

/** What level should the next round be played at? */
export async function nextLevel(db: Executor, actor: Actor, patientId: string, game: GameType) {
  await requireAccess(db, actor, patientId, 'game:read');
  const level = await currentLevel(db, patientId, game);
  return recommend(level, await recentAtLevel(db, patientId, game, level));
}

export async function recordSession(db: Database, actor: Actor, patientId: string, input: SessionInput) {
  await requireAccess(db, actor, patientId, 'game:play');
  const perf = performance(input);
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(gameSessions).values({ ...input, patientId, performance: perf }).returning();
    const next = recommend(input.difficulty, await recentAtLevel(tx, patientId, input.game, input.difficulty));
    await publish(tx, patientId, 'game.completed', row.id);
    return { session: row, recommendation: next };
  });
}

/** Per-game engagement and weekly performance trend, for caregiver/clinician views. */
export async function gameStats(db: Executor, actor: Actor, patientId: string, days = 30) {
  await requireAccess(db, actor, patientId, 'game:read');
  const since = new Date(Date.now() - days * 86_400_000);

  const perGame = await db
    .select({
      game: gameSessions.game,
      sessions: sql<number>`count(*)::int`,
      avgPerformance: sql<number>`round(avg(${gameSessions.performance})::numeric, 3)::float`,
      bestScore: sql<number>`max(${gameSessions.score})::int`,
      totalMinutes: sql<number>`round(sum(${gameSessions.durationMs}) / 60000.0)::int`,
      lastPlayed: sql<Date>`max(${gameSessions.createdAt})`,
    })
    .from(gameSessions)
    .where(and(eq(gameSessions.patientId, patientId), gte(gameSessions.createdAt, since)))
    .groupBy(gameSessions.game);

  const weekly = await db
    .select({
      week: sql<string>`to_char(date_trunc('week', ${gameSessions.createdAt}), 'YYYY-MM-DD')`,
      sessions: sql<number>`count(*)::int`,
      avgPerformance: sql<number>`round(avg(${gameSessions.performance})::numeric, 3)::float`,
    })
    .from(gameSessions)
    .where(and(eq(gameSessions.patientId, patientId), gte(gameSessions.createdAt, since)))
    .groupBy(sql`date_trunc('week', ${gameSessions.createdAt})`)
    .orderBy(sql`date_trunc('week', ${gameSessions.createdAt})`);

  return { days, perGame, weekly };
}
