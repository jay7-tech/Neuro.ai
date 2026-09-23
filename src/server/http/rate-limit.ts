/**
 * Token-bucket rate limiter.
 *
 * The store is an interface so the in-memory implementation (fine for one instance and
 * for tests) can be swapped for Redis in a multi-instance deployment without touching
 * any call site.
 */
export type RateLimitRule = {
  /** Bucket capacity: maximum burst. */
  capacity: number;
  /** Tokens added back per second. */
  refillPerSec: number;
};

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSec: number };

export interface RateLimitStore {
  take(key: string, rule: RateLimitRule, now?: number): RateLimitResult;
}

type Bucket = { tokens: number; updatedAt: number };

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly maxKeys = 50_000) {}

  take(key: string, rule: RateLimitRule, now = Date.now()): RateLimitResult {
    const prev = this.buckets.get(key);
    const elapsedSec = prev ? (now - prev.updatedAt) / 1000 : 0;
    const tokens = prev ? Math.min(rule.capacity, prev.tokens + elapsedSec * rule.refillPerSec) : rule.capacity;

    if (tokens < 1) {
      this.buckets.set(key, { tokens, updatedAt: now });
      return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((1 - tokens) / rule.refillPerSec) };
    }

    // Map preserves insertion order: delete+set moves the key to the end, so the first
    // key is always the least-recently-used one — an O(1) LRU eviction.
    this.buckets.delete(key);
    this.buckets.set(key, { tokens: tokens - 1, updatedAt: now });
    if (this.buckets.size > this.maxKeys) {
      const oldest = this.buckets.keys().next().value;
      if (oldest !== undefined) this.buckets.delete(oldest);
    }
    return { allowed: true, remaining: Math.floor(tokens - 1), retryAfterSec: 0 };
  }

  get size(): number {
    return this.buckets.size;
  }
}

export const RATE_LIMITS = {
  /** Default for authenticated API traffic. */
  api: { capacity: 120, refillPerSec: 2 },
  /** Credential endpoints: small burst, slow refill (≈ 5/min) to blunt credential stuffing. */
  auth: { capacity: 10, refillPerSec: 1 / 12 },
  /** LLM-backed endpoints cost real money per call. */
  ai: { capacity: 10, refillPerSec: 1 / 6 },
} satisfies Record<string, RateLimitRule>;

const g = globalThis as typeof globalThis & { __neuroRateLimiter?: RateLimitStore };
export function rateLimiter(): RateLimitStore {
  g.__neuroRateLimiter ??= new MemoryRateLimitStore();
  return g.__neuroRateLimiter;
}
