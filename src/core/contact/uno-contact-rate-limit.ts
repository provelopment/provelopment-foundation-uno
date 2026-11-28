/**
 * Foundation Uno — the contact abuse limiter (`U05`).
 *
 * WHAT THIS IS. One bounded, in-memory token bucket per caller key: a declared burst, a declared refill window, a declared
 * key ceiling and an injected clock. It is abuse protection for a public form, not an identity system: it stores no address,
 * no body and no identifier beyond the caller key a request already carries, and it never logs or echoes that key.
 *
 * BOUNDED, NOT UNBOUNDED. The map is capped: when it is full, the oldest idle bucket is evicted, so a flood of distinct keys
 * can never grow memory without limit. Eviction only ever *forgets* a bucket, which can never grant more than the burst.
 *
 * WHAT IT IS NOT. It is not authentication, not a WAF, not distributed and not persistent: several instances each hold their
 * own buckets, and a restart starts empty. It refuses a caller whose burst is spent and says nothing else about them.
 */

/** The declared limiter bounds. Each is a limit, not a default. */
export const UNO_CONTACT_RATE_LIMITS = Object.freeze({
  burst: 5,
  windowMs: 60_000,
  keys: 2048,
});

/** One caller's bucket. */
interface UnoContactBucket {
  /** Whole tokens available, never negative and never above the burst. */
  readonly tokens: number;
  /** When the bucket was last refilled, in epoch milliseconds. */
  readonly at: number;
}

/** The limiter's verdict: allowed with the burst left, or refused with no detail about the caller. */
export type UnoContactRateVerdict =
  | { readonly allowed: true; readonly remaining: number }
  | { readonly allowed: false; readonly retryAfterMs: number };

/**
 * Create one limiter bound to an injected clock.
 *
 * The clock is a parameter rather than `Date.now()` so the behaviour is deterministic under test and so no ambient time is
 * read inside a pure decision; a caller in a request path passes the real clock once.
 */
export function createUnoContactRateLimiter(now: () => number = Date.now) {
  const buckets = new Map<string, UnoContactBucket>();

  /** Take one token for `key`, refilling first and evicting the oldest idle bucket when the map is full. */
  return function take(key: string): UnoContactRateVerdict {
    if (typeof key !== "string" || key.length === 0) return { allowed: true, remaining: UNO_CONTACT_RATE_LIMITS.burst - 1 };
    const at = now();
    const existing = buckets.get(key);
    let tokens: number = UNO_CONTACT_RATE_LIMITS.burst;
    if (existing !== undefined) {
      const elapsed = at - existing.at;
      const refilled = elapsed <= 0 ? 0 : (elapsed / UNO_CONTACT_RATE_LIMITS.windowMs) * UNO_CONTACT_RATE_LIMITS.burst;
      tokens = Math.min(UNO_CONTACT_RATE_LIMITS.burst, existing.tokens + refilled);
    }

    if (tokens < 1) {
      const deficit = 1 - tokens;
      const retryAfterMs = Math.ceil((deficit / UNO_CONTACT_RATE_LIMITS.burst) * UNO_CONTACT_RATE_LIMITS.windowMs);
      buckets.set(key, { tokens, at });
      return { allowed: false, retryAfterMs };
    }

    if (existing === undefined && buckets.size >= UNO_CONTACT_RATE_LIMITS.keys) {
      // Evict the bucket that has been idle longest: bounded memory, and no caller can widen its own burst by flooding.
      let oldestKey: string | null = null;
      let oldestAt = Number.POSITIVE_INFINITY;
      for (const [candidate, bucket] of buckets) {
        if (bucket.at < oldestAt) {
          oldestAt = bucket.at;
          oldestKey = candidate;
        }
      }
      if (oldestKey !== null) buckets.delete(oldestKey);
    }

    buckets.set(key, { tokens: tokens - 1, at });
    return { allowed: true, remaining: Math.floor(tokens - 1) };
  };
}
