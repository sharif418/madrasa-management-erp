// GET /api/reports — aggregated tenant-wide report datasets in one call.
// Returns studentSummary, financeSummary, hifzSummary, attendanceSummary, feeSummary.
// All queries filter by tenantId from the session for row-level isolation.
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ok, unauthorized } from "@/lib/api";

const FUND_TYPES = ["general", "lillah", "waqf", "zakat", "sadaqah"] as const;

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const { tenantId } = session;

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const d7Start = new Date(now.getTime() - 6 * 24 * 3600 * 1000);
  d7Start.setHours(0, 0, 0, 0);

  // Parallel fetch of all underlying records — every query is tenant-scoped.
  const [
    students, classes, hifz30d, transactions30d, attendance7d,
    feeCollections30d, feeCollectionsAll,
  ] = await Promise.all([
    db.student.findMany({
      where: { tenantId },
      select: {
        id: true, gender: true, isHafiz: true, isZakatEligible: true,
        isActive: true, classId: true,
      },
    }),
    db.class.findMany({ where: { tenantId }, select: { id: true, name: true } }),
    db.hifzRecord.findMany({
      where: { tenantId, recordedAt: { gte: d30 } },
      select: {
        type: true, paraNumber: true, qualityRating: true, studentId: true,
        student: { select: { name: true } },
      },
    }),
    db.transaction.findMany({
      where: { tenantId, date: { gte: d30 } },
      select: {
        type: true, amount: true, category: true,
        fund: { select: { type: true } },
      },
    }),
    db.attendance.findMany({
      where: { tenantId, date: { gte: d7Start } },
      select: { status: true, personId: true, personType: true },
    }),
    db.feeCollection.findMany({
      where: { tenantId, paidDate: { gte: d30 } },
      select: { paidAmount: true },
    }),
    db.feeCollection.findMany({
      where: { tenantId },
      select: {
        amount: true, paidAmount: true, status: true,
        student: { select: { classId: true } },
      },
    }),
  ]);

  // ----- Student Summary -----
  const total = students.length;
  const active = students.filter((s) => s.isActive).length;
  const hafiz = students.filter((s) => s.isHafiz).length;
  const zakatEligible = students.filter((s) => s.isZakatEligible).length;
  const male = students.filter((s) => s.gender === "male").length;
  const female = students.filter((s) => s.gender === "female").length;
  const classNameMap = new Map(classes.map((c) => [c.id, c.name]));
  const classCount = new Map<string, number>();
  for (const s of students) {
    if (s.classId) classCount.set(s.classId, (classCount.get(s.classId) || 0) + 1);
  }
  const byClass = Array.from(classCount.entries())
    .map(([cid, count]) => ({
      classId: cid, className: classNameMap.get(cid) || "—", count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ----- Finance Summary -----
  let totalIncome = 0;
  let totalExpense = 0;
  const fundTypeAgg: Record<string, number> = {};
  const catAgg: Record<string, number> = {};
  for (const tx of transactions30d) {
    if (tx.type === "income") {
      totalIncome += tx.amount;
      const ft = tx.fund?.type || "general";
      fundTypeAgg[ft] = (fundTypeAgg[ft] || 0) + tx.amount;
    } else if (tx.type === "expense") {
      totalExpense += tx.amount;
      const cat = tx.category || "uncategorized";
      catAgg[cat] = (catAgg[cat] || 0) + tx.amount;
    }
  }
  const fundDist = FUND_TYPES
    .filter((t) => (fundTypeAgg[t] || 0) > 0)
    .map((type) => ({ type, amount: fundTypeAgg[type] || 0 }));
  const topExpenses = Object.entries(catAgg)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // ----- Hifz Summary -----
  const hifzByTypeAgg: Record<string, number> = {};
  const studentCountAgg: Record<string, { name: string; count: number }> = {};
  let qualitySum = 0;
  let qualityCount = 0;
  const parasDistribution: { para: number; count: number }[] = Array.from(
    { length: 30 }, (_, i) => ({ para: i + 1, count: 0 })
  );
  for (const h of hifz30d) {
    hifzByTypeAgg[h.type] = (hifzByTypeAgg[h.type] || 0) + 1;
    if (!studentCountAgg[h.studentId]) {
      studentCountAgg[h.studentId] = { name: h.student?.name || "—", count: 0 };
    }
    studentCountAgg[h.studentId].count += 1;
    if (h.paraNumber >= 1 && h.paraNumber <= 30) {
      parasDistribution[h.paraNumber - 1].count += 1;
    }
    if (h.qualityRating) {
      qualitySum += h.qualityRating;
      qualityCount += 1;
    }
  }
  const hifzByType = Object.entries(hifzByTypeAgg).map(([type, count]) => ({ type, count }));
  const topStudents = Object.entries(studentCountAgg)
    .map(([id, v]) => ({ id, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const avgQuality = qualityCount > 0 ? Math.round((qualitySum / qualityCount) * 10) / 10 : 0;
  const parasCovered = parasDistribution.filter((p) => p.count > 0).length;

  // ----- Attendance Summary (7 days) -----
  const present = attendance7d.filter((a) => a.status === "present").length;
  const absent = attendance7d.filter((a) => a.status === "absent").length;
  const late = attendance7d.filter((a) => a.status === "late").length;
  const leave = attendance7d.filter((a) => a.status === "leave").length;
  const totalAttendance = attendance7d.length;
  const avgRate = totalAttendance > 0
    ? Math.round(((present + late) / totalAttendance) * 100)
    : 0;
  // By class — student attendance records mapped to the student's class
  const studentClassMap = new Map(students.map((s) => [s.id, s.classId]));
  const attByClassAgg: Record<string, { className: string; present: number; total: number }> = {};
  for (const a of attendance7d) {
    if (a.personType !== "student") continue;
    const cid = studentClassMap.get(a.personId);
    if (!cid) continue;
    const className = classNameMap.get(cid) || "—";
    if (!attByClassAgg[cid]) attByClassAgg[cid] = { className, present: 0, total: 0 };
    attByClassAgg[cid].total += 1;
    if (a.status === "present" || a.status === "late") attByClassAgg[cid].present += 1;
  }
  const attendanceByClass = Object.entries(attByClassAgg)
    .map(([classId, v]) => ({
      classId, className: v.className,
      rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
      present: v.present, total: v.total,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 8);

  // ----- Fee Summary -----
  const feeCollected = feeCollections30d.reduce((s, f) => s + (f.paidAmount || 0), 0);
  const feePending = feeCollectionsAll.filter((f) => f.status === "pending").length;
  const feePaid = feeCollectionsAll.filter((f) => f.status === "paid").length;
  const feeDue = feeCollectionsAll.reduce(
    (s, f) => s + Math.max(0, (f.amount || 0) - (f.paidAmount || 0)), 0
  );
  const feeByClassAgg: Record<string, { className: string; collected: number; due: number }> = {};
  for (const f of feeCollectionsAll) {
    const cid = f.student?.classId;
    if (!cid) continue;
    const className = classNameMap.get(cid) || "—";
    if (!feeByClassAgg[cid]) feeByClassAgg[cid] = { className, collected: 0, due: 0 };
    feeByClassAgg[cid].collected += f.paidAmount || 0;
    feeByClassAgg[cid].due += Math.max(0, (f.amount || 0) - (f.paidAmount || 0));
  }
  const feeByClass = Object.entries(feeByClassAgg)
    .map(([classId, v]) => ({
      classId, className: v.className,
      collected: Math.round(v.collected), due: Math.round(v.due),
    }))
    .sort((a, b) => b.collected + b.due - (a.collected + a.due))
    .slice(0, 8);

  return ok({
    studentSummary: {
      total, active, inactive: total - active, hafiz, zakatEligible,
      byGender: { male, female },
      byClass,
    },
    financeSummary: {
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      net: Math.round(totalIncome - totalExpense),
      byFundType: fundDist,
      topExpenses,
    },
    hifzSummary: {
      totalRecords: hifz30d.length,
      avgQuality,
      byType: hifzByType,
      topStudents,
      parasCovered,
      parasDistribution,
    },
    attendanceSummary: {
      avgRate,
      counts: { present, absent, late, leave, total: totalAttendance },
      byClass: attendanceByClass,
    },
    feeSummary: {
      feeCollected: Math.round(feeCollected),
      feeDue: Math.round(feeDue),
      pendingCount: feePending,
      paidCount: feePaid,
      byClass: feeByClass,
    },
  });
}
