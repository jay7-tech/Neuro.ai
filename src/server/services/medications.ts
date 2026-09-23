import { and, asc, eq, gte, lt } from 'drizzle-orm';
import type { Database, Executor } from '../db/client';
import { doseEvents, medications, patients, type Medication } from '../db/schema';
import { badRequest, notFound } from '../errors';
import type { Actor } from '../http/handler';
import { buildAdherenceReport, resolveDoses } from '../domain/adherence';
import { expandOccurrences, type RecurringSchedule } from '../domain/schedule';
import { addDays, localDate, zonedToUtc } from '../domain/time';
import { publish } from '../realtime/bus';
import type { MedicationInput } from '@/lib/contracts';
import { requireAccess } from './access';
import { audit } from './audit';

export const toSchedule = (m: Medication): RecurringSchedule => ({
  id: m.id,
  times: m.times,
  daysOfWeek: m.daysOfWeek,
  startDate: m.startDate,
  endDate: m.endDate,
  active: m.active,
});

async function patientTz(db: Executor, patientId: string): Promise<string> {
  const [p] = await db.select({ tz: patients.timezone }).from(patients).where(eq(patients.id, patientId));
  if (!p) throw notFound('Patient');
  return p.tz;
}

export async function listMedications(db: Executor, actor: Actor, patientId: string, includeInactive = false) {
  await requireAccess(db, actor, patientId, 'medication:read');
  return db
    .select()
    .from(medications)
    .where(and(eq(medications.patientId, patientId), includeInactive ? undefined : eq(medications.active, true)))
    .orderBy(asc(medications.name));
}

export async function createMedication(db: Database, actor: Actor, patientId: string, input: MedicationInput) {
  await requireAccess(db, actor, patientId, 'medication:write');
  return db.transaction(async (tx) => {
    const [m] = await tx
      .insert(medications)
      .values({ ...input, patientId })
      .returning();
    await audit(tx, actor, {
      patientId,
      action: 'medication.created',
      entity: 'medication',
      entityId: m.id,
      metadata: { name: m.name },
    });
    await publish(tx, patientId, 'medication.changed', m.id);
    return m;
  });
}

export async function updateMedication(
  db: Database,
  actor: Actor,
  patientId: string,
  id: string,
  input: MedicationInput,
) {
  await requireAccess(db, actor, patientId, 'medication:write');
  return db.transaction(async (tx) => {
    const [m] = await tx
      .update(medications)
      .set(input)
      .where(and(eq(medications.id, id), eq(medications.patientId, patientId)))
      .returning();
    if (!m) throw notFound('Medication');
    await audit(tx, actor, {
      patientId,
      action: 'medication.updated',
      entity: 'medication',
      entityId: id,
      metadata: { fields: Object.keys(input) },
    });
    await publish(tx, patientId, 'medication.changed', id);
    return m;
  });
}

/** Soft-deactivates: dose history must remain intact for adherence reporting. */
export async function discontinueMedication(db: Database, actor: Actor, patientId: string, id: string) {
  await requireAccess(db, actor, patientId, 'medication:write');
  await db.transaction(async (tx) => {
    const tz = await patientTz(tx, patientId);
    const [m] = await tx
      .update(medications)
      .set({ active: false, endDate: localDate(new Date(), tz) })
      .where(and(eq(medications.id, id), eq(medications.patientId, patientId)))
      .returning({ id: medications.id });
    if (!m) throw notFound('Medication');
    await audit(tx, actor, { patientId, action: 'medication.discontinued', entity: 'medication', entityId: id });
    await publish(tx, patientId, 'medication.changed', id);
  });
}

/** Expected doses and their resolved states for a local-date window. */
async function resolvedWindow(
  db: Executor,
  patientId: string,
  fromDate: string,
  toDateExclusive: string,
  now: Date,
  graceMinutes: number,
) {
  const tz = await patientTz(db, patientId);
  const meds = await db.select().from(medications).where(eq(medications.patientId, patientId));
  const from = zonedToUtc(fromDate, '00:00', tz);
  const to = zonedToUtc(toDateExclusive, '00:00', tz);
  const expected = expandOccurrences(meds.map(toSchedule), from, to, tz);
  const recorded = await db
    .select()
    .from(doseEvents)
    .where(
      and(eq(doseEvents.patientId, patientId), gte(doseEvents.scheduledFor, from), lt(doseEvents.scheduledFor, to)),
    );
  return { tz, meds, doses: resolveDoses(expected, recorded, now, graceMinutes) };
}

export async function todaysDoses(
  db: Executor,
  actor: Actor,
  patientId: string,
  graceMinutes: number,
  now = new Date(),
) {
  await requireAccess(db, actor, patientId, 'medication:read');
  const tz = await patientTz(db, patientId);
  const today = localDate(now, tz);
  const { meds, doses } = await resolvedWindow(db, patientId, today, addDays(today, 1), now, graceMinutes);
  const byId = new Map(meds.map((m) => [m.id, m]));
  return {
    date: today,
    timezone: tz,
    doses: doses.map((d) => ({
      ...d,
      scheduledFor: d.scheduledFor.toISOString(),
      recordedAt: d.recordedAt?.toISOString() ?? null,
      name: byId.get(d.medicationId)?.name ?? 'Unknown',
      dosage: byId.get(d.medicationId)?.dosage ?? '',
      instructions: byId.get(d.medicationId)?.instructions ?? null,
    })),
  };
}

export async function adherence(
  db: Executor,
  actor: Actor,
  patientId: string,
  days: number,
  graceMinutes: number,
  now = new Date(),
) {
  await requireAccess(db, actor, patientId, 'medication:read');
  const tz = await patientTz(db, patientId);
  const today = localDate(now, tz);
  const { meds, doses } = await resolvedWindow(
    db,
    patientId,
    addDays(today, -(days - 1)),
    addDays(today, 1),
    now,
    graceMinutes,
  );
  const report = buildAdherenceReport(doses);
  const names = Object.fromEntries(meds.map((m) => [m.id, m.name]));
  return {
    days,
    adherenceRate: report.adherenceRate,
    onTimeRate: report.onTimeRate,
    streakDays: report.streakDays,
    counts: report.counts,
    daily: report.daily,
    byMedication: Object.entries(report.byMedication).map(([id, v]) => ({
      medicationId: id,
      name: names[id] ?? 'Unknown',
      ...v,
    })),
  };
}

/**
 * Records a dose outcome. The (medication, scheduled instant) pair must be a real
 * occurrence of the schedule — clients cannot invent slots — and re-recording the
 * same slot updates it (e.g. correcting "skipped" to "taken") rather than duplicating.
 */
export async function recordDose(
  db: Database,
  actor: Actor,
  patientId: string,
  input: { medicationId: string; scheduledFor: string; status: 'taken' | 'skipped' },
) {
  await requireAccess(db, actor, patientId, 'dose:record');
  const at = new Date(input.scheduledFor);

  return db.transaction(async (tx) => {
    const [m] = await tx
      .select()
      .from(medications)
      .where(and(eq(medications.id, input.medicationId), eq(medications.patientId, patientId)));
    if (!m) throw notFound('Medication');
    const tz = await patientTz(tx, patientId);

    const window = expandOccurrences(
      [toSchedule(m)],
      new Date(at.getTime() - 60_000),
      new Date(at.getTime() + 60_000),
      tz,
    );
    if (!window.some((o) => o.at.getTime() === at.getTime())) {
      throw badRequest('scheduledFor is not a scheduled dose time for this medication');
    }
    if (at.getTime() - Date.now() > 2 * 3_600_000) throw badRequest('Cannot record a dose more than 2 hours early');

    const [row] = await tx
      .insert(doseEvents)
      .values({ medicationId: m.id, patientId, scheduledFor: at, status: input.status, recordedBy: actor.user.id })
      .onConflictDoUpdate({
        target: [doseEvents.medicationId, doseEvents.scheduledFor],
        set: { status: input.status, recordedAt: new Date(), recordedBy: actor.user.id },
      })
      .returning();
    await audit(tx, actor, {
      patientId,
      action: `dose.${input.status}`,
      entity: 'dose_event',
      entityId: row.id,
      metadata: { medication: m.name },
    });
    await publish(tx, patientId, 'dose.recorded', row.id);
    return row;
  });
}
