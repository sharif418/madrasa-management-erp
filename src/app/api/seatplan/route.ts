// SeatPlan API — list (with exam + class + student count) + create.
// Tenant-scoped. RBAC: exams:create for POST. Audit logged.
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

type Assignment = { seatNo: string; studentId: string };

// GET /api/seatplan — all plans for current tenant with exam/class/student count
export const GET = withSession(async ({ session }) => {
  const rows = await db.seatPlan.findMany({
    where: { tenantId: session.tenantId },
    include: {
      exam: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const items = rows.map((p) => {
    let assignments: Assignment[] = [];
    try {
      assignments = JSON.parse(p.assignments || "[]") as Assignment[];
    } catch {
      assignments = [];
    }
    return {
      id: p.id,
      examId: p.examId,
      examName: p.exam?.name ?? "—",
      classId: p.classId,
      className: p.class?.name ?? null,
      roomName: p.roomName,
      rows: p.rows,
      cols: p.cols,
      studentCount: assignments.length,
      assignments,
      createdAt: p.createdAt.toISOString(),
    };
  });

  return ok({ items });
});

// POST /api/seatplan — create seat plan with auto-assigned seat numbers
export const POST = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "exams", "create");
  if (!allowed) return forbidden("No permission to create seat plans");

  const body = await req.json().catch(() => ({})) as {
    examId?: string;
    classId?: string | null;
    roomName?: string;
    rows?: number;
    cols?: number;
    studentIds?: string[];
  };

  if (!body.examId || typeof body.examId !== "string")
    return fail("Exam is required");
  if (!body.roomName || typeof body.roomName !== "string" || !body.roomName.trim())
    return fail("Room name is required");

  const rows = Math.min(20, Math.max(1, Number(body.rows) || 5));
  const cols = Math.min(20, Math.max(1, Number(body.cols) || 6));
  if (!Number.isFinite(rows) || !Number.isFinite(cols))
    return fail("Valid rows and cols are required");

  const studentIds = Array.isArray(body.studentIds)
    ? body.studentIds.filter((x) => typeof x === "string")
    : [];
  if (studentIds.length === 0) return fail("Select at least one student");
  if (studentIds.length > rows * cols)
    return fail(`Too many students: grid has ${rows * cols} seats, got ${studentIds.length}`);

  // Verify exam + students belong to tenant
  const [exam, students] = await Promise.all([
    db.exam.findFirst({
      where: { id: body.examId, tenantId: session.tenantId },
      select: { id: true, name: true },
    }),
    db.student.findMany({
      where: { id: { in: studentIds }, tenantId: session.tenantId },
      select: { id: true },
    }),
  ]);
  if (!exam) return fail("Exam not found", 404);
  if (students.length !== studentIds.length)
    return fail("Some students not found in your madrasa");

  // Verify class (if provided)
  let resolvedClassId: string | null = null;
  if (body.classId && typeof body.classId === "string") {
    const cls = await db.class.findFirst({
      where: { id: body.classId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (!cls) return fail("Class not found");
    resolvedClassId = cls.id;
  }

  // Auto-assign seat numbers: A1, A2, ... B1, B2, ... (row letter + col index)
  const assignments: Assignment[] = studentIds.map((studentId, i) => {
    const rowIdx = Math.floor(i / cols);
    const colIdx = i % cols;
    const rowLetter = String.fromCharCode(65 + rowIdx); // A, B, C...
    return { seatNo: `${rowLetter}${colIdx + 1}`, studentId };
  });

  const created = await db.seatPlan.create({
    data: {
      tenantId: session.tenantId,
      examId: exam.id,
      classId: resolvedClassId,
      roomName: body.roomName.trim(),
      rows,
      cols,
      assignments: JSON.stringify(assignments),
    },
    include: {
      exam: { select: { name: true } },
      class: { select: { name: true } },
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "exams",
    entityId: created.id,
    entityName: `${created.exam.name} — ${created.roomName}`,
    details: {
      roomName: created.roomName,
      rows,
      cols,
      studentCount: assignments.length,
      examId: exam.id,
    },
  });

  return ok({
    id: created.id,
    examId: created.examId,
    examName: created.exam.name,
    classId: created.classId,
    className: created.class?.name ?? null,
    roomName: created.roomName,
    rows: created.rows,
    cols: created.cols,
    studentCount: assignments.length,
    assignments,
    createdAt: created.createdAt.toISOString(),
  }, 201);
});
