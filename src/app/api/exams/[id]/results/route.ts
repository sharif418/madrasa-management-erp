// Exam Results API — list (GET) + bulk upsert (POST).
// GET  /api/exams/[id]/results           — list all results for exam (student name + roll)
// POST /api/exams/[id]/results           — bulk upsert marks
//      Body: { results: [{ studentId, subject, marks, total, grade?, remarks? }] }
// No unique constraint on (examId, studentId, subject) → use deleteMany + createMany in a
// transaction scoped to the provided items.
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter } from "@/lib/api";

const TERMS_LIST = ["first", "second", "final"] as const;

// GET — list results for an exam (tenant-scoped via exam ownership check)
export const GET = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing exam id");

  const exam = await db.exam.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, name: true, classId: true },
  });
  if (!exam) return notFound("Exam not found");

  const results = await db.examResult.findMany({
    where: { examId: id },
    include: { student: { select: { id: true, name: true, rollNo: true } } },
    orderBy: [{ student: { rollNo: "asc" } }, { subject: "asc" }],
  });

  return ok({
    items: results.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student?.name ?? "",
      rollNo: r.student?.rollNo ?? null,
      subject: r.subject,
      marks: r.marks,
      total: r.total,
      grade: r.grade,
      remarks: r.remarks,
    })),
    count: results.length,
  });
});

type ResultInput = {
  studentId?: string;
  subject?: string;
  marks?: number | string;
  total?: number | string;
  grade?: string | null;
  remarks?: string | null;
};

type PostBody = { results?: ResultInput[] };

// POST — bulk upsert: delete existing results for given (studentId, subject) pairs, then create
export const POST = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing exam id");

  const exam = await db.exam.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, name: true, classId: true },
  });
  if (!exam) return notFound("Exam not found");

  const body = (await req.json().catch(() => ({}))) as PostBody;
  const input = Array.isArray(body.results) ? body.results : [];
  if (input.length === 0) return fail("No results provided");

  // Normalize + validate
  const normalized: {
    studentId: string;
    subject: string;
    marks: number;
    total: number;
    grade: string | null;
    remarks: string | null;
  }[] = [];

  // Collect distinct student IDs for tenant verification
  const studentIds = new Set<string>();
  for (const r of input) {
    const studentId = (r.studentId || "").trim();
    const subject = (r.subject || "").trim();
    if (!studentId || !subject) continue;
    const marks = Number(r.marks ?? 0);
    const total = Number(r.total ?? 100);
    if (!Number.isFinite(marks) || marks < 0) return fail(`Invalid marks for ${subject}`);
    if (!Number.isFinite(total) || total <= 0) return fail(`Invalid total for ${subject}`);
    studentIds.add(studentId);
    normalized.push({
      studentId,
      subject,
      marks,
      total,
      grade: r.grade ? String(r.grade).trim() : null,
      remarks: r.remarks ? String(r.remarks).trim() : null,
    });
  }

  if (normalized.length === 0) return fail("No valid results provided");

  // Verify all students belong to this tenant (or, if classId set on exam, to that class)
  const validStudents = await db.student.findMany({
    where: { id: { in: Array.from(studentIds) }, tenantId: session.tenantId },
    select: { id: true },
  });
  const validIds = new Set(validStudents.map((s) => s.id));
  const filtered = normalized.filter((n) => validIds.has(n.studentId));
  if (filtered.length === 0) return fail("No valid students in this tenant");

  // Bulk replace: delete existing rows for these (studentId, subject) pairs in this exam,
  // then create new ones — all in one transaction.
  // SQLite supports IN with arrays of tuples only via OR — build a where clause per pair.
  const orClauses = filtered.map((f) => ({ studentId: f.studentId, subject: f.subject }));

  await db.$transaction([
    db.examResult.deleteMany({ where: { examId: id, OR: orClauses } }),
    db.examResult.createMany({
      data: filtered.map((f) => ({
        examId: id,
        studentId: f.studentId,
        subject: f.subject,
        marks: f.marks,
        total: f.total,
        grade: f.grade,
        remarks: f.remarks,
      })),
    }),
  ]);

  await auditAfter(session, {
    action: "update",
    module: "exams",
    entityId: id,
    entityName: exam.name,
    details: {
      kind: "bulk-marks",
      count: filtered.length,
      students: Array.from(studentIds).length,
      terms: TERMS_LIST,
    },
  });

  return ok({ examId: id, saved: filtered.length });
});
