// Hifz Records — list (filtered, paginated) + create
// All queries scoped by tenantId from session.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";
import { cacheInvalidate } from "@/lib/cache";
import { computeNextRevision, strengthFromQuality } from "@/lib/spaced-repetition";

// Allowed types & statuses (kept in original Islamic form across all languages)
const TYPES = new Set(["sabak", "sabaq_para", "dhor"]);
const STATUSES = new Set(["completed", "revision", "weak"]);

// GET /api/hifz?studentId=&type=&from=&to=&page=1&limit=20
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId") || undefined;
  const type = url.searchParams.get("type") || undefined;
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

  // Build tenant-scoped where clause
  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (studentId) where.studentId = studentId;
  if (type && TYPES.has(type)) where.type = type;
  const recordedAt: Record<string, Date> = {};
  if (from) recordedAt.gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    recordedAt.lte = toDate;
  }
  if (Object.keys(recordedAt).length) where.recordedAt = recordedAt;

  const [records, total] = await Promise.all([
    db.hifzRecord.findMany({
      where,
      orderBy: { recordedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        student: { select: { id: true, name: true, nameArabic: true, rollNo: true } },
        teacher: { select: { id: true, name: true } },
      },
    }),
    db.hifzRecord.count({ where }),
  ]);

  return ok({
    items: records.map((r) => ({
      id: r.id,
      type: r.type,
      paraNumber: r.paraNumber,
      surahName: r.surahName,
      ayahFrom: r.ayahFrom,
      ayahTo: r.ayahTo,
      qualityRating: r.qualityRating,
      mistakesCount: r.mistakesCount,
      notes: r.notes,
      status: r.status,
      recordedAt: r.recordedAt,
      studentId: r.studentId,
      studentName: r.student?.name ?? "",
      studentNameArabic: r.student?.nameArabic ?? null,
      rollNo: r.student?.rollNo ?? null,
      teacherId: r.teacherId,
      teacherName: r.teacher?.name ?? null,
    })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

// POST /api/hifz — create a new hifz record
export const POST = withSession(async ({ session, req }) => {
  // RBAC: require hifz:create permission
  const allowed = await checkPermission(session, "hifz", "create");
  if (!allowed) return forbidden("You don't have permission to record Hifz");

  const body = await req.json().catch(() => ({}));
  const {
    studentId, type, paraNumber, surahName, ayahFrom, ayahTo,
    qualityRating, mistakesCount, notes, status,
  } = body || {};

  if (!studentId) return fail("studentId is required");
  if (!type || !TYPES.has(type)) return fail("Invalid type");
  const para = Number(paraNumber);
  if (!Number.isInteger(para) || para < 1 || para > 30) return fail("paraNumber must be 1-30");
  if (status && !STATUSES.has(status)) return fail("Invalid status");

  // Verify the student belongs to this tenant
  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true, name: true, isHafiz: true },
  });
  if (!student) return fail("Student not found in this tenant", 404);

  const created = await db.hifzRecord.create({
    data: {
      tenantId: session.tenantId,
      studentId,
      teacherId: session.userId,
      type,
      paraNumber: para,
      surahName: surahName ? String(surahName).trim() : null,
      ayahFrom: ayahFrom != null && ayahFrom !== "" ? Number(ayahFrom) : null,
      ayahTo: ayahTo != null && ayahTo !== "" ? Number(ayahTo) : null,
      qualityRating: qualityRating != null && qualityRating !== "" ? Number(qualityRating) : null,
      mistakesCount: mistakesCount != null && mistakesCount !== "" ? Number(mistakesCount) : 0,
      notes: notes ? String(notes).trim() : null,
      status: status || "completed",
      // Spaced-repetition scheduling
      strengthScore: strengthFromQuality(qualityRating != null && qualityRating !== "" ? Number(qualityRating) : null),
      revisionCount: 1,
      nextRevisionDate: computeNextRevision(
        strengthFromQuality(qualityRating != null && qualityRating !== "" ? Number(qualityRating) : null),
        1
      ),
    },
    include: { student: { select: { name: true } } },
  });

  // Auto-mark student as hafiz once all 30 paras completed
  if (!student.isHafiz) {
    const completedParas = await db.hifzRecord.findMany({
      where: { studentId, tenantId: session.tenantId, status: "completed" },
      distinct: ["paraNumber"],
      select: { paraNumber: true },
    });
    if (completedParas.length >= 30) {
      await db.student.update({ where: { id: studentId }, data: { isHafiz: true } });
    }
  }

  await auditAfter(session, {
    action: "create",
    module: "hifz",
    entityId: created.id,
    entityName: `${student.name} — ${type} (Para ${para})`,
    details: { type, paraNumber: para, status: created.status, studentId },
  });

  // Invalidate dashboard + analytics caches (hifz stats changed)
  cacheInvalidate("dashboard:");
  cacheInvalidate("analytics:");

  return ok(created, 201);
});
