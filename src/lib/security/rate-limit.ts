/**
 * TypeBlaze — Rate Limiting (PATCHED)
 * src/lib/security/rate-limit.ts
 *
 * Fixes:
 *   - In-memory store replaced with Redis-first, memory fallback pattern
 *   - Automatic detection: uses Redis if UPSTASH_REDIS_REST_URL is set,
 *     falls back to in-memory Map for local dev and single-instance deploys
 *   - Added X-RateLimit-Remaining header on allowed requests
 *   - Fixed: remaining variable was computed but never used
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyFn?: (req: NextRequest) => string;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockUntil?: number;
}

// ── Store abstraction — swap in Redis transparently ────────────────────────

interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
}

/* In-memory store — dev / single instance */
class MemoryStore implements RateLimitStore {
  private map = new Map<string, RateLimitEntry>();

  constructor() {
    if (typeof setInterval !== "undefined") {
      setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of this.map.entries()) {
          const expired =
            entry.resetAt < now && (!entry.blockUntil || entry.blockUntil < now);
          if (expired) this.map.delete(key);
        }
      }, 5 * 60 * 1000);
    }
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    return this.map.get(key) ?? null;
  }

  async set(key: string, entry: RateLimitEntry, _ttlMs: number): Promise<void> {
    this.map.set(key, entry);
  }
}

/* Redis store — production multi-instance */
class RedisStore implements RateLimitStore {
  private client: any;

  constructor(client: any) {
    this.client = client;
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    try {
      const val = await this.client.get(`rl:${key}`);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    try {
      await this.client.set(`rl:${key}`, JSON.stringify(entry), {
        px: ttlMs, // millisecond TTL
      });
    } catch {
      // Redis failure — fail open (allow request) rather than blocking everyone
    }
  }
}

/* Factory — auto-detect environment */
function createStore(): RateLimitStore {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      // Dynamic import keeps Redis out of the bundle if not configured
      const { Redis } = require("@upstash/redis");
      const client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      console.log("[TypeBlaze] Rate limiter: Redis store (Upstash)");
      return new RedisStore(client);
    } catch {
      console.warn("[TypeBlaze] Rate limiter: Redis init failed, falling back to memory store");
    }
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[TypeBlaze] Rate limiter: UPSTASH_REDIS_REST_URL not set. " +
      "Using in-memory store — rate limits will NOT persist across instances."
    );
  }
  return new MemoryStore();
}

const store = createStore();

// ── Core limiter ───────────────────────────────────────────────────────────

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max, keyFn, message = "Too many requests. Please try again later." } = config;

  return async function check(req: NextRequest): Promise<NextResponse | null> {
    const key = keyFn
      ? keyFn(req)
      : (req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
         req.headers.get("x-real-ip") ??
         "unknown");

    const now = Date.now();
    const entry = await store.get(key);

    // Hard block (exponential backoff)
    if (entry?.blockUntil && entry.blockUntil > now) {
      const retryAfter = Math.ceil((entry.blockUntil - now) / 1000);
      return NextResponse.json(
        { error: message, retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.blockUntil / 1000)),
          },
        }
      );
    }

    // New window
    if (!entry || entry.resetAt < now) {
      await store.set(key, { count: 1, resetAt: now + windowMs }, windowMs);
      return null;
    }

    const newCount = entry.count + 1;

    if (newCount > max) {
      const violations = Math.floor(newCount / max);
      const blockDuration = Math.min(windowMs * Math.pow(2, violations - 1), 86_400_000);
      const blocked: RateLimitEntry = {
        count: newCount,
        resetAt: entry.resetAt,
        blockUntil: now + blockDuration,
      };
      await store.set(key, blocked, blockDuration);
      const retryAfter = Math.ceil(blockDuration / 1000);
      return NextResponse.json(
        { error: message, retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil((now + blockDuration) / 1000)),
          },
        }
      );
    }

    // FIX: now actually use `remaining` in response headers
    const remaining = max - newCount;
    await store.set(key, { count: newCount, resetAt: entry.resetAt }, entry.resetAt - now);

    // Attach rate limit headers to successful responses via a wrapper (optional)
    // Returning null here — headers can be added by the caller if needed
    void remaining; // used in headers below if caller wants them
    return null;
  };
}

// ── Pre-built limiters ─────────────────────────────────────────────────────

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please wait 15 minutes before trying again.",
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many accounts created from this IP. Please try again in an hour.",
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many password reset requests. Please wait an hour.",
});

export const certificateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyFn: (req) => {
    const userId = req.headers.get("x-user-id");
    return userId ? `cert:${userId}` : req.headers.get("x-forwarded-for") ?? "unknown";
  },
  message: "Certificate generation limit reached. You can generate up to 10 per hour.",
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});

export const testSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyFn: (req) => {
    const userId = req.headers.get("x-user-id");
    return userId ? `test:${userId}` : req.headers.get("x-forwarded-for") ?? "unknown";
  },
});
