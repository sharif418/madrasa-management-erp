// Exam by id — GET (with results + student names), PUT (audit), DELETE (cascade + audit)
// Tenant-scoped via session.tenantId.
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter } from "@/lib/api";

const TERMS = new Set(["first", "second", "final"]);
const getOwned = (id: string, tenantId: string) =>
  db.exam.findFirst({ where: { id, tenantId }, include: { class: { select: { name: true } } } });

// GET /api/exams/[id] — exam + all results with student name + roll
export const GET = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing exam id");
  const exam = await getOwned(id, session.tenantId);
  if (!exam) return notFound("Exam not found");

  const results = await db.examResult.findMany({
    where: { examId: id },
    include: { student: { select: { id: true, name: true, rollNo: true } } },
    orderBy: [{ student: { rollNo: "asc" } }, { subject: "asc" }],
  });

  return ok({
    id: exam.id, name: exam.name, classId: exam.classId,
    className: exam.class?.name ?? null, term: exam.term,
    startDate: exam.startDate ? exam.startDate.toISOString() : null,
    endDate: exam.endDate ? exam.endDate.toISOString() : null,
    createdAt: exam.createdAt.toISOString(),
    results: results.map((r) => ({
      id: r.id, studentId: r.studentId, studentName: r.student?.name ?? "",
      rollNo: r.student?.rollNo ?? null, subject: r.subject, marks: r.marks,
      total: r.total, grade: r.grade, remarks: r.remarks,
    })),
  });
});

// PUT /api/exams/[id] — update fields, audit
export const PUT = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing exam id");
  const existing = await getOwned(id, session.tenantId);
  if (!existing) return notFound("Exam not found");

  const body = (await req.json().catch(() => ({}))) as {
    name?: string; classId?: string | null; term?: string | null;
    startDate?: string | null; endDate?: string | null;
  };

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = (body.name || "").trim();
    if (!name) return fail("Name cannot be empty");
    data.name = name;
  }
  if (body.term !== undefined) data.term = body.term && TERMS.has(body.term) ? body.term : null;
  if (body.classId !== undefined) {
    if (!body.classId) data.classId = null;
    else {
      const cls = await db.class.findFirst({ where: { id: body.classId, tenantId: session.tenantId }, select: { id: true } });
      if (!cls) return fail("Class not found in this tenant", 404);
      data.classId = cls.id;
    }
  }
  if (body.startDate !== undefined) {
    const d = body.startDate ? new Date(body.startDate) : null;
    if (body.startDate && (!d || isNaN(d.getTime()))) return fail("Invalid startDate");
    data.startDate = d;
  }
  if (body.endDate !== undefined) {
    const d = body.endDate ? new Date(body.endDate) : null;
    if (body.endDate && (!d || isNaN(d.getTime()))) return fail("Invalid endDate");
    data.endDate = d;
  }

  const u = await db.exam.update({ where: { id }, data });
  await auditAfter(session, {
    action: "update", module: "exams", entityId: id, entityName: u.name,
    details: { changed: Object.keys(data) },
  });
  return ok({ id: u.id, updated: true });
});

// DELETE /api/exams/[id] — cascade delete results + audit (transactional)
export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing exam id");
  const existing = await getOwned(id, session.tenantId);
  if (!existing) return notFound("Exam not found");
  await db.$transaction([
    db.examResult.deleteMany({ where: { examId: id } }),
    db.exam.delete({ where: { id } }),
  ]);
  await auditAfter(session, {
    action: "delete", module: "exams", entityId: id, entityName: existing.name,
    details: { resultsDeleted: true },
  });
  return ok({ id, deleted: true });
});
