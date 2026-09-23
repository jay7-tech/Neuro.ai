import { dateRange, localDate, weekdayOf, zonedToUtc } from './time';

/** The subset of a medication/task needed to expand it into concrete occurrences. */
export type RecurringSchedule = {
  id: string;
  times: readonly string[];
  daysOfWeek: readonly number[];
  startDate: string;
  endDate: string | null;
  active: boolean;
};

export type Occurrence = { scheduleId: string; localDate: string; localTime: string; at: Date };

/**
 * Expands recurring schedules into concrete UTC instants within [from, to).
 * Pure and deterministic: the adherence engine, the missed-dose worker and the
 * "today" view all derive expected doses from this single function.
 */
export function expandOccurrences(
  schedules: readonly RecurringSchedule[],
  from: Date,
  to: Date,
  timeZone: string,
): Occurrence[] {
  if (to <= from) return [];
  // Pad by one local day on each side so instants near midnight in any offset are covered.
  const days = dateRange(localDate(new Date(from.getTime() - 86_400_000), timeZone), localDate(to, timeZone));
  const out: Occurrence[] = [];

  for (const s of schedules) {
    if (!s.active) continue;
    const allowed = new Set(s.daysOfWeek);
    for (const day of days) {
      if (day < s.startDate) continue;
      if (s.endDate && day > s.endDate) continue;
      if (!allowed.has(weekdayOf(day))) continue;
      for (const time of s.times) {
        const at = zonedToUtc(day, time, timeZone);
        if (at >= from && at < to) out.push({ scheduleId: s.id, localDate: day, localTime: time, at });
      }
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime() || a.scheduleId.localeCompare(b.scheduleId));
}
