import { describe, expect, it } from 'vitest';
import { dailyAverages, detectDecline, mean, stdDev, trend, type MoodPoint } from '@/server/domain/mood';

const NOW = new Date('2026-09-23T12:00:00Z');
const daysAgo = (d: number, h = 0) => new Date(NOW.getTime() - d * 86_400_000 + h * 3_600_000);
const series = (fn: (day: number) => number, days = 17): MoodPoint[] =>
  Array.from({ length: days }, (_, i) => ({ score: fn(days - 1 - i), at: daysAgo(days - 1 - i, -1) }));

describe('statistics helpers', () => {
  it('computes mean and sample standard deviation', () => {
    expect(mean([2, 4, 4, 4, 5, 5, 7, 9])).toBe(5);
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
    expect(stdDev([3])).toBe(0);
  });
});

describe('detectDecline', () => {
  it('flags a clear drop against the personal baseline', () => {
    const r = detectDecline(
      series((d) => (d <= 2 ? 2 : d % 2 ? 4 : 5)),
      NOW,
    );
    expect(r.status).toBe('decline');
    if (r.status !== 'insufficient_data') {
      expect(r.drop).toBeGreaterThanOrEqual(1);
      expect(r.zScore).toBeLessThanOrEqual(-1.5);
    }
  });

  it('does not flag normal day-to-day variation', () => {
    expect(
      detectDecline(
        series((d) => (d % 3 === 0 ? 3 : 4)),
        NOW,
      ).status,
    ).toBe('ok');
  });

  it('does not flag someone whose baseline is simply low', () => {
    expect(
      detectDecline(
        series(() => 2),
        NOW,
      ).status,
    ).toBe('ok');
  });

  it('requires enough data in both windows', () => {
    const r = detectDecline(
      series(() => 4, 4),
      NOW,
    );
    expect(r.status).toBe('insufficient_data');
  });
});

describe('trend', () => {
  it('classifies direction from the least-squares slope', () => {
    expect(trend(series((d) => 5 - (16 - d) * 0.2 + 1)).direction).toBe('declining');
    expect(trend(series((d) => 1 + (16 - d) * 0.2)).direction).toBe('improving');
    expect(trend(series(() => 3)).direction).toBe('stable');
    expect(trend([]).direction).toBe('stable');
  });
});

describe('dailyAverages', () => {
  it('buckets by local date', () => {
    const pts = [
      { score: 4, at: new Date('2026-09-22T20:00:00Z') }, // 23rd in IST
      { score: 2, at: new Date('2026-09-23T04:00:00Z') },
      { score: 5, at: new Date('2026-09-22T05:00:00Z') },
    ];
    const toLocal = (d: Date) => new Date(d.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
    expect(dailyAverages(pts, toLocal)).toEqual([
      { date: '2026-09-22', average: 5, count: 1 },
      { date: '2026-09-23', average: 3, count: 2 },
    ]);
  });
});
