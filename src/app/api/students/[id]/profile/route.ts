// GET /api/students/[id]/profile — comprehensive 360° student profile
// All data scoped by session.tenantId. Aggregates: basic info, class, wallet,
// hifz (30-para grid + recent), attendance (last 30 days), fees, exam results.
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession } from "@/lib/api";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const GET = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing student id");
  const tenantId = session.tenantId;

  // 1. Student + class + wallet (single tenant-scoped query)
  const student = await db.student.findFirst({
    where: { id, tenantId },
    include: { class: true, wallet: { include: { logs: { orderBy: { createdAt: "desc" }, take: 10 } } } },
  });
  if (!student) return notFound("Student not found");

  // 2. Hifz records (all, tenant-scoped) — derive para grid + avg quality + recent
  const hifzRecords = await db.hifzRecord.findMany({
    where: { studentId: id, tenantId },
    orderBy: { recordedAt: "desc" },
    select: {
      id: true, type: true, paraNumber: true, surahName: true,
      ayahFrom: true, ayahTo: true, qualityRating: true,
      mistakesCount: true, status: true, notes: true, recordedAt: true,
    },
  });

  const memorizedParas = new Set<number>();
  const inProgressParas = new Set<number>();
  for (const r of hifzRecords) {
    if (r.status === "completed") memorizedParas.add(r.paraNumber);
    else inProgressParas.add(r.paraNumber);
  }
  for (const p of memorizedParas) inProgressParas.delete(p);

  const parasCovered = Array.from({ length: 30 }, (_, i) => {
    const p = i + 1;
    if (memorizedParas.has(p)) return { para: p, status: "memorized" as const };
    if (inProgressParas.has(p)) return { para: p, status: "in-progress" as const };
    return { para: p, status: "not-started" as const };
  });

  const rated = hifzRecords.filter((r) => r.qualityRating != null);
  const avgQuality = rated.length > 0
    ? Math.round((rated.reduce((s, r) => s + (r.qualityRating ?? 0), 0) / rated.length) * 10) / 10
    : 0;

  // 3. Attendance last 30 days
  const today = startOfDay(new Date());
  const d30 = new Date(today.getTime() - 29 * 24 * 3600 * 1000);
  const attendance = await db.attendance.findMany({
    where: { tenantId, personId: id, personType: "student", date: { gte: d30 } },
    select: { date: true, status: true },
  });
  const attCounts = { present: 0, absent: 0, late: 0, leave: 0 };
  for (const a of attendance) {
    if (a.status in attCounts) (attCounts as Record<string, number>)[a.status]++;
  }
  const attTotal = attendance.length;
  const attRate = attTotal === 0
    ? 0
    : Math.round(((attCounts.present + attCounts.late) / attTotal) * 100);

  // Build a 30-day series (oldest → newest) for the bar chart
  const attSeries = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(d30.getTime() + i * 24 * 3600 * 1000);
    const next = new Date(day.getTime() + 24 * 3600 * 1000);
    const rec = attendance.find((a) => a.date >= day && a.date < next);
    return {
      date: day.toISOString(),
      status: rec?.status ?? "none",
    };
  });

  // 4. Fees — aggregate + 5 recent collections
  const [feeAgg, recentFees] = await Promise.all([
    db.feeCollection.aggregate({
      where: { tenantId, studentId: id },
      _sum: { amount: true, paidAmount: true },
      _count: { _all: true },
    }),
    db.feeCollection.findMany({
      where: { tenantId, studentId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, amount: true, paidAmount: true, status: true, method: true, paidDate: true, dueDate: true },
    }),
  ]);
  const totalDue = (feeAgg._sum.amount ?? 0) - (feeAgg._sum.paidAmount ?? 0);
  const pendingCount = await db.feeCollection.count({
    where: { tenantId, studentId: id, status: { in: ["pending", "partial", "overdue"] } },
  });

  // 5. Exam results — last 5 with exam name
  const examResults = await db.examResult.findMany({
    where: { studentId: id },
    orderBy: { id: "desc" },
    take: 5,
    select: {
      id: true, subject: true, marks: true, total: true, grade: true, remarks: true,
      exam: { select: { name: true, term: true } },
    },
  });

  return ok({
    student: {
      id: student.id,
      name: student.name,
      nameArabic: student.nameArabic,
      rollNo: student.rollNo,
      gender: student.gender,
      dob: student.dob,
      phone: student.phone,
      address: student.address,
      bloodGroup: student.bloodGroup,
      photoUrl: student.photoUrl,
      isHafiz: student.isHafiz,
      isZakatEligible: student.isZakatEligible,
      isActive: student.isActive,
      admissionDate: student.admissionDate,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      guardianRelation: student.guardianRelation,
    },
    class: student.class
      ? { name: student.class.name, curriculum: student.class.curriculum, level: student.class.level }
      : null,
    wallet: {
      balance: student.wallet?.balance ?? 0,
      recentLogs: (student.wallet?.logs ?? []).map((l) => ({
        id: l.id, amount: l.amount, trxType: l.trxType,
        description: l.description, createdAt: l.createdAt,
      })),
    },
    hifz: {
      totalRecords: hifzRecords.length,
      avgQuality,
      parasCovered,
      recentRecords: hifzRecords.slice(0, 10),
    },
    attendance: {
      last30d: { ...attCounts, rate: attRate, total: attTotal },
      series: attSeries,
    },
    fees: {
      totalDue,
      totalPaid: feeAgg._sum.paidAmount ?? 0,
      pendingCount,
      recentCollections: recentFees,
    },
    examResults,
  });
});
