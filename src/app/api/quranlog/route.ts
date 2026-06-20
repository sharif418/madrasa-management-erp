// Quran Reading Log API — list (with student name) + create.
// Tenant-scoped. RBAC: academic:create for POST.
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

// GET /api/quranlog?studentId=&from=&to=&page=1&limit=30
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId") || undefined;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "30")));

  const where: { tenantId: string; studentId?: string; date?: { gte?: Date; lte?: Date } } = {
    tenantId: session.tenantId,
  };
  if (studentId) where.studentId = studentId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const [rows, total] = await Promise.all([
    db.quranLog.findMany({
      where,
      include: {
        student: {
          select: {
            id: true, name: true, rollNo: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.quranLog.count({ where }),
  ]);

  const items = rows.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    studentName: r.student.name,
    rollNo: r.student.rollNo ?? null,
    className: r.student.class?.name ?? null,
    date: r.date,
    pagesRead: r.pagesRead,
    surahName: r.surahName ?? null,
    paraNumber: r.paraNumber ?? null,
    notes: r.notes ?? null,
    createdAt: r.createdAt,
  }));

  // 30-day stats
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const recent = await db.quranLog.findMany({
    where: { tenantId: session.tenantId, date: { gte: since } },
    select: { studentId: true, date: true, pagesRead: true },
  });
  const totalPages30 = recent.reduce((a, r) => a + r.pagesRead, 0);
  const activeReaders = new Set(recent.map((r) => r.studentId)).size;
  const dayBuckets = new Set(recent.map((r) => r.date.toISOString().slice(0, 10)));
  const streakCount = dayBuckets.size;
  const dailyAvg = streakCount > 0 ? Math.round(totalPages30 / streakCount) : 0;

  // Khatm progress: students who have read >= 604 pages in the last 365 days
  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 365);
  const yearly = await db.quranLog.findMany({
    where: { tenantId: session.tenantId, date: { gte: yearAgo } },
    select: { studentId: true, pagesRead: true },
  });
  const perStudent: Record<string, number> = {};
  for (const r of yearly) perStudent[r.studentId] = (perStudent[r.studentId] || 0) + r.pagesRead;
  const khatmCompletions = Object.values(perStudent).filter((n) => n >= 604).length;

  return ok({
    items,
    total,
    page,
    limit,
    stats: {
      totalPages30,
      activeReaders,
      streakCount,
      dailyAvg,
      khatmCompletions,
    },
  });
});

// POST /api/quranlog — create reading log
export const POST = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "academic", "create");
  if (!allowed) return forbidden("No permission to create Quran reading logs");

  const body = await req.json().catch(() => ({}));
  const { studentId, date, pagesRead, surahName, paraNumber, notes } = body || {};

  if (!studentId || typeof studentId !== "string") return fail("Student is required");

  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!student) return fail("Student not found");

  const pages = Number(pagesRead);
  if (!Number.isFinite(pages) || pages < 0) return fail("pagesRead must be a non-negative number");

  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return fail("Invalid date");

  let para: number | null = null;
  if (paraNumber !== undefined && paraNumber !== null && paraNumber !== "") {
    const pn = Number(paraNumber);
    if (!Number.isFinite(pn) || pn < 1 || pn > 30) return fail("Para must be 1–30");
    para = pn;
  }

  const created = await db.quranLog.create({
    data: {
      tenantId: session.tenantId,
      studentId: student.id,
      date: d,
      pagesRead: Math.round(pages),
      surahName: typeof surahName === "string" && surahName.trim() ? surahName.trim() : null,
      paraNumber: para,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "academic",
    entityId: created.id,
    entityName: student.name,
    details: { type: "quranlog", pagesRead: pages, date: d.toISOString().slice(0, 10), studentId: student.id },
  });

  return ok(created, 201);
});
