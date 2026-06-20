// Tajweed Assessment — list (with stats) + create
// GET  /api/hifz/tajweed?studentId=&from=&to=
// POST /api/hifz/tajweed
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const clamp = (n: unknown) => {
  const v = Number(n);
  if (!Number.isInteger(v) || v < 1 || v > 10) return null;
  return v;
};

// Grade from total (0-100): EXCELLENT >=85, GOOD >=70, SATISFACTORY >=50, else NEEDS_IMPROVEMENT
function gradeFor(total: number): string {
  if (total >= 85) return "EXCELLENT";
  if (total >= 70) return "GOOD";
  if (total >= 50) return "SATISFACTORY";
  return "NEEDS_IMPROVEMENT";
}

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId") || undefined;
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (studentId) where.studentId = studentId;
  const dateRange: Record<string, Date> = {};
  if (from) dateRange.gte = new Date(from);
  if (to) {
    const td = new Date(to);
    td.setHours(23, 59, 59, 999);
    dateRange.lte = td;
  }
  if (Object.keys(dateRange).length) where.date = dateRange;

  const rows = await db.tajweedAssessment.findMany({
    where,
    orderBy: { date: "desc" },
    take: 200,
    include: { student: { select: { id: true, name: true, rollNo: true } } },
  });

  const items = rows.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    studentName: r.student?.name ?? "",
    rollNo: r.student?.rollNo ?? null,
    date: r.date,
    surahName: r.surahName,
    ayahFrom: r.ayahFrom,
    ayahTo: r.ayahTo,
    maddScore: r.maddScore,
    waqfScore: r.waqfScore,
    tizkeerScore: r.tizkeerScore,
    nunScore: r.nunScore,
    makhrajScore: r.makhrajScore,
    totalScore: r.totalScore,
    grade: r.grade,
    comments: r.comments,
    improvementAreas: r.improvementAreas ? JSON.parse(r.improvementAreas) : [],
  }));

  // Aggregate stats
  const n = items.length;
  const avg = (k: "maddScore" | "waqfScore" | "tizkeerScore" | "nunScore" | "makhrajScore") =>
    n ? Math.round((items.reduce((s, r) => s + r[k], 0) / n) * 10) / 10 : 0;

  const stats = {
    count: n,
    avgMadd: avg("maddScore"),
    avgWaqf: avg("waqfScore"),
    avgTizkeer: avg("tizkeerScore"),
    avgNun: avg("nunScore"),
    avgMakhraj: avg("makhrajScore"),
    avgTotal: n ? Math.round((items.reduce((s, r) => s + r.totalScore, 0) / n) * 10) / 10 : 0,
  };

  const trend = items
    .slice()
    .reverse()
    .map((r) => ({ date: r.date, total: r.totalScore, grade: r.grade }));

  return ok({ items, stats, trend });
});

export const POST = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "hifz", "create");
  if (!allowed) return forbidden("You don't have permission to assess Tajweed");

  const body = await req.json().catch(() => ({}));
  const { studentId, surahName, ayahFrom, ayahTo, comments, improvementAreas } = body || {};
  const madd = clamp(body.maddScore);
  const waqf = clamp(body.waqfScore);
  const tizkeer = clamp(body.tizkeerScore);
  const nun = clamp(body.nunScore);
  const makhraj = clamp(body.makhrajScore);

  if (!studentId) return fail("studentId is required");
  if (!surahName || !String(surahName).trim()) return fail("surahName is required");
  if ([madd, waqf, tizkeer, nun, makhraj].some((v) => v === null))
    return fail("All five rubric scores (1-10) are required");

  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!student) return fail("Student not found", 404);

  const ayahF = Math.max(1, Math.trunc(Number(ayahFrom) || 1));
  const ayahT = Math.max(ayahF, Math.trunc(Number(ayahTo) || ayahF));
  const total = (madd! + waqf! + tizkeer! + nun! + makhraj!) * 2; // 5×10×2 = 100
  const grade = gradeFor(total);

  const created = await db.tajweedAssessment.create({
    data: {
      tenantId: session.tenantId,
      studentId,
      teacherId: session.userId,
      surahName: String(surahName).trim(),
      ayahFrom: ayahF,
      ayahTo: ayahT,
      maddScore: madd!,
      waqfScore: waqf!,
      tizkeerScore: tizkeer!,
      nunScore: nun!,
      makhrajScore: makhraj!,
      totalScore: total,
      grade,
      comments: comments ? String(comments).trim() : null,
      improvementAreas: Array.isArray(improvementAreas)
        ? JSON.stringify(improvementAreas)
        : null,
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "hifz",
    entityId: created.id,
    entityName: `${student.name} — Tajweed ${surahName} ${ayahF}-${ayahT} (${total}/100)`,
    details: { studentId, surahName, total, grade },
  });

  return ok(created, 201);
});
