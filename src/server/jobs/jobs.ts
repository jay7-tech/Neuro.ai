import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import type { Database } from '../db/client';
import { doseEvents, medications, moodEntries, patients } from '../db/schema';
import { resolveDoses } from '../domain/adherence';
import { detectDecline } from '../domain/mood';
import { expandOccurrences } from '../domain/schedule';
import { deleteExpiredSessions } from '../auth/session';
import { raiseAlert } from '../services/alerts';
import { toSchedule } from '../services/medications';
import type { Job } from './runner';

const HOUR = 3_600_000;

/**
 * Finds doses whose grace window has passed with nothing recorded, persists them as
 * `missed` (so reports are stable even if the schedule later changes) and alerts the
 * care team. Idempotent: ON CONFLICT on the dose slot plus alert de-duplication means
 * re-running over the same window is a no-op.
 */
export function missedDoseJob(graceMinutes: number, lookbackHours = 24): Job {
  return {
    name: 'missed-dose-sweep',
    intervalMs: 5 * 60_000,
    async run(db: Database, now: Date) {
      const graceMs = graceMinutes * 60_000;
      const from = new Date(now.getTime() - lookbackHours * HOUR);
      const to = new Date(now.getTime() - graceMs);

      const meds = await db.select().from(medications).where(eq(medications.active, true));
      if (!meds.length) return { missed: 0 };
      const pts = await db
        .select({ id: patients.id, tz: patients.timezone, name: patients.displayName })
        .from(patients)
        .where(inArray(patients.id, [...new Set(meds.map((m) => m.patientId))]));
      const recorded = await db
        .select()
        .from(doseEvents)
        .where(and(inArray(doseEvents.medicationId, meds.map((m) => m.id)), gte(doseEvents.scheduledFor, from), lt(doseEvents.scheduledFor, to)));

      let missed = 0;
      for (const p of pts) {
        const own = meds.filter((m) => m.patientId === p.id);
        const expected = expandOccurrences(own.map(toSchedule), from, to, p.tz);
        const doses = resolveDoses(expected, recorded.filter((r) => r.patientId === p.id), now, graceMinutes);
        for (const d of doses.filter((x) => x.state === 'missed')) {
          const med = own.find((m) => m.id === d.medicationId)!;
          const [inserted] = await db
            .insert(doseEvents)
            .values({ medicationId: d.medicationId, patientId: p.id, scheduledFor: d.scheduledFor, status: 'missed', recordedAt: now })
            .onConflictDoNothing()
            .returning({ id: doseEvents.id });
          if (!inserted) continue;
          missed += 1;
          await raiseAlert(db, {
            patientId: p.id,
            type: 'missed_dose',
            severity: 'warning',
            title: `${p.name} missed ${med.name} (${d.localTime})`,
            dedupeKey: `missed_dose:${d.medicationId}:${d.scheduledFor.toISOString()}`,
            detail: { medicationId: med.id, medication: med.name, dosage: med.dosage, scheduledFor: d.scheduledFor.toISOString() },
          });
        }
      }
      return { medications: meds.length, missed };
    },
  };
}

export function moodDeclineJob(): Job {
  return {
    name: 'mood-decline-scan',
    intervalMs: HOUR,
    async run(db: Database, now: Date) {
      const since = new Date(now.getTime() - 17 * 24 * HOUR);
      const rows = await db
        .select({ patientId: moodEntries.patientId, score: moodEntries.score, at: moodEntries.recordedAt })
        .from(moodEntries)
        .where(gte(moodEntries.recordedAt, since));

      const byPatient = new Map<string, { score: number; at: Date }[]>();
      for (const r of rows) byPatient.set(r.patientId, [...(byPatient.get(r.patientId) ?? []), r]);

      let flagged = 0;
      for (const [patientId, points] of byPatient) {
        const result = detectDecline(points, now);
        if (result.status !== 'decline') continue;
        // ISO-ish week bucket: at most one open mood alert per patient per week.
        const week = Math.floor(now.getTime() / (7 * 24 * HOUR));
        const alert = await raiseAlert(db, {
          patientId,
          type: 'mood_decline',
          severity: 'warning',
          title: `Mood has dropped noticeably (${result.baselineMean} → ${result.recentMean})`,
          dedupeKey: `mood_decline:${week}`,
          detail: result,
        });
        if (alert) flagged += 1;
      }
      return { patients: byPatient.size, flagged };
    },
  };
}

export function sessionCleanupJob(): Job {
  return {
    name: 'session-cleanup',
    intervalMs: 6 * HOUR,
    async run(db: Database, now: Date) {
      return { deleted: await deleteExpiredSessions(db, now) };
    },
  };
}
