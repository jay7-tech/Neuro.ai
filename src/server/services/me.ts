import { and, eq } from 'drizzle-orm';
import type { Executor } from '../db/client';
import { careTeamMembers, patients } from '../db/schema';

/** The patient record a patient-role user owns (their own care team). */
export async function ownPatientRecord(db: Executor, userId: string) {
  const [row] = await db
    .select({ id: patients.id, displayName: patients.displayName, photoUrl: patients.photoUrl })
    .from(careTeamMembers)
    .innerJoin(patients, eq(patients.id, careTeamMembers.patientId))
    .where(and(eq(careTeamMembers.userId, userId), eq(careTeamMembers.role, 'patient')))
    .limit(1);
  return row ?? null;
}
