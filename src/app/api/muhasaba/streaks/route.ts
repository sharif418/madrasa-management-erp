// GET /api/muhasaba/streaks?studentId= — streak data
// Per-student: personal streaks + badges
// Tenant-wide: top 5 by current streak, avg, distribution
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";
import { computeStreaks, type StreakStats } from "@/lib/streaks";

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId") || undefined;
  const tenantId = session.tenantId;

  if (studentId) {
    // Personal streaks
    const student = await db.student.findFirst({
      where: { id: studentId, tenantId },
      select: { id: true, name: true, rollNo: true },
    });
    if (!student) return ok({ personal: null });

    const records = await db.muhasabaRecord.findMany({
      where: { studentId, tenantId },
      orderBy: { date: "asc" },
      select: { date: true },
    });

    const stats: StreakStats = computeStreaks(records);
    return ok({
      personal: {
        student,
        ...stats,
      },
    });
  }

  // Tenant-wide leaderboard: compute streaks for all students with records
  const students = await db.student.findMany({
    where: { tenantId, isActive: true },
    select: {
      id: true, name: true, rollNo: true,
      muhasabaRecords: { select: { date: true }, orderBy: { date: "asc" } },
    },
  });

  const ranked = students
    .map((s) => {
      const stats = computeStreaks(s.muhasabaRecords);
      return {
        student: { id: s.id, name: s.name, rollNo: s.rollNo },
        ...stats,
      };
    })
    .filter((r) => r.longestStreak > 0)
    .sort((a, b) => b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak)
    .slice(0, 5);

  const allWithStreaks = students.map((s) => computeStreaks(s.muhasabaRecords));
  const avgCurrent = allWithStreaks.length
    ? Math.round(
        (allWithStreaks.reduce((sum, s) => sum + s.currentStreak, 0) / allWithStreaks.length) * 10
      ) / 10
    : 0;
  const avgLongest = allWithStreaks.length
    ? Math.round(
        (allWithStreaks.reduce((sum, s) => sum + s.longestStreak, 0) / allWithStreaks.length) * 10
      ) / 10
    : 0;

  const distribution = {
    "0": allWithStreaks.filter((s) => s.currentStreak === 0).length,
    "1-6": allWithStreaks.filter((s) => s.currentStreak >= 1 && s.currentStreak < 7).length,
    "7-29": allWithStreaks.filter((s) => s.currentStreak >= 7 && s.currentStreak < 30).length,
    "30+": allWithStreaks.filter((s) => s.currentStreak >= 30).length,
  };

  return ok({
    leaderboard: ranked,
    summary: { avgCurrentStreak: avgCurrent, avgLongestStreak: avgLongest, totalStudents: students.length },
    distribution,
  });
});
