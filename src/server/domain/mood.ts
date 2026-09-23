/**
 * Mood analytics over 1–5 self-reports.
 *
 * Detection compares a short *recent* window against the patient's own longer
 * *baseline* — people differ a lot in how they self-rate, so a population threshold
 * ("alert below 2.5") would be both noisy and unfair. We require:
 *   1. enough samples in both windows,
 *   2. an absolute drop of at least `minDrop` points, and
 *   3. a z-score of the recent mean against the baseline at or below `zThreshold`.
 */

export type MoodPoint = { score: number; at: Date };

export type DailyMood = { date: string; average: number; count: number };

export type TrendResult = { slopePerDay: number; direction: 'improving' | 'declining' | 'stable' };

export type DeclineResult =
  | { status: 'insufficient_data'; recentCount: number; baselineCount: number }
  | {
      status: 'ok' | 'decline';
      recentMean: number;
      baselineMean: number;
      baselineStd: number;
      drop: number;
      zScore: number;
    };

export type DeclineOptions = {
  recentDays?: number;
  baselineDays?: number;
  minRecent?: number;
  minBaseline?: number;
  minDrop?: number;
  zThreshold?: number;
};

const DAY = 86_400_000;
const round = (n: number, dp = 3) => Math.round(n * 10 ** dp) / 10 ** dp;

export function mean(xs: readonly number[]): number {
  return xs.length === 0 ? NaN : xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Sample standard deviation (n − 1). */
export function stdDev(xs: readonly number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1));
}

export function dailyAverages(points: readonly MoodPoint[], toLocalDate: (d: Date) => string): DailyMood[] {
  const buckets = new Map<string, number[]>();
  for (const p of points) {
    const k = toLocalDate(p.at);
    const arr = buckets.get(k) ?? [];
    arr.push(p.score);
    buckets.set(k, arr);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, xs]) => ({ date, average: round(mean(xs), 2), count: xs.length }));
}

/** Ordinary least-squares slope of score over time, in points per day. */
export function trend(points: readonly MoodPoint[], stableBand = 0.05): TrendResult {
  if (points.length < 3) return { slopePerDay: 0, direction: 'stable' };
  const t0 = points[0].at.getTime();
  const xs = points.map((p) => (p.at.getTime() - t0) / DAY);
  const ys = points.map((p) => p.score);
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const direction = slope > stableBand ? 'improving' : slope < -stableBand ? 'declining' : 'stable';
  return { slopePerDay: round(slope, 4), direction };
}

export function detectDecline(points: readonly MoodPoint[], now: Date, opts: DeclineOptions = {}): DeclineResult {
  const { recentDays = 3, baselineDays = 14, minRecent = 3, minBaseline = 5, minDrop = 1, zThreshold = -1.5 } = opts;
  const recentStart = now.getTime() - recentDays * DAY;
  const baselineStart = recentStart - baselineDays * DAY;

  const recent = points.filter((p) => p.at.getTime() >= recentStart && p.at <= now).map((p) => p.score);
  const baseline = points
    .filter((p) => p.at.getTime() >= baselineStart && p.at.getTime() < recentStart)
    .map((p) => p.score);

  if (recent.length < minRecent || baseline.length < minBaseline) {
    return { status: 'insufficient_data', recentCount: recent.length, baselineCount: baseline.length };
  }

  const recentMean = mean(recent);
  const baselineMean = mean(baseline);
  // Floor the std so a perfectly flat baseline does not turn a tiny dip into z = -∞.
  const baselineStd = Math.max(stdDev(baseline), 0.5);
  const drop = baselineMean - recentMean;
  // Standard error of the recent mean under the baseline distribution.
  const zScore = (recentMean - baselineMean) / (baselineStd / Math.sqrt(recent.length));

  return {
    status: drop >= minDrop && zScore <= zThreshold ? 'decline' : 'ok',
    recentMean: round(recentMean, 2),
    baselineMean: round(baselineMean, 2),
    baselineStd: round(baselineStd, 2),
    drop: round(drop, 2),
    zScore: round(zScore, 2),
  };
}
