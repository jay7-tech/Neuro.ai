import { and, desc, eq, sql } from 'drizzle-orm';
import type { Database, Executor } from '../db/client';
import { alerts, type Alert } from '../db/schema';
import { notFound, conflict } from '../errors';
import type { Actor } from '../http/handler';
import { publish } from '../realtime/bus';
import { requireAccess } from './access';
import { audit } from './audit';

export type NewAlert = {
  patientId: string;
  type: Alert['type'];
  severity: Alert['severity'];
  title: string;
  dedupeKey: string;
  detail?: Record<string, unknown>;
};

/**
 * Idempotent alert creation. The partial unique index on (patient_id, dedupe_key)
 * WHERE status = 'open' turns "don't page twice for the same missed dose" into a
 * database guarantee instead of a race-prone read-then-write.
 *
 * @returns the new alert, or null if an identical open alert already exists.
 */
export async function raiseAlert(db: Executor, a: NewAlert): Promise<Alert | null> {
  const [row] = await db
    .insert(alerts)
    .values({ ...a, detail: a.detail ?? {} })
    .onConflictDoNothing({ target: [alerts.patientId, alerts.dedupeKey], where: sql`status = 'open'` })
    .returning();
  if (row) await publish(db, a.patientId, 'alert.created', row.id);
  return row ?? null;
}

/** Auto-resolves open alerts once the condition clears (e.g. patient back inside the geofence). */
export async function resolveOpenAlerts(db: Executor, patientId: string, type: Alert['type']): Promise<number> {
  const rows = await db
    .update(alerts)
    .set({ status: 'resolved' })
    .where(and(eq(alerts.patientId, patientId), eq(alerts.type, type), eq(alerts.status, 'open')))
    .returning({ id: alerts.id });
  if (rows.length) await publish(db, patientId, 'alert.updated');
  return rows.length;
}

export async function listAlerts(
  db: Executor,
  actor: Actor,
  patientId: string,
  q: { status: 'open' | 'acknowledged' | 'resolved' | 'all'; limit: number },
) {
  await requireAccess(db, actor, patientId, 'alert:read');
  return db
    .select()
    .from(alerts)
    .where(and(eq(alerts.patientId, patientId), q.status === 'all' ? undefined : eq(alerts.status, q.status)))
    .orderBy(desc(alerts.createdAt))
    .limit(q.limit);
}

export async function updateAlertStatus(
  db: Database,
  actor: Actor,
  patientId: string,
  alertId: string,
  status: 'acknowledged' | 'resolved',
) {
  await requireAccess(db, actor, patientId, 'alert:acknowledge');
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ status: alerts.status })
      .from(alerts)
      .where(and(eq(alerts.id, alertId), eq(alerts.patientId, patientId)))
      .for('update');
    if (!current) throw notFound('Alert');
    if (current.status === 'resolved') throw conflict('Alert is already resolved');

    const [row] = await tx
      .update(alerts)
      .set(
        status === 'acknowledged'
          ? { status, acknowledgedBy: actor.user.id, acknowledgedAt: new Date() }
          : {
              status,
              acknowledgedBy: sql`coalesce(${alerts.acknowledgedBy}, ${actor.user.id})`,
              acknowledgedAt: sql`coalesce(${alerts.acknowledgedAt}, now())`,
            },
      )
      .where(eq(alerts.id, alertId))
      .returning();
    await audit(tx, actor, { patientId, action: `alert.${status}`, entity: 'alert', entityId: alertId });
    await publish(tx, patientId, 'alert.updated', alertId);
    return row;
  });
}

export async function raiseSos(db: Database, actor: Actor, patientId: string, message: string | null) {
  await requireAccess(db, actor, patientId, 'alert:raise_sos');
  return db.transaction(async (tx) => {
    // One SOS per minute window: repeated presses by an anxious patient collapse into one page.
    const window = Math.floor(Date.now() / 60_000);
    const alert = await raiseAlert(tx, {
      patientId,
      type: 'sos',
      severity: 'critical',
      title: `${actor.user.name} pressed the help button`,
      dedupeKey: `sos:${window}`,
      detail: { message, raisedBy: actor.user.id },
    });
    await audit(tx, actor, { patientId, action: 'alert.sos', entity: 'alert', entityId: alert?.id ?? null });
    return { raised: alert !== null };
  });
}
