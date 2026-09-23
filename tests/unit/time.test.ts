import { describe, expect, it } from 'vitest';
import { addDays, dateRange, localDate, tzOffsetMs, weekdayOf, zonedToUtc } from '@/server/domain/time';

describe('time', () => {
  it('converts IST wall-clock to UTC', () => {
    expect(zonedToUtc('2026-09-23', '09:00', 'Asia/Kolkata').toISOString()).toBe('2026-09-23T03:30:00.000Z');
  });

  it('handles a DST spring-forward gap without throwing (America/New_York)', () => {
    // 02:30 does not exist on 2026-03-08 in New York; result must land within the hour after.
    const at = zonedToUtc('2026-03-08', '02:30', 'America/New_York');
    expect(at.toISOString()).toMatch(/^2026-03-08T0[67]:30/);
  });

  it('resolves wall-clock time on both sides of a DST change', () => {
    expect(zonedToUtc('2026-03-07', '09:00', 'America/New_York').toISOString()).toBe('2026-03-07T14:00:00.000Z');
    expect(zonedToUtc('2026-03-09', '09:00', 'America/New_York').toISOString()).toBe('2026-03-09T13:00:00.000Z');
  });

  it('computes timezone offsets', () => {
    expect(tzOffsetMs(new Date('2026-01-01T00:00:00Z'), 'Asia/Kolkata')).toBe(5.5 * 3_600_000);
    expect(tzOffsetMs(new Date('2026-01-01T00:00:00Z'), 'UTC')).toBe(0);
  });

  it('derives the local calendar date across midnight', () => {
    // 20:00 UTC is 01:30 the next day in IST.
    expect(localDate(new Date('2026-09-23T20:00:00Z'), 'Asia/Kolkata')).toBe('2026-09-24');
  });

  it('does calendar arithmetic across month and leap-year boundaries', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(weekdayOf('2026-09-23')).toBe(3); // Wednesday
    expect(dateRange('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  });

  it('rejects malformed input', () => {
    expect(() => zonedToUtc('2026-9-1', '09:00', 'UTC')).toThrow(RangeError);
    expect(() => zonedToUtc('2026-09-01', '24:00', 'UTC')).toThrow(RangeError);
  });
});
