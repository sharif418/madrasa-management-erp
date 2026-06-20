// Simple SM-2-like spaced repetition for Hifz revision scheduling.
// strength 1 (weak) → 1 day; 2 → 2; 3 → 4; 4 → 7; 5 (strong) → 14 days.
// Each successful review (quality >= 3) bumps strength up by 1 (max 5);
// each weak review (quality < 3) drops strength by 1 (min 1).

const INTERVAL_DAYS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14,
};

export function clampStrength(n: number): number {
  return Math.max(1, Math.min(5, Math.trunc(n) || 3));
}

// Compute the next revision date given current strength + revision count.
export function computeNextRevision(
  strengthScore: number,
  _revisionCount = 0
): Date {
  const strength = clampStrength(strengthScore);
  const days = INTERVAL_DAYS[strength] ?? 4;
  const next = new Date();
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

// On a new review with given quality (1-5), return the updated strength score.
export function updateStrength(
  currentStrength: number,
  quality: number
): number {
  const q = Math.max(1, Math.min(5, Math.trunc(quality) || 3));
  const next = currentStrength + (q >= 3 ? 1 : -1);
  return clampStrength(next);
}

// Default strength inferred from a 1-5 quality rating (or null → 3).
export function strengthFromQuality(quality: number | null | undefined): number {
  if (quality == null) return 3;
  return clampStrength(quality);
}
