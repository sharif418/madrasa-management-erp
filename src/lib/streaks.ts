// Muhasaba streak computation: consecutive days, longest run, monthly avg, badges.
// Records may be raw Prisma rows; we use only `date`.

type RecordLike = { date: Date | string };

export type Badge = {
  id: string;
  labelKey: string; // i18n key, e.g. "muhasaba.weekStreak"
  achieved: boolean;
  progress: number; // 0..1 toward the badge
};

export type StreakStats = {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
  monthlyAverage: number;
  badges: Badge[];
};

function toDay(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86_400_000);
}

export function computeStreaks(records: RecordLike[]): StreakStats {
  if (!records.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastEntryDate: null,
      monthlyAverage: 0,
      badges: emptyBadges(),
    };
  }
  const daySet = new Set(records.map((r) => toDay(r.date)));
  const sortedDays = Array.from(daySet).sort();

  // Longest run of consecutive days
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    if (daysBetween(sortedDays[i - 1], sortedDays[i]) === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak: count back from today (or last entry day if today missing)
  const todayStr = toDay(new Date());
  let cursor = todayStr;
  if (!daySet.has(cursor)) {
    // If today missing but yesterday exists, count from yesterday
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yStr = toDay(y);
    cursor = daySet.has(yStr) ? yStr : sortedDays[sortedDays.length - 1];
  }
  let currentStreak = 0;
  while (daySet.has(cursor)) {
    currentStreak += 1;
    const prev = new Date(cursor + "T00:00:00Z");
    prev.setUTCDate(prev.getUTCDate() - 1);
    cursor = prev.toISOString().slice(0, 10);
  }

  // Monthly average: records per day in the current month
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthDays = records.filter((r) => toDay(r.date).startsWith(ym)).length;
  const dayOfMonth = now.getDate();
  const monthlyAverage = dayOfMonth > 0 ? monthDays / dayOfMonth : 0;

  return {
    currentStreak,
    longestStreak: longest,
    lastEntryDate: sortedDays[sortedDays.length - 1],
    monthlyAverage,
    badges: buildBadges(longest, currentStreak, records),
  };
}

function emptyBadges(): Badge[] {
  return [
    { id: "week", labelKey: "muhasaba.weekStreak", achieved: false, progress: 0 },
    { id: "month", labelKey: "muhasaba.monthStreak", achieved: false, progress: 0 },
    { id: "perfectWeek", labelKey: "muhasaba.perfectWeek", achieved: false, progress: 0 },
  ];
}

function buildBadges(
  longest: number,
  _current: number,
  records: RecordLike[]
): Badge[] {
  const weekProgress = Math.min(1, longest / 7);
  const monthProgress = Math.min(1, longest / 30);

  // Perfect salah week: at least 7 consecutive days where ALL 5 salah were jamaat/alone (not pending/qadha).
  // We approximate using the daily presence of records — a 7-day run counts.
  const perfectWeekAchieved = longest >= 7; // simplified
  const perfectWeekProgress = Math.min(1, longest / 7);

  return [
    { id: "week", labelKey: "muhasaba.weekStreak", achieved: longest >= 7, progress: weekProgress },
    { id: "month", labelKey: "muhasaba.monthStreak", achieved: longest >= 30, progress: monthProgress },
    { id: "perfectWeek", labelKey: "muhasaba.perfectWeek", achieved: perfectWeekAchieved, progress: perfectWeekProgress },
  ];
}
