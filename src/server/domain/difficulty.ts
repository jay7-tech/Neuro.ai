/**
 * Adaptive difficulty for cognitive games.
 *
 * This used to be an LLM call. It is now a deterministic, testable policy because the
 * decision has to be consistent, explainable to clinicians, and free: an LLM that
 * promotes a frustrated patient on a whim is a product bug, not a feature.
 *
 *   performance = 0.60·accuracy + 0.25·speed + 0.15·(1 − mistakeRate)     ∈ [0, 1]
 *
 * Promotion needs sustained success (last 3 sessions ≥ 0.80); demotion reacts faster
 * (last 2 sessions ≤ 0.45). The asymmetry is deliberate: for this population,
 * frustration costs more than boredom.
 */

export type Level = 'easy' | 'medium' | 'hard';
export type Game = 'memory_match' | 'color_match' | 'sequence_memory' | 'word_scramble';

const LEVELS: readonly Level[] = ['easy', 'medium', 'hard'];

/** Expected completion time for a comfortable round, per game and level. */
export const TARGET_DURATION_MS: Record<Game, Record<Level, number>> = {
  memory_match: { easy: 60_000, medium: 90_000, hard: 120_000 },
  color_match: { easy: 30_000, medium: 45_000, hard: 60_000 },
  sequence_memory: { easy: 45_000, medium: 60_000, hard: 90_000 },
  word_scramble: { easy: 60_000, medium: 90_000, hard: 120_000 },
};

export const PROMOTE_THRESHOLD = 0.8;
export const DEMOTE_THRESHOLD = 0.45;
export const PROMOTE_WINDOW = 3;
export const DEMOTE_WINDOW = 2;

export type SessionResult = {
  game: Game;
  difficulty: Level;
  score: number;
  maxScore: number;
  mistakes: number;
  durationMs: number;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function performance(r: SessionResult): number {
  if (r.maxScore <= 0) return 0;
  const accuracy = clamp01(r.score / r.maxScore);
  const speed = clamp01(TARGET_DURATION_MS[r.game][r.difficulty] / Math.max(r.durationMs, 1));
  const mistakeRate = r.mistakes / (r.maxScore + r.mistakes);
  return Math.round((0.6 * accuracy + 0.25 * speed + 0.15 * (1 - mistakeRate)) * 1000) / 1000;
}

export type Recommendation = {
  level: Level;
  change: 'promote' | 'demote' | 'hold';
  reason: 'sustained_success' | 'struggling' | 'not_enough_sessions' | 'mixed_results' | 'at_boundary';
  message: string;
};

const MESSAGES: Record<Recommendation['change'], string> = {
  promote: "You're doing wonderfully! Let's try something a little more challenging.",
  demote: "That was a good workout. Let's try a level that feels a bit more comfortable.",
  hold: 'Great job! Shall we play another round at this level?',
};

/**
 * @param recent performance scores at the *current* level, most recent first.
 */
export function recommend(current: Level, recent: readonly number[]): Recommendation {
  const idx = LEVELS.indexOf(current);
  const build = (level: Level, change: Recommendation['change'], reason: Recommendation['reason']) => ({
    level,
    change,
    reason,
    message: MESSAGES[change],
  });

  const lastDemote = recent.slice(0, DEMOTE_WINDOW);
  if (lastDemote.length === DEMOTE_WINDOW && lastDemote.every((p) => p <= DEMOTE_THRESHOLD)) {
    return idx > 0 ? build(LEVELS[idx - 1], 'demote', 'struggling') : build(current, 'hold', 'at_boundary');
  }

  const lastPromote = recent.slice(0, PROMOTE_WINDOW);
  if (lastPromote.length < PROMOTE_WINDOW) return build(current, 'hold', 'not_enough_sessions');
  if (lastPromote.every((p) => p >= PROMOTE_THRESHOLD)) {
    return idx < LEVELS.length - 1
      ? build(LEVELS[idx + 1], 'promote', 'sustained_success')
      : build(current, 'hold', 'at_boundary');
  }
  return build(current, 'hold', 'mixed_results');
}
