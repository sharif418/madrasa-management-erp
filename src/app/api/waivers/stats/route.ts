// Fee Waivers Stats API — total active waivers, total discount amount,
// by type breakdown, by class breakdown, top 5 students by discount.
// Tenant-scoped.
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";

// GET /api/waivers/stats
export const GET = withSession(async ({ session }) => {
  const rows = await db.feeWaiver.findMany({
    where: { tenantId: session.tenantId },
    include: {
      student: {
        select: {
          id: true, name: true,
          class: { select: { id: true, name: true } },
        },
      },
    },
  });

  const now = Date.now();
  const active = rows.filter((w) => !w.validUntil || new Date(w.validUntil).getTime() >= now);

  // By type breakdown
  const byType: Record<string, { count: number; totalPct: number; totalFixed: number }> = {};
  for (const w of rows) {
    if (!byType[w.type]) byType[w.type] = { count: 0, totalPct: 0, totalFixed: 0 };
    byType[w.type].count += 1;
    byType[w.type].totalPct += w.percentage || 0;
    byType[w.type].totalFixed += w.fixedAmount || 0;
  }

  // By class breakdown
  const byClass: Record<string, { count: number; totalPct: number; totalFixed: number }> = {};
  for (const w of rows) {
    const key = w.student.class?.name ?? "—";
    if (!byClass[key]) byClass[key] = { count: 0, totalPct: 0, totalFixed: 0 };
    byClass[key].count += 1;
    byClass[key].totalPct += w.percentage || 0;
    byClass[key].totalFixed += w.fixedAmount || 0;
  }

  // Total discount measure (fixed amounts + a "discount exposure" sum for percentage)
  const totalFixed = rows.reduce((acc, w) => acc + (w.fixedAmount || 0), 0);
  const totalPctSum = rows.reduce((acc, w) => acc + (w.percentage || 0), 0);
  const avgPct = rows.length > 0 ? totalPctSum / rows.length : 0;

  // Top 5 students by discount (fixed amount, else percentage as score)
  const topStudents = [...rows]
    .sort((a, b) => (b.fixedAmount + b.percentage) - (a.fixedAmount + a.percentage))
    .slice(0, 5)
    .map((w) => ({
      id: w.id,
      studentId: w.studentId,
      studentName: w.student.name,
      className: w.student.class?.name ?? null,
      type: w.type,
      discountType: w.discountType,
      percentage: w.percentage,
      fixedAmount: w.fixedAmount,
    }));

  return ok({
    totalActive: active.length,
    totalAll: rows.length,
    totalFixed,
    avgPct,
    uniqueStudents: new Set(rows.map((w) => w.studentId)).size,
    byType,
    byClass,
    topStudents,
  });
});
