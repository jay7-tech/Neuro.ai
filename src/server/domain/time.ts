/**
 * Timezone arithmetic on top of Intl, with no extra dependency.
 *
 * Care schedules are defined in the patient's *local wall-clock time* ("09:00 every day"),
 * but events are stored as UTC instants. These helpers convert between the two and
 * handle DST gaps/overlaps by re-checking the offset at the candidate instant.
 */

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    formatter(tz);
    return true;
  } catch {
    return false;
  }
}

export function isHHMM(value: string): boolean {
  return HHMM.test(value);
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = Sunday
};

export function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts: Record<string, string> = {};
  for (const p of formatter(timeZone).formatToParts(instant)) parts[p.type] = p.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAYS[parts.weekday],
  };
}

/** Offset of `timeZone` from UTC at `instant`, in milliseconds (IST → +19_800_000). */
export function tzOffsetMs(instant: Date, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** "YYYY-MM-DD" calendar date of `instant` as seen in `timeZone`. */
export function localDate(instant: Date, timeZone: string): string {
  const p = zonedParts(instant, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Converts a local wall-clock date + time in `timeZone` to the UTC instant. */
export function zonedToUtc(ymd: string, hhmm: string, timeZone: string): Date {
  const d = YMD.exec(ymd);
  const t = HHMM.exec(hhmm);
  if (!d || !t) throw new RangeError(`Invalid local date/time: ${ymd} ${hhmm}`);
  const naive = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
  const firstGuess = naive - tzOffsetMs(new Date(naive), timeZone);
  const offsetAtGuess = tzOffsetMs(new Date(firstGuess), timeZone);
  return new Date(naive - offsetAtGuess);
}

/** Adds whole calendar days to a "YYYY-MM-DD" string. */
export function addDays(ymd: string, days: number): string {
  const d = YMD.exec(ymd);
  if (!d) throw new RangeError(`Invalid date: ${ymd}`);
  const ms = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3])) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Day of week (0 = Sunday) of a calendar date, independent of any timezone. */
export function weekdayOf(ymd: string): number {
  const d = YMD.exec(ymd);
  if (!d) throw new RangeError(`Invalid date: ${ymd}`);
  return new Date(Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]))).getUTCDay();
}

/** Inclusive list of calendar dates between two "YYYY-MM-DD" strings. */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let cur = from; cur <= to; cur = addDays(cur, 1)) out.push(cur);
  return out;
}
