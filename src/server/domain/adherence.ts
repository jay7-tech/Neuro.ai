import type { Occurrence } from './schedule';

export type RecordedDose = {
  medicationId: string;
  scheduledFor: Date;
  status: 'taken' | 'skipped' | 'missed';
  recordedAt: Date;
};

export type DoseState = 'upcoming' | 'due' | 'taken' | 'taken_late' | 'skipped' | 'missed';

export type ResolvedDose = {
  medicationId: string;
  scheduledFor: Date;
  localDate: string;
  localTime: string;
  state: DoseState;
  recordedAt: Date | null;
};

export type DailyAdherence = { date: string; expected: number; taken: number; rate: number | null };

export type AdherenceReport = {
  doses: ResolvedDose[];
  counts: Record<DoseState, number>;
  /** taken (on time or late) / doses whose outcome is settled. `null` when nothing is settled yet. */
  adherenceRate: number | null;
  /** taken on time / settled doses. */
  onTimeRate: number | null;
  daily: DailyAdherence[];
  byMedication: Record<string, { settled: number; taken: number; rate: number | null }>;
  /** Consecutive most-recent fully-adherent days (today counts only once fully settled). */
  streakDays: number;
};

const SETTLED: ReadonlySet<DoseState> = new Set(['taken', 'taken_late', 'skipped', 'missed']);
const TAKEN: ReadonlySet<DoseState> = new Set(['taken', 'taken_late']);

const key = (medicationId: string, at: Date) => `${medicationId}@${at.toISOString()}`;
const ratio = (num: number, den: number) => (den === 0 ? null : Math.round((num / den) * 1000) / 1000);

/**
 * Joins the *expected* doses (from schedules) with what was actually *recorded*, and
 * classifies each dose. A dose with no record becomes `missed` only after the grace
 * window — before that it is `due`, so a patient is not penalised for taking a 9:00
 * pill at 9:20.
 */
export function resolveDoses(
  expected: readonly Occurrence[],
  recorded: readonly RecordedDose[],
  now: Date,
  graceMinutes: number,
): ResolvedDose[] {
  const graceMs = graceMinutes * 60_000;
  const byKey = new Map(recorded.map((r) => [key(r.medicationId, r.scheduledFor), r]));

  return expected.map((occ) => {
    const rec = byKey.get(key(occ.scheduleId, occ.at));
    let state: DoseState;
    if (rec) {
      if (rec.status === 'taken') {
        state = rec.recordedAt.getTime() - occ.at.getTime() > graceMs ? 'taken_late' : 'taken';
      } else {
        state = rec.status;
      }
    } else if (now < occ.at) {
      state = 'upcoming';
    } else if (now.getTime() < occ.at.getTime() + graceMs) {
      state = 'due';
    } else {
      state = 'missed';
    }
    return {
      medicationId: occ.scheduleId,
      scheduledFor: occ.at,
      localDate: occ.localDate,
      localTime: occ.localTime,
      state,
      recordedAt: rec?.recordedAt ?? null,
    };
  });
}

export function buildAdherenceReport(doses: readonly ResolvedDose[]): AdherenceReport {
  const counts: Record<DoseState, number> = { upcoming: 0, due: 0, taken: 0, taken_late: 0, skipped: 0, missed: 0 };
  const perDay = new Map<string, { expected: number; settled: number; taken: number; open: number }>();
  const perMed = new Map<string, { settled: number; taken: number }>();

  for (const d of doses) {
    counts[d.state] += 1;
    const day = perDay.get(d.localDate) ?? { expected: 0, settled: 0, taken: 0, open: 0 };
    day.expected += 1;
    const med = perMed.get(d.medicationId) ?? { settled: 0, taken: 0 };
    if (SETTLED.has(d.state)) {
      day.settled += 1;
      med.settled += 1;
      if (TAKEN.has(d.state)) {
        day.taken += 1;
        med.taken += 1;
      }
    } else {
      day.open += 1;
    }
    perDay.set(d.localDate, day);
    perMed.set(d.medicationId, med);
  }

  const settled = counts.taken + counts.taken_late + counts.skipped + counts.missed;
  const days = [...perDay.entries()].sort(([a], [b]) => a.localeCompare(b));

  let streakDays = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const [, d] = days[i];
    if (d.open > 0) {
      // An unfinished day (typically today) neither breaks nor extends the streak.
      if (i === days.length - 1) continue;
      break;
    }
    if (d.settled > 0 && d.taken === d.settled) streakDays += 1;
    else break;
  }

  return {
    doses: [...doses],
    counts,
    adherenceRate: ratio(counts.taken + counts.taken_late, settled),
    onTimeRate: ratio(counts.taken, settled),
    daily: days.map(([date, d]) => ({ date, expected: d.expected, taken: d.taken, rate: ratio(d.taken, d.settled) })),
    byMedication: Object.fromEntries(
      [...perMed.entries()].map(([id, m]) => [id, { ...m, rate: ratio(m.taken, m.settled) }]),
    ),
    streakDays,
  };
}
