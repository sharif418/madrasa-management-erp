// Quran Log Stats API — 30-day daily pages read, top readers, class breakdown,
// khatm completions. Tenant-scoped.
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";

// GET /api/quranlog/stats
export const GET = withSession(async ({ session }) => {
  const since = new Date();
  since.setDate(since.getDate() - 29); // include today + 29 prior days = 30 days
  const sinceStart = new Date(since);
  sinceStart.setHours(0, 0, 0, 0);

  const rows = await db.quranLog.findMany({
    where: { tenantId: session.tenantId, date: { gte: sinceStart } },
    include: {
      student: {
        select: {
          id: true, name: true,
          class: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Daily buckets for 30-day chart
  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of rows) {
    const key = r.date.toISOString().slice(0, 10);
    if (key in dailyMap) dailyMap[key] += r.pagesRead;
  }
  const daily = Object.entries(dailyMap).map(([date, pages]) => ({ date, pages }));

  // Top 5 readers by total pages in window
  const perStudent: Record<string, { studentId: string; studentName: string; className: string | null; total: number }> = {};
  for (const r of rows) {
    const key = r.studentId;
    if (!perStudent[key]) {
      perStudent[key] = {
        studentId: r.studentId,
        studentName: r.student.name,
        className: r.student.class?.name ?? null,
        total: 0,
      };
    }
    perStudent[key].total += r.pagesRead;
  }
  const topReaders = Object.values(perStudent)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Class breakdown
  const perClass: Record<string, number> = {};
  for (const r of rows) {
    const k = r.student.class?.name ?? "—";
    perClass[k] = (perClass[k] || 0) + r.pagesRead;
  }
  const classBreakdown = Object.entries(perClass)
    .map(([name, pages]) => ({ name, pages }))
    .sort((a, b) => b.pages - a.pages);

  // Khatm completions in last 365 days (>= 604 pages)
  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 365);
  const yearly = await db.quranLog.findMany({
    where: { tenantId: session.tenantId, date: { gte: yearAgo } },
    select: { studentId: true, pagesRead: true },
  });
  const yrPerStudent: Record<string, number> = {};
  for (const r of yearly) yrPerStudent[r.studentId] = (yrPerStudent[r.studentId] || 0) + r.pagesRead;
  const khatmCompletions = Object.values(yrPerStudent).filter((n) => n >= 604).length;

  return ok({
    daily,
    topReaders,
    classBreakdown,
    khatmCompletions,
    totalPages: rows.reduce((a, r) => a + r.pagesRead, 0),
    activeReaders: Object.keys(perStudent).length,
  });
});
