import { describe, expect, it } from 'vitest';
import { expandOccurrences, type RecurringSchedule } from '@/server/domain/schedule';
import { buildAdherenceReport, resolveDoses, type RecordedDose } from '@/server/domain/adherence';

const TZ = 'Asia/Kolkata';
const med = (over: Partial<RecurringSchedule> = {}): RecurringSchedule => ({
  id: 'm1',
  times: ['08:30', '20:00'],
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  startDate: '2026-09-01',
  endDate: null,
  active: true,
  ...over,
});
const at = (iso: string) => new Date(iso);

describe('expandOccurrences', () => {
  it('expands daily times into UTC instants within the window', () => {
    const occ = expandOccurrences([med()], at('2026-09-22T18:30:00Z'), at('2026-09-23T18:30:00Z'), TZ);
    expect(occ.map((o) => o.at.toISOString())).toEqual(['2026-09-23T03:00:00.000Z', '2026-09-23T14:30:00.000Z']);
    expect(occ[0]).toMatchObject({ localDate: '2026-09-23', localTime: '08:30' });
  });

  it('respects weekdays, start/end dates and the active flag', () => {
    const from = at('2026-09-20T00:00:00Z');
    const to = at('2026-09-27T00:00:00Z');
    expect(expandOccurrences([med({ times: ['09:00'], daysOfWeek: [1] })], from, to, TZ)).toHaveLength(1); // Mon 21st
    expect(expandOccurrences([med({ times: ['09:00'], startDate: '2026-09-25' })], from, to, TZ)).toHaveLength(2);
    expect(expandOccurrences([med({ times: ['09:00'], endDate: '2026-09-21' })], from, to, TZ)).toHaveLength(2); // 20th + 21st
    expect(expandOccurrences([med({ active: false })], from, to, TZ)).toHaveLength(0);
  });

  it('merges multiple schedules in chronological order', () => {
    const occ = expandOccurrences(
      [med({ id: 'b', times: ['07:00'] }), med({ id: 'a', times: ['06:00', '22:00'] })],
      at('2026-09-22T18:30:00Z'),
      at('2026-09-23T18:30:00Z'),
      TZ,
    );
    expect(occ.map((o) => `${o.scheduleId}@${o.localTime}`)).toEqual(['a@06:00', 'b@07:00', 'a@22:00']);
  });

  it('returns nothing for an empty or inverted window', () => {
    expect(expandOccurrences([med()], at('2026-09-23T00:00:00Z'), at('2026-09-23T00:00:00Z'), TZ)).toEqual([]);
  });
});

describe('resolveDoses', () => {
  const occ = expandOccurrences(
    [med({ times: ['08:30'] })],
    at('2026-09-22T18:30:00Z'),
    at('2026-09-23T18:30:00Z'),
    TZ,
  );
  const slot = occ[0].at; // 03:00Z
  const rec = (status: RecordedDose['status'], minutesAfter: number): RecordedDose => ({
    medicationId: 'm1',
    scheduledFor: slot,
    status,
    recordedAt: new Date(slot.getTime() + minutesAfter * 60_000),
  });

  it.each([
    ['upcoming before the slot', [], -10, 'upcoming'],
    ['due inside the grace window', [], 30, 'due'],
    ['missed once grace has passed', [], 61, 'missed'],
    ['taken on time', [rec('taken', 20)], 120, 'taken'],
    ['taken late (after grace)', [rec('taken', 75)], 120, 'taken_late'],
    ['explicitly skipped', [rec('skipped', 5)], 120, 'skipped'],
  ] as const)('%s', (_label, recorded, nowOffsetMin, expected) => {
    const now = new Date(slot.getTime() + nowOffsetMin * 60_000);
    expect(resolveDoses(occ, [...recorded], now, 60)[0].state).toBe(expected);
  });
});

describe('buildAdherenceReport', () => {
  const dose = (
    date: string,
    state: Parameters<typeof buildAdherenceReport>[0][number]['state'],
    medicationId = 'm1',
  ) => ({
    medicationId,
    scheduledFor: new Date(`${date}T03:00:00Z`),
    localDate: date,
    localTime: '08:30',
    state,
    recordedAt: null,
  });

  it('computes rates over settled doses only', () => {
    const r = buildAdherenceReport([
      dose('2026-09-20', 'taken'),
      dose('2026-09-21', 'taken_late'),
      dose('2026-09-22', 'missed'),
      dose('2026-09-23', 'upcoming'),
    ]);
    expect(r.adherenceRate).toBe(0.667);
    expect(r.onTimeRate).toBe(0.333);
    expect(r.counts).toMatchObject({ taken: 1, taken_late: 1, missed: 1, upcoming: 1 });
  });

  it('returns null rates when nothing is settled yet', () => {
    expect(buildAdherenceReport([dose('2026-09-23', 'due')]).adherenceRate).toBeNull();
    expect(buildAdherenceReport([]).adherenceRate).toBeNull();
  });

  it('counts the streak of fully adherent days, ignoring an unfinished today', () => {
    const r = buildAdherenceReport([
      dose('2026-09-19', 'missed'),
      dose('2026-09-20', 'taken'),
      dose('2026-09-21', 'taken'),
      dose('2026-09-22', 'taken_late'),
      dose('2026-09-23', 'taken'),
      dose('2026-09-23', 'upcoming', 'm2'),
    ]);
    expect(r.streakDays).toBe(3);
  });

  it('breaks the streak on a skipped dose', () => {
    expect(buildAdherenceReport([dose('2026-09-21', 'taken'), dose('2026-09-22', 'skipped')]).streakDays).toBe(0);
  });

  it('breaks down adherence per medication and per day', () => {
    const r = buildAdherenceReport([dose('2026-09-22', 'taken', 'a'), dose('2026-09-22', 'missed', 'b')]);
    expect(r.byMedication).toEqual({ a: { settled: 1, taken: 1, rate: 1 }, b: { settled: 1, taken: 0, rate: 0 } });
    expect(r.daily).toEqual([{ date: '2026-09-22', expected: 2, taken: 1, rate: 0.5 }]);
  });
});
