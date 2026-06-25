// GET /api/guardian/student/[id] — read-only guardian view (requires session)
// Returns a non-sensitive comprehensive snapshot of a single student
// (attendance / hifz / fees / exam results / notices) scoped to the
// caller's tenant for proper tenant isolation.
import { NextResponse } from "next/server";
import { withSession } from "@/lib/api";
import { db } from "@/lib/db";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const GET = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing student id" },
      { status: 400 }
    );
  }

  const student = await db.student.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { class: true, tenant: { select: { name: true } } },
  });
  if (!student) {
    return NextResponse.json(
      { ok: false, error: "Student not found" },
      { status: 404 }
    );
  }

  const tenantId = session.tenantId;

  // Run all read-only aggregations in parallel — keeps the endpoint snappy.
  const [hifzRecords, attendance, feeAgg, pendingFees, examResults, notices] =
    await Promise.all([
      db.hifzRecord.findMany({
        where: { studentId: id, tenantId },
        orderBy: { recordedAt: "desc" },
        select: {
          type: true, paraNumber: true, surahName: true, ayahFrom: true,
          ayahTo: true, qualityRating: true, status: true, recordedAt: true,
        },
      }),
      db.attendance.findMany({
        where: { tenantId, personId: id, personType: "student", date: { gte: new Date(Date.now() - 29 * 86400000) } },
        select: { date: true, status: true },
      }),
      db.feeCollection.aggregate({
        where: { tenantId, studentId: id },
        _sum: { amount: true, paidAmount: true },
        _count: { _all: true },
      }),
      db.feeCollection.findFirst({
        where: { tenantId, studentId: id, status: { in: ["pending", "partial", "overdue"] }, dueDate: { gte: new Date() } },
        orderBy: { dueDate: "asc" },
        select: { dueDate: true, amount: true, paidAmount: true },
      }),
      db.examResult.findMany({
        where: { studentId: id },
        orderBy: { id: "desc" },
        take: 5,
        select: { subject: true, marks: true, total: true, grade: true, exam: { select: { name: true, term: true } } },
      }),
      db.notice.findMany({
        where: { tenantId, audience: { in: ["all", "guardians"] } },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: { id: true, title: true, content: true, type: true, publishedAt: true },
      }),
    ]);

  // ---- Attendance aggregation ----
  const counts = { present: 0, absent: 0, late: 0, leave: 0 };
  for (const a of attendance) {
    if (a.status in counts) (counts as Record<string, number>)[a.status]++;
  }
  const total = attendance.length;
  const rate = total === 0 ? 0 : Math.round(((counts.present + counts.late) / total) * 100);
  const d30 = startOfDay(new Date(Date.now() - 29 * 86400000));
  const series = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(d30.getTime() + i * 86400000);
    const next = new Date(day.getTime() + 86400000);
    const rec = attendance.find((a) => a.date >= day && a.date < next);
    return { date: day.toISOString(), status: rec?.status ?? "none" };
  });

  // ---- Hifz aggregation ----
  const memorized = new Set<number>();
  const inProgress = new Set<number>();
  for (const r of hifzRecords) {
    if (r.status === "completed") memorized.add(r.paraNumber);
    else inProgress.add(r.paraNumber);
  }
  for (const p of memorized) inProgress.delete(p);
  const parasCovered = Array.from({ length: 30 }, (_, i) => {
    const p = i + 1;
    const status = memorized.has(p) ? "memorized" : inProgress.has(p) ? "in-progress" : "not-started";
    return { para: p, status };
  });
  const rated = hifzRecords.filter((r) => r.qualityRating != null);
  const avgQuality = rated.length > 0
    ? Math.round((rated.reduce((s, r) => s + (r.qualityRating ?? 0), 0) / rated.length) * 10) / 10
    : 0;

  const totalDue = (feeAgg._sum.amount ?? 0) - (feeAgg._sum.paidAmount ?? 0);
  const pendingCount = await db.feeCollection.count({
    where: { tenantId, studentId: id, status: { in: ["pending", "partial", "overdue"] } },
  });

  return NextResponse.json({
    ok: true,
    data: {
      student: {
        id: student.id,
        name: student.name,
        nameArabic: student.nameArabic,
        rollNo: student.rollNo,
        photoUrl: student.photoUrl,
        isHafiz: student.isHafiz,
        isActive: student.isActive,
        admissionDate: student.admissionDate.toISOString(),
        guardianPhone: student.guardianPhone,
      },
      tenantName: student.tenant?.name ?? "",
      class: student.class ? { name: student.class.name, curriculum: student.class.curriculum } : null,
      attendance: { last30d: { ...counts, rate, total }, series },
      hifz: {
        totalRecords: hifzRecords.length,
        avgQuality,
        memorizedCount: memorized.size,
        inProgressCount: inProgress.size,
        parasCovered,
        recentRecords: hifzRecords.slice(0, 5),
      },
      fees: {
        totalDue,
        totalPaid: feeAgg._sum.paidAmount ?? 0,
        pendingCount,
        nextDue: pendingFees
          ? { dueDate: pendingFees.dueDate?.toISOString() ?? null, amount: pendingFees.amount, paidAmount: pendingFees.paidAmount }
          : null,
      },
      examResults,
      notices: notices.map((n) => ({
        id: n.id, title: n.title, content: n.content,
        type: n.type, publishedAt: n.publishedAt.toISOString(),
      })),
    },
  });
});
