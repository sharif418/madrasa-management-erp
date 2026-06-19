// AI context — gathers tenant-aware data snapshot for the LLM.
// Used by /api/ai (chat) and /api/ai/insights (auto insights).
// All queries filter by tenantId from the session.
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";

export type AiContext = {
  tenantName: string;
  currency: string;
  hijriToday: string;
  students: { total: number; zakatEligible: number; hafiz: number; active: number };
  teachers: { total: number; active: number };
  classes: number;
  funds: { total: number; byType: Record<string, number> };
  hifz: { records30d: number; avgQuality: number; byType: Record<string, number> };
  attendance: { rate7d: number; present: number; total: number };
  fees: { collected30d: number; pending: number; overdue: number; partial: number };
  recentActivities: { action: string; module: string; entityName: string | null; createdAt: string }[];
  upcomingEvents: { title: string; type: string; startDate: string }[];
};

function toHijri(d: Date, locale = "en"): string {
  try {
    return new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
      day: "numeric", month: "long", year: "numeric",
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
  }
}

export async function gatherAiContext(session: SessionUser, locale = "en"): Promise<AiContext> {
  const tid = session.tenantId;
  const now = new Date();
  const d7 = new Date(); d7.setDate(now.getDate() - 7);
  const d30 = new Date(); d30.setDate(now.getDate() - 30);

  const [
    tenant, studentTotal, studentActive, studentZakat, studentHafiz,
    teacherTotal, teacherActive, classCount, funds,
    hifz30d, att7d, feesPaid30d, feesPending, feesOverdue, feesPartial,
    activities, events,
  ] = await Promise.all([
    db.tenant.findUnique({ where: { id: tid }, select: { name: true, currency: true } }),
    db.student.count({ where: { tenantId: tid } }),
    db.student.count({ where: { tenantId: tid, isActive: true } }),
    db.student.count({ where: { tenantId: tid, isZakatEligible: true } }),
    db.student.count({ where: { tenantId: tid, isHafiz: true } }),
    db.teacher.count({ where: { tenantId: tid } }),
    db.teacher.count({ where: { tenantId: tid, isActive: true } }),
    db.class.count({ where: { tenantId: tid } }),
    db.fund.findMany({ where: { tenantId: tid }, select: { type: true, balance: true, name: true } }),
    db.hifzRecord.findMany({
      where: { tenantId: tid, recordedAt: { gte: d30 } },
      select: { type: true, qualityRating: true },
    }),
    db.attendance.findMany({
      where: { tenantId: tid, date: { gte: d7 } },
      select: { status: true },
    }),
    db.feeCollection.findMany({
      where: { tenantId: tid, paidDate: { gte: d30 } },
      select: { paidAmount: true },
    }),
    db.feeCollection.aggregate({
      where: { tenantId: tid, status: "pending" },
      _sum: { amount: true },
    }),
    db.feeCollection.aggregate({
      where: { tenantId: tid, status: "overdue" },
      _sum: { amount: true },
    }),
    db.feeCollection.aggregate({
      where: { tenantId: tid, status: "partial" },
      _sum: { amount: true },
    }),
    db.auditLog.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { action: true, module: true, entityName: true, createdAt: true },
    }),
    db.calendarEvent.findMany({
      where: { tenantId: tid, startDate: { gte: now } },
      orderBy: { startDate: "asc" },
      take: 3,
      select: { title: true, type: true, startDate: true },
    }),
  ]);

  // Funds breakdown by type
  const fundsByType: Record<string, number> = {};
  let fundsTotal = 0;
  for (const f of funds) {
    fundsByType[f.type] = (fundsByType[f.type] || 0) + f.balance;
    fundsTotal += f.balance;
  }

  // Hifz breakdown by type
  const hifzByType: Record<string, number> = {};
  let hifzSum = 0, hifzRated = 0;
  for (const h of hifz30d) {
    hifzByType[h.type] = (hifzByType[h.type] || 0) + 1;
    if (h.qualityRating) { hifzSum += h.qualityRating; hifzRated++; }
  }

  // Attendance rate
  const attTotal = att7d.length;
  const attPresent = att7d.filter((a) => a.status === "present" || a.status === "late").length;
  const attRate = attTotal ? Math.round((attPresent / attTotal) * 100) : 0;

  const feesCollected = feesPaid30d.reduce((s, f) => s + (f.paidAmount || 0), 0);

  return {
    tenantName: tenant?.name || "Madrasa",
    currency: tenant?.currency || "BDT",
    hijriToday: toHijri(now, locale),
    students: {
      total: studentTotal,
      active: studentActive,
      zakatEligible: studentZakat,
      hafiz: studentHafiz,
    },
    teachers: { total: teacherTotal, active: teacherActive },
    classes: classCount,
    funds: { total: fundsTotal, byType: fundsByType },
    hifz: {
      records30d: hifz30d.length,
      avgQuality: hifzRated ? Math.round((hifzSum / hifzRated) * 10) / 10 : 0,
      byType: hifzByType,
    },
    attendance: { rate7d: attRate, present: attPresent, total: attTotal },
    fees: {
      collected30d: feesCollected,
      pending: feesPending._sum.amount || 0,
      overdue: feesOverdue._sum.amount || 0,
      partial: feesPartial._sum.amount || 0,
    },
    recentActivities: activities.map((a) => ({
      action: a.action, module: a.module, entityName: a.entityName,
      createdAt: a.createdAt.toISOString(),
    })),
    upcomingEvents: events.map((e) => ({
      title: e.title, type: e.type, startDate: e.startDate.toISOString(),
    })),
  };
}
