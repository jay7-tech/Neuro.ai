import { and, count, eq, gt, isNull, ne, or, sql } from 'drizzle-orm';
import type { Database, Executor } from '../db/client';
import { alerts, careTeamMembers, messages, patients } from '../db/schema';
import { badRequest, forbidden } from '../errors';
import type { Actor } from '../http/handler';
import { isValidTimeZone } from '../domain/time';
import { publish } from '../realtime/bus';
import type { CreatePatientInput } from '@/lib/contracts';
import { requireAccess } from './access';
import { audit } from './audit';

/** Every patient the actor is on the care team of, with badge counts for the switcher. */
export async function listMyPatients(db: Executor, actor: Actor) {
  const unread = db
    .select({ patientId: messages.patientId, n: count().as('unread_n') })
    .from(messages)
    .innerJoin(
      careTeamMembers,
      and(eq(careTeamMembers.patientId, messages.patientId), eq(careTeamMembers.userId, actor.user.id)),
    )
    .where(
      and(
        ne(messages.senderId, actor.user.id),
        or(isNull(careTeamMembers.lastReadAt), gt(messages.createdAt, careTeamMembers.lastReadAt)),
      ),
    )
    .groupBy(messages.patientId)
    .as('unread');

  const openAlerts = db
    .select({ patientId: alerts.patientId, n: count().as('alert_n') })
    .from(alerts)
    .where(eq(alerts.status, 'open'))
    .groupBy(alerts.patientId)
    .as('open_alerts');

  return db
    .select({
      id: patients.id,
      displayName: patients.displayName,
      photoUrl: patients.photoUrl,
      role: careTeamMembers.role,
      unreadMessages: sql<number>`coalesce(${unread.n}, 0)::int`,
      openAlerts: sql<number>`coalesce(${openAlerts.n}, 0)::int`,
    })
    .from(careTeamMembers)
    .innerJoin(patients, eq(patients.id, careTeamMembers.patientId))
    .leftJoin(unread, eq(unread.patientId, patients.id))
    .leftJoin(openAlerts, eq(openAlerts.patientId, patients.id))
    .where(eq(careTeamMembers.userId, actor.user.id))
    .orderBy(patients.displayName);
}

export async function getPatient(db: Executor, actor: Actor, patientId: string) {
  const role = await requireAccess(db, actor, patientId, 'patient:read');
  const [p] = await db.select().from(patients).where(eq(patients.id, patientId));
  // Clinical fields are hidden from the patient's own simplified view.
  return role === 'patient' ? { ...p, medicalSummary: null, myRole: role } : { ...p, myRole: role };
}

/** A caregiver registers a patient who will not log in themselves. */
export async function createPatient(db: Database, actor: Actor, input: CreatePatientInput) {
  if (actor.user.role !== 'caregiver') throw forbidden('Only caregivers can create patient profiles');
  if (!isValidTimeZone(input.timezone)) throw badRequest(`Unknown timezone ${input.timezone}`);

  return db.transaction(async (tx) => {
    const [p] = await tx.insert(patients).values(input).returning();
    await tx.insert(careTeamMembers).values({ patientId: p.id, userId: actor.user.id, role: 'caregiver' });
    await audit(tx, actor, { patientId: p.id, action: 'patient.created', entity: 'patient', entityId: p.id });
    return p;
  });
}

export async function updatePatient(db: Database, actor: Actor, patientId: string, input: Partial<CreatePatientInput>) {
  await requireAccess(db, actor, patientId, 'patient:update');
  if (input.timezone && !isValidTimeZone(input.timezone)) throw badRequest(`Unknown timezone ${input.timezone}`);
  return db.transaction(async (tx) => {
    const [p] = await tx.update(patients).set(input).where(eq(patients.id, patientId)).returning();
    await audit(tx, actor, {
      patientId,
      action: 'patient.updated',
      entity: 'patient',
      entityId: patientId,
      metadata: { fields: Object.keys(input) },
    });
    await publish(tx, patientId, 'patient.updated');
    return p;
  });
}

export async function configureGeofence(
  db: Database,
  actor: Actor,
  patientId: string,
  input: { homeLat: number; homeLng: number; radiusM: number },
) {
  await requireAccess(db, actor, patientId, 'location:configure');
  return db.transaction(async (tx) => {
    const [p] = await tx
      .update(patients)
      .set({ homeLat: input.homeLat, homeLng: input.homeLng, geofenceRadiusM: input.radiusM })
      .where(eq(patients.id, patientId))
      .returning({ homeLat: patients.homeLat, homeLng: patients.homeLng, radiusM: patients.geofenceRadiusM });
    await audit(tx, actor, { patientId, action: 'geofence.configured', entity: 'patient', entityId: patientId, metadata: input });
    return p;
  });
}
