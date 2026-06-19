// GET /api/hifz/progress?studentId= — aggregated Hifz progress for a student
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession } from "@/lib/api";

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");
  if (!studentId) return fail("studentId is required");

  // Verify tenant ownership of student
  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true, name: true, nameArabic: true, rollNo: true, isHafiz: true },
  });
  if (!student) return notFound("Student not found");

  // Fetch all records for this student (tenant-scoped)
  const records = await db.hifzRecord.findMany({
    where: { studentId, tenantId: session.tenantId },
    orderBy: { recordedAt: "desc" },
    select: {
      id: true, type: true, paraNumber: true, qualityRating: true,
      mistakesCount: true, status: true, recordedAt: true,
    },
  });

  // Distinct paras memorized (status=completed) + in-progress (revision/weak)
  const memorizedParas = new Set<number>();
  const inProgressParas = new Set<number>();
  for (const r of records) {
    if (r.status === "completed") memorizedParas.add(r.paraNumber);
    else inProgressParas.add(r.paraNumber);
  }
  for (const p of memorizedParas) inProgressParas.delete(p);

  // Last 30 days count
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const last30d = records.filter((r) => r.recordedAt >= cutoff).length;

  // byType breakdown
  const byType = { sabak: 0, sabaq_para: 0, dhor: 0 };
  for (const r of records) {
    if (r.type in byType) (byType as Record<string, number>)[r.type]++;
  }

  // Average quality (only rated records)
  const rated = records.filter((r) => r.qualityRating != null);
  const avgQuality =
    rated.length > 0
      ? rated.reduce((s, r) => s + (r.qualityRating ?? 0), 0) / rated.length
      : 0;

  // parasCovered: array 1-30 with status
  const parasCovered = Array.from({ length: 30 }, (_, i) => {
    const p = i + 1;
    if (memorizedParas.has(p)) return { para: p, status: "memorized" as const };
    if (inProgressParas.has(p)) return { para: p, status: "in-progress" as const };
    return { para: p, status: "not-started" as const };
  });

  // Quality trend (last 20 rated records, oldest→newest for chart)
  const trend = rated
    .slice(0, 20)
    .reverse()
    .map((r, idx) => ({
      index: idx + 1,
      date: r.recordedAt,
      quality: r.qualityRating ?? 0,
      type: r.type,
      para: r.paraNumber,
    }));

  return ok({
    student: {
      id: student.id,
      name: student.name,
      nameArabic: student.nameArabic,
      rollNo: student.rollNo,
      isHafiz: student.isHafiz,
    },
    totalParas: memorizedParas.size,
    last30d,
    byType,
    avgQuality: Math.round(avgQuality * 10) / 10,
    parasCovered,
    trend,
    totalRecords: records.length,
  });
});
