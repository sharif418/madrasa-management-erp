// In-memory sliding window rate limiter — no external deps.
// Rate limits by IP + endpoint key.

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 } as RateLimitConfig,   // 10 per 15 min
  signup: { windowMs: 60 * 60 * 1000, maxRequests: 5 } as RateLimitConfig,   // 5 per hour
  api: { windowMs: 60 * 1000, maxRequests: 120 } as RateLimitConfig,          // 120 per minute
  upload: { windowMs: 60 * 1000, maxRequests: 10 } as RateLimitConfig,        // 10 per minute
} as const;

/**
 * Check if a request is rate limited.
 * Returns null if allowed, or a remaining-seconds number if blocked.
 */
export function checkRateLimit(
  req: Request,
  preset: keyof typeof RATE_LIMITS
): number | null {
  const config = RATE_LIMITS[preset];
  const ip =
    (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const key = `${preset}:${ip}`;
  const now = Date.now();
  const cutoff = now - config.windowMs;

  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0]!;
    const retryAfterSec = Math.ceil((oldestInWindow + config.windowMs - now) / 1000);
    return retryAfterSec;
  }

  entry.timestamps.push(now);
  return null;
}
