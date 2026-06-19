// GET /api/dashboard — aggregated tenant stats for the dashboard home screen
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ok, unauthorized } from "@/lib/api";

const FUND_TYPES = ["general", "lillah", "waqf", "zakat", "sadaqah"] as const;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }).format(d);
  } catch {
    return monthKey(d);
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const { tenantId } = session;
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const d7 = startOfDay(new Date(now.getTime() - 6 * 24 * 3600 * 1000));

  // Parallel aggregations — all filtered by tenantId for row-level isolation
  const [
    studentAgg,
    hafizCount,
    teacherCount,
    funds,
    recentHifz,
    recentNotices,
    attendance7d,
    feeCollections6m,
  ] = await Promise.all([
    db.student.aggregate({
      where: { tenantId },
      _count: { _all: true },
    }),
    db.hifzRecord.count({ where: { tenantId, recordedAt: { gte: d30 } } }),
    db.teacher.count({ where: { tenantId } }),
    db.fund.findMany({ where: { tenantId }, select: { type: true, balance: true } }),
    db.hifzRecord.findMany({
      where: { tenantId },
      orderBy: { recordedAt: "desc" },
      take: 5,
      select: {
        id: true, type: true, paraNumber: true, qualityRating: true, recordedAt: true,
        student: { select: { name: true } },
      },
    }),
    db.notice.findMany({
      where: { tenantId },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: { id: true, title: true, type: true, publishedAt: true },
    }),
    db.attendance.findMany({
      where: { tenantId, date: { gte: d7 } },
      select: { date: true, status: true },
    }),
    db.feeCollection.findMany({
      where: { tenantId, paidDate: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
      select: { paidAmount: true, paidDate: true },
    }),
  ]);

  // Students: total + active + hafiz (hafiz is boolean flag — count via separate query if needed)
  const [activeStudents, hafizStudents] = await Promise.all([
    db.student.count({ where: { tenantId, isActive: true } }),
    db.student.count({ where: { tenantId, isHafiz: true } }),
  ]);

  // Funds: total balance + breakdown by type
  const fundBreakdown = FUND_TYPES.map((type) => ({
    type,
    balance: funds.filter((f) => f.type === type).reduce((s, f) => s + (f.balance || 0), 0),
  }));
  const totalFunds = fundBreakdown.reduce((s, f) => s + f.balance, 0);

  // Weekly attendance: build last 7 days buckets with present/total rate
  const dayBuckets: { date: string; present: number; total: number; rate: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(new Date(now.getTime() - i * 24 * 3600 * 1000));
    const next = new Date(day.getTime() + 24 * 3600 * 1000);
    const dayRecords = attendance7d.filter(
      (a) => a.date >= day && a.date < next
    );
    const present = dayRecords.filter((a) => a.status === "present" || a.status === "late").length;
    const total = dayRecords.length;
    dayBuckets.push({
      date: day.toISOString(),
      present,
      total,
      rate: total === 0 ? 0 : Math.round((present / total) * 100),
    });
  }

  // Fee collection: group by month for last 6 months
  const locale = "en";
  const feeMonthly: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const sum = feeCollections6m
      .filter((f) => f.paidDate && f.paidDate >= mStart && f.paidDate < mEnd)
      .reduce((s, f) => s + (f.paidAmount || 0), 0);
    feeMonthly.push({ month: monthLabel(mStart, locale), amount: sum });
  }

  return ok({
    students: {
      total: studentAgg._count._all,
      active: activeStudents,
      hafiz: hafizStudents,
    },
    teachers: teacherCount,
    funds: { total: totalFunds, breakdown: fundBreakdown },
    hifz30d: hafizCount,
    attendance: { days: dayBuckets },
    recentHifz: recentHifz.map((r) => ({
      id: r.id,
      studentName: r.student?.name ?? "—",
      type: r.type,
      paraNumber: r.paraNumber,
      qualityRating: r.qualityRating,
      recordedAt: r.recordedAt,
    })),
    recentNotices: recentNotices.map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      publishedAt: n.publishedAt,
    })),
    feeMonthly,
  });
}
