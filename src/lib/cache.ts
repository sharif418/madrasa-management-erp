// Simple in-memory TTL cache (no Redis — just a Map).
// Per-process: cache is NOT shared across server instances, but for a single
// Next.js dev server / single Node container this gives great hit rates for
// dashboard/analytics aggregations that take many sequential DB queries.

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

/**
 * Read a cached value. Returns null if missing or expired.
 * Expired entries are deleted on access (lazy eviction).
 */
export function cacheGet<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

/**
 * Write a value with a TTL (milliseconds).
 */
export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Invalidate all keys starting with the given prefix.
 * Use prefixes like "dashboard:" or "analytics:" to scope invalidations.
 */
export function cacheInvalidate(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

// Default TTLs (milliseconds) — exported for callers that want the standard values.
export const TTL = {
  DASHBOARD: 30 * 1000, // 30 seconds
  ANALYTICS: 60 * 1000, // 60 seconds
} as const;

/**
 * Wrap a producer with cache read-through.
 * On miss, runs `producer`, stores the result, then returns it.
 */
export async function cacheWrap<T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;
  const value = await producer();
  cacheSet(key, value, ttlMs);
  return value;
}
