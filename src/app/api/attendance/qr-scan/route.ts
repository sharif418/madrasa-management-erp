// POST /api/attendance/qr-scan — mark a single student present via QR scan.
// Body: { studentId, date?, status? }. Returns student info for confirmation.
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const STATUSES = new Set(["present", "absent", "late", "leave"]);

export const POST = withSession(async ({ session, req }) => {
  if (!(await checkPermission(session, "attendance", "create")))
    return forbidden("You don't have permission to mark attendance");

  const body = (await req.json().catch(() => ({}))) as { studentId?: string; date?: string; status?: string };
  const studentId = (body.studentId || "").trim();
  if (!studentId) return fail("studentId is required");
  const status = body.status && STATUSES.has(body.status) ? body.status : "present";
  const date = body.date ? new Date(body.date) : new Date();
  if (isNaN(date.getTime())) return fail("Invalid date");
  date.setHours(0, 0, 0, 0);

  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true, name: true, rollNo: true, photoUrl: true, class: { select: { name: true } } },
  });
  if (!student) return fail("Student not found", 404);

  await db.attendance.upsert({
    where: { tenantId_personId_personType_date: {
      tenantId: session.tenantId, personId: student.id, personType: "student", date,
    } },
    create: { tenantId: session.tenantId, personId: student.id, personType: "student", date, status, markedBy: session.userId },
    update: { status, markedBy: session.userId },
  });

  await auditAfter(session, {
    action: "update", module: "attendance",
    entityName: `QR Scan — ${student.name}`,
    details: { studentId: student.id, date: date.toISOString(), status },
  });

  return ok({
    success: true,
    student: { name: student.name, rollNo: student.rollNo,
      className: student.class?.name || null, photoUrl: student.photoUrl },
    status, date: date.toISOString(),
  });
});

