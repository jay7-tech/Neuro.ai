import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { jobRuns } from '@/server/db/schema';

export const dynamic = 'force-dynamic';

/**
 * Readiness probe for load balancers / Kubernetes. Reports DB reachability and latency,
 * plus the last run of each background job so a silently dead worker is visible.
 */
export async function GET() {
  const started = performance.now();
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    const dbLatencyMs = Math.round(performance.now() - started);
    const jobs = await db.select().from(jobRuns);
    return NextResponse.json({
      status: 'ok',
      version: process.env.APP_VERSION ?? 'dev',
      uptimeSec: Math.round(process.uptime()),
      checks: { database: { status: 'ok', latencyMs: dbLatencyMs } },
      jobs: jobs.map((j) => ({ name: j.name, status: j.lastStatus, lastFinishedAt: j.lastFinishedAt, runs: j.runs })),
    });
  } catch {
    return NextResponse.json({ status: 'degraded', checks: { database: { status: 'down' } } }, { status: 503 });
  }
}
