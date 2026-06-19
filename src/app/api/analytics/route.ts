// Analytics & Insights API — comprehensive tenant-wide analytics
// GET /api/analytics — predictive analytics + trends dashboard
// All queries scope by session.tenantId. Parallel via Promise.all.
// Cached in-memory for 60 seconds per tenant (cacheInvalidate("analytics:") on mutations).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api";
import { getSession } from "@/lib/session";
import { cacheWrap, TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date): string {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(d);
  } catch {
    return monthKey(d);
  }
}
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function gradeFor(avg: number): string {
  if (avg >= 90) return "A+";
  if (avg >= 80) return "A";
  if (avg >= 70) return "B";
  if (avg >= 60) return "C";
  if (avg >= 50) return "D";
  return "F";
}

async function computeAnalytics(tenantId: string) {
  const now = new Date();

  // 6-month window for monthly trends; 30-day window for attendance trend
  const m6Start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const d30Start = startOfDay(new Date(now.getTime() - 29 * 24 * 3600 * 1000));

  const [
    students,
    teachers,
    hifz6m,
    attendance30d,
    feeAll,
    transactions6m,
    funds,
    examResults,
    activeStudentIds,
  ] = await Promise.all([
    db.student.findMany({
      where: { tenantId },
      select: { id: true, name: true, admissionDate: true, isActive: true },
    }),
    db.teacher.count({ where: { tenantId, isActive: true } }),
    db.hifzRecord.findMany({
      where: { tenantId, recordedAt: { gte: m6Start } },
      select: { qualityRating: true, recordedAt: true, status: true, studentId: true },
    }),
    db.attendance.findMany({
      where: { tenantId, personType: "student", date: { gte: d30Start } },
      select: { date: true, status: true, personId: true },
    }),
    db.feeCollection.findMany({
      where: { tenantId },
      select: { amount: true, paidAmount: true, status: true, dueDate: true },
    }),
    db.transaction.findMany({
      where: { tenantId, date: { gte: m6Start } },
      select: { amount: true, type: true, date: true, fundId: true },
    }),
    db.fund.findMany({
      where: { tenantId },
      select: { id: true, name: true, type: true, balance: true },
    }),
    db.examResult.findMany({
      where: { exam: { tenantId } },
      select: { marks: true, total: true, grade: true, studentId: true, subject: true },
    }),
    db.student.findMany({
      where: { tenantId, isActive: true },
      select: { id: true },
    }),
  ]);

  const activeIds = new Set(activeStudentIds.map((s) => s.id));

  // Helper: last 6 months boundaries (start/end pairs) — shared by monthly aggregations
  const months6 = Array.from({ length: 6 }, (_, idx) => {
    const i = 5 - idx;
    return {
      start: new Date(now.getFullYear(), now.getMonth() - i, 1),
      end: new Date(now.getFullYear(), now.getMonth() - i + 1, 1),
      label: monthLabel(new Date(now.getFullYear(), now.getMonth() - i, 1)),
    };
  });

  // ----- Enrollment trend (last 6 months admission counts) -----
  const enrollmentTrend = months6.map((m) => ({
    month: m.label,
    count: students.filter((s) => s.admissionDate >= m.start && s.admissionDate < m.end).length,
  }));

  // ----- Hifz performance (avg quality per month + completion rate) -----
  const hifzPerformance = months6.map((m) => {
    const rows = hifz6m.filter(
      (r) => r.recordedAt >= m.start && r.recordedAt < m.end && r.qualityRating != null
    );
    const quality = rows.length > 0
      ? Math.round((rows.reduce((s, r) => s + (r.qualityRating ?? 0), 0) / rows.length) * 10) / 10
      : 0;
    return { month: m.label, quality };
  });
  const completedCount = hifz6m.filter((r) => r.status === "completed").length;
  const hifzCompletionRate = hifz6m.length > 0 ? Math.round((completedCount / hifz6m.length) * 100) : 0;
  const ratedRows = hifz6m.filter((r) => r.qualityRating != null);
  const hifzAvgQuality = ratedRows.length > 0
    ? Math.round((ratedRows.reduce((s, r) => s + (r.qualityRating ?? 0), 0) / ratedRows.length) * 10) / 10
    : 0;

  // ----- Attendance trend (30-day rate) -----
  const attendanceTrend = Array.from({ length: 30 }, (_, idx) => {
    const i = 29 - idx;
    const day = startOfDay(new Date(now.getTime() - i * 24 * 3600 * 1000));
    const next = new Date(day.getTime() + 24 * 3600 * 1000);
    const dayRows = attendance30d.filter((a) => a.date >= day && a.date < next);
    const present = dayRows.filter((a) => a.status === "present" || a.status === "late").length;
    return {
      date: day.toISOString(),
      label: new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(day),
      rate: dayRows.length === 0 ? 0 : Math.round((present / dayRows.length) * 100),
    };
  });
  const avgAttendance = attendance30d.length > 0
    ? Math.round(
        (attendance30d.filter((a) => a.status === "present" || a.status === "late").length /
          attendance30d.length) * 100
      )
    : 0;

  // ----- Finance trend (6-month income vs expense) -----
  const financeTrend = months6.map((m) => {
    const tx = transactions6m.filter((t) => t.date >= m.start && t.date < m.end);
    return {
      month: m.label,
      income: tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  // ----- Fee collection rate + pending amount -----
  const totalFees = feeAll.reduce((s, f) => s + f.amount, 0);
  const collected = feeAll.reduce((s, f) => s + f.paidAmount, 0);
  const pending = Math.max(0, totalFees - collected);
  const collectionRate = totalFees > 0 ? Math.round((collected / totalFees) * 100) : 0;

  // ----- Top performers (top 5 by avg exam marks) -----
  const byStudent = new Map<string, { marks: number; total: number }>();
  for (const r of examResults) {
    if (!activeIds.has(r.studentId)) continue;
    const cur = byStudent.get(r.studentId) ?? { marks: 0, total: 0 };
    cur.marks += r.marks;
    cur.total += r.total;
    byStudent.set(r.studentId, cur);
  }
  const topPerformers = Array.from(byStudent.entries())
    .map(([id, agg]) => {
      const student = students.find((s) => s.id === id);
      const avg = agg.total > 0 ? Math.round((agg.marks / agg.total) * 1000) / 10 : 0;
      return { id, name: student?.name ?? "—", avg, grade: gradeFor(avg) };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  // ----- At-risk students (attendance < 60% or hifz quality < 3, max 5) -----
  const attByStudent = new Map<string, { present: number; total: number }>();
  for (const a of attendance30d) {
    if (!activeIds.has(a.personId)) continue;
    const cur = attByStudent.get(a.personId) ?? { present: 0, total: 0 };
    cur.total += 1;
    if (a.status === "present" || a.status === "late") cur.present += 1;
    attByStudent.set(a.personId, cur);
  }
  const hifzByStudent = new Map<string, { sum: number; count: number }>();
  for (const r of hifz6m) {
    if (!activeIds.has(r.studentId) || r.qualityRating == null) continue;
    const cur = hifzByStudent.get(r.studentId) ?? { sum: 0, count: 0 };
    cur.sum += r.qualityRating;
    cur.count += 1;
    hifzByStudent.set(r.studentId, cur);
  }
  const atRiskStudents: { id: string; name: string; reasons: string[] }[] = [];
  for (const student of students.filter((s) => s.isActive)) {
    const reasons: string[] = [];
    const att = attByStudent.get(student.id);
    if (att && att.total >= 3 && (att.present / att.total) * 100 < 60) reasons.push("attendance");
    const hifz = hifzByStudent.get(student.id);
    if (hifz && hifz.count > 0 && hifz.sum / hifz.count < 3) reasons.push("quality");
    if (reasons.length > 0) atRiskStudents.push({ id: student.id, name: student.name, reasons });
    if (atRiskStudents.length >= 5) break;
  }

  // ----- Fund health (balance + runway months = balance / avg monthly expense) -----
  const avgMonthlyExpense =
    financeTrend.length > 0 ? financeTrend.reduce((s, m) => s + m.expense, 0) / financeTrend.length : 0;
  const fundHealth = funds.map((f) => {
    const runway = avgMonthlyExpense > 0 ? Math.floor(f.balance / avgMonthlyExpense) : 0;
    return {
      id: f.id, name: f.name, type: f.type, balance: f.balance, runwayMonths: runway,
      status: runway >= 6 ? "healthy" : runway >= 3 ? "stable" : "watch",
    };
  });

  return {
    kpis: {
      totalStudents: students.filter((s) => s.isActive).length,
      totalTeachers: teachers,
      avgAttendance,
      hifzQuality: hifzAvgQuality,
      hifzCompletionRate,
      collectionRate,
      pendingAmount: pending,
    },
    enrollmentTrend,
    hifzPerformance,
    attendanceTrend,
    financeTrend,
    topPerformers,
    atRiskStudents,
    fundHealth,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const { tenantId } = session;

  // Read-through cache: 60s TTL, per-tenant key isolation.
  const data = await cacheWrap(
    `analytics:${tenantId}`,
    TTL.ANALYTICS,
    () => computeAnalytics(tenantId)
  );

  // `Cache-Control: no-store` — only the server-side cache should serve fresh data.
  return NextResponse.json(
    { ok: true, data },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
