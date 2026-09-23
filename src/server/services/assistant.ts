import { eq } from 'drizzle-orm';
import type { Database } from '../db/client';
import { patients } from '../db/schema';
import { notFound } from '../errors';
import type { Actor } from '../http/handler';
import { answerQuestion } from '@/server/ai/flows/ai-companion';
import { identifyMedicine } from '@/server/ai/flows/medicine-identification';
import type { CompanionContext } from '../domain/companion';
import { bestMatch } from '../domain/text-match';
import { requireAccess } from './access';
import { listMedications, todaysDoses } from './medications';
import { listResource } from './reminiscence';
import { listTeam } from './team';
import { planForDay } from './tasks';

export async function buildCompanionContext(
  db: Database,
  actor: Actor,
  patientId: string,
  graceMinutes: number,
): Promise<CompanionContext> {
  const [p] = await db
    .select({ name: patients.displayName, tz: patients.timezone })
    .from(patients)
    .where(eq(patients.id, patientId));
  if (!p) throw notFound('Patient');

  const [doses, plan, family, team] = await Promise.all([
    todaysDoses(db, actor, patientId, graceMinutes),
    planForDay(db, actor, patientId),
    listResource(db, actor, patientId, 'family'),
    listTeam(db, actor, patientId),
  ]);

  const now = new Date();
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: p.tz, ...o }).format(now);
  return {
    patientName: p.name,
    now: {
      date: fmt({ day: 'numeric', month: 'long', year: 'numeric' }),
      weekday: fmt({ weekday: 'long' }),
      time: fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
    },
    nextDoses: doses.doses.map((d) => ({ name: d.name, dosage: d.dosage, time: d.localTime, state: d.state })),
    plan: plan.items.map((i) => ({ title: i.title, time: i.time, completed: i.completed })),
    family: family.map((f) => ({ name: f.name, relation: f.relation })),
    careTeam: team.filter((m) => m.role !== 'patient').map((m) => ({ name: m.name, role: m.role })),
  };
}

export async function askCompanion(
  db: Database,
  actor: Actor,
  patientId: string,
  question: string,
  graceMinutes: number,
) {
  await requireAccess(db, actor, patientId, 'patient:read');
  const ctx = await buildCompanionContext(db, actor, patientId, graceMinutes);
  return answerQuestion(question, ctx);
}

/**
 * Identifies a pack from a photo, then cross-checks it against the patient's active
 * prescriptions. The verdict — not the raw LLM output — is what the patient sees:
 * "This is your Aricept" vs "This is not on your list, ask your caregiver".
 */
export async function checkMedicine(db: Database, actor: Actor, patientId: string, photoDataUri: string) {
  await requireAccess(db, actor, patientId, 'medication:read');
  const [identified, meds] = await Promise.all([identifyMedicine(photoDataUri), listMedications(db, actor, patientId)]);
  const match = bestMatch(identified.medicineName, meds);
  const expired = identified.expiryDate
    ? identified.expiryDate < new Date().toISOString().slice(0, identified.expiryDate.length)
    : false;

  let verdict: 'matches_prescription' | 'not_prescribed' | 'uncertain';
  if (identified.confidence < 0.5) verdict = 'uncertain';
  else verdict = match ? 'matches_prescription' : 'not_prescribed';

  return {
    identified,
    verdict,
    expired,
    matchedMedication: match
      ? {
          id: match.item.id,
          name: match.item.name,
          dosage: match.item.dosage,
          times: match.item.times,
          similarity: Math.round(match.score * 100) / 100,
        }
      : null,
  };
}
