// PTM API — list (with student + teacher + class) + create.
// Tenant-scoped. RBAC: communications:create for POST.
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const VALID_STATUS = ["scheduled", "completed", "cancelled"] as const;
const DURATIONS = [15, 30, 45, 60];

// GET /api/ptm?status=scheduled|completed|cancelled
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const where: { tenantId: string; status?: string } = { tenantId: session.tenantId };
  if (status && VALID_STATUS.includes(status as never)) where.status = status;

  const rows = await db.ptmSession.findMany({
    where,
    include: {
      student: {
        select: {
          id: true, name: true, rollNo: true,
          class: { select: { id: true, name: true } },
        },
      },
      teacher: { select: { id: true, name: true, designation: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const items = rows.map((p) => ({
    id: p.id,
    studentId: p.studentId,
    studentName: p.student.name,
    rollNo: p.student.rollNo ?? null,
    classId: p.student.class?.id ?? null,
    className: p.student.class?.name ?? null,
    teacherId: p.teacherId,
    teacherName: p.teacher.name,
    teacherDesignation: p.teacher.designation ?? null,
    date: p.date,
    time: p.time,
    duration: p.duration,
    topic: p.topic ?? null,
    notes: p.notes ?? null,
    status: p.status,
    completedAt: p.completedAt ?? null,
    createdAt: p.createdAt,
  }));

  return ok({ items });
});

// POST /api/ptm — create session
export const POST = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "communications", "create");
  if (!allowed) return forbidden("No permission to schedule PTM");

  const body = await req.json().catch(() => ({}));
  const { studentId, teacherId, date, time, duration, topic, status } = body || {};

  if (!studentId || typeof studentId !== "string") return fail("Student is required");
  if (!teacherId || typeof teacherId !== "string") return fail("Teacher is required");
  if (!date || typeof date !== "string") return fail("Date is required");
  if (!time || typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) return fail("Time must be HH:mm");

  const [student, teacher] = await Promise.all([
    db.student.findFirst({ where: { id: studentId, tenantId: session.tenantId }, select: { id: true, name: true } }),
    db.teacher.findFirst({ where: { id: teacherId, tenantId: session.tenantId }, select: { id: true, name: true } }),
  ]);
  if (!student) return fail("Student not found");
  if (!teacher) return fail("Teacher not found");

  const d = new Date(date);
  if (isNaN(d.getTime())) return fail("Invalid date");

  const dur = Number(duration);
  const durationMin = DURATIONS.includes(dur) ? dur : 30;
  const initialStatus = VALID_STATUS.includes(status as never) ? (status as string) : "scheduled";

  const created = await db.ptmSession.create({
    data: {
      tenantId: session.tenantId,
      studentId: student.id,
      teacherId: teacher.id,
      date: d,
      time,
      duration: durationMin,
      topic: typeof topic === "string" ? topic.trim() || null : null,
      status: initialStatus,
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "communications",
    entityId: created.id,
    entityName: `${student.name} ↔ ${teacher.name}`,
    details: { date: d.toISOString().slice(0, 10), time, duration: durationMin, topic },
  });

  return ok(created, 201);
});
