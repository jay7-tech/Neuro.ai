import { sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { jobRuns } from '../db/schema';
import { logger } from '../logger';

export type Job = {
  name: string;
  intervalMs: number;
  run: (db: Database, now: Date) => Promise<Record<string, unknown> | void>;
};

/** Stable 32-bit key per job name for pg_try_advisory_lock. */
function lockKey(name: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h | 0;
}

/**
 * Runs `job` once inside a transaction guarded by a Postgres advisory lock.
 * Any number of worker replicas can run the same schedule; exactly one executes each
 * tick and the rest skip. No Redis, no leader election. Because the job body runs in
 * the same transaction, its writes, alerts and NOTIFY events commit atomically.
 */
export async function runOnce(db: Database, job: Job, now = new Date()): Promise<'ran' | 'skipped' | 'failed'> {
  return db.transaction(async (tx) => {
    // Transaction-scoped lock: released automatically on commit/rollback, even on crash.
    const [{ locked }] = (
      await tx.execute<{ locked: boolean }>(sql`select pg_try_advisory_xact_lock(${lockKey(job.name)}) as locked`)
    ).rows;
    if (!locked) return 'skipped' as const;

    const log = logger.child({ job: job.name });
    const started = Date.now();
    await tx
      .insert(jobRuns)
      .values({ name: job.name, lastStartedAt: now, runs: 1 })
      .onConflictDoUpdate({ target: jobRuns.name, set: { lastStartedAt: now, runs: sql`${jobRuns.runs} + 1` } });

    try {
      // Nested savepoint so a failing job still lets us record the failure below.
      const stats = await tx.transaction((inner) => job.run(inner as unknown as Database, now));
      await tx
        .update(jobRuns)
        .set({ lastFinishedAt: new Date(), lastStatus: 'ok', lastError: null })
        .where(sql`${jobRuns.name} = ${job.name}`);
      log.info({ durationMs: Date.now() - started, ...(stats ?? {}) }, 'job finished');
      return 'ran' as const;
    } catch (err) {
      await tx
        .update(jobRuns)
        .set({ lastFinishedAt: new Date(), lastStatus: 'error', lastError: String((err as Error)?.message ?? err).slice(0, 1000) })
        .where(sql`${jobRuns.name} = ${job.name}`);
      log.error({ err, durationMs: Date.now() - started }, 'job failed');
      return 'failed' as const;
    }
  });
}

/** Simple interval scheduler with graceful shutdown: in-flight runs finish before exit. */
export function schedule(db: Database, jobs: readonly Job[]) {
  const timers: NodeJS.Timeout[] = [];
  const inFlight = new Set<Promise<unknown>>();
  let stopping = false;

  for (const job of jobs) {
    const tick = () => {
      if (stopping) return;
      const p = runOnce(db, job).catch((err) => logger.error({ err, job: job.name }, 'job tick crashed'));
      inFlight.add(p);
      void p.finally(() => inFlight.delete(p));
    };
    tick();
    timers.push(setInterval(tick, job.intervalMs));
  }

  return async function stop() {
    stopping = true;
    timers.forEach(clearInterval);
    await Promise.allSettled([...inFlight]);
  };
}
