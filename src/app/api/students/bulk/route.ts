// Student Bulk Actions API
// POST /api/students/bulk  { action, studentIds, data }
//   action: "attendance" | "assignFee" | "promote"
// GET  /api/students/bulk  → returns fee structures + classes (for bulk dialogs)
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";
import type { SessionUser } from "@/lib/session";

const STATUSES = new Set(["present", "absent", "late", "leave"]);

// GET — metadata needed by bulk dialogs (fee structures + classes)
export const GET = withSession(async ({ session }) => {
  const [feeStructures, classes] = await Promise.all([
    db.feeStructure.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, amount: true, type: true, frequency: true, classId: true },
    }),
    db.class.findMany({
      where: { tenantId: session.tenantId },
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: { id: true, name: true, code: true, level: true },
    }),
  ]);
  return ok({ feeStructures, classes });
});

type BulkBody = {
  action?: string;
  studentIds?: string[];
  data?: Record<string, unknown>;
};

type BulkResult = { success: number; failed: number; errors: string[] };

// POST — perform a bulk action on the given studentIds (all tenant-scoped)
export const POST = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "students", "update");
  if (!allowed) return forbidden("You don't have permission to perform bulk student actions");

  const body = (await req.json().catch(() => ({}))) as BulkBody;
  const action = body.action;
  const studentIds = Array.isArray(body.studentIds) ? body.studentIds.filter(Boolean) : [];
  const data = body.data || {};

  if (!action || !["attendance", "assignFee", "promote"].includes(action)) {
    return fail("Invalid action. Must be 'attendance', 'assignFee', or 'promote'");
  }
  if (studentIds.length === 0) return fail("No students selected");
  if (studentIds.length > 500) return fail("Cannot process more than 500 students at once");

  // Verify all studentIds belong to this tenant
  const validStudents = await db.student.findMany({
    where: { id: { in: studentIds }, tenantId: session.tenantId },
    select: { id: true, name: true, classId: true },
  });
  const validIds = new Set(validStudents.map((s) => s.id));
  const invalid = studentIds.filter((id) => !validIds.has(id));
  if (invalid.length > 0) {
    return fail("Some selected students do not belong to your madrasa");
  }

  const result: BulkResult = { success: 0, failed: 0, errors: [] };

  if (action === "attendance") return handleAttendance(session, studentIds, data, result);
  if (action === "assignFee") return handleAssignFee(session, studentIds, data, result);
  return handlePromote(session, studentIds, data, result);
});

// attendance: data = { date, status }
async function handleAttendance(
  session: SessionUser,
  studentIds: string[],
  data: Record<string, unknown>,
  result: BulkResult
) {
  const status = String(data.status || "");
  if (!STATUSES.has(status)) return fail("Invalid attendance status");

  let date: Date;
  if (data.date) {
    const d = new Date(String(data.date));
    if (isNaN(d.getTime())) return fail("Invalid date");
    date = d;
  } else {
    date = new Date();
  }
  date.setHours(0, 0, 0, 0);

  try {
    // Upsert attendance for each student (unique constraint on [tenantId, personId, personType, date])
    await db.$transaction(
      studentIds.map((id) =>
        db.attendance.upsert({
          where: {
            tenantId_personId_personType_date_session: {
              tenantId: session.tenantId,
              personId: id,
              personType: "student",
              date,
              session: "full",
            },
          },
          create: {
            tenantId: session.tenantId,
            personId: id,
            personType: "student",
            date,
            status,
            session: "full",
            markedBy: session.userId,
          },
          update: { status, markedBy: session.userId },
        })
      )
    );
    result.success = studentIds.length;
    await auditAfter(session, {
      action: "update",
      module: "attendance",
      entityName: `Bulk attendance — ${date.toISOString().slice(0, 10)}`,
      details: { count: studentIds.length, status, date: date.toISOString() },
    });
    return ok(result);
  } catch (e) {
    result.failed = studentIds.length;
    result.errors.push(e instanceof Error ? e.message : "Attendance creation failed");
    return ok(result);
  }
}

// assignFee: data = { feeStructureId, dueDate }
async function handleAssignFee(
  session: SessionUser,
  studentIds: string[],
  data: Record<string, unknown>,
  result: BulkResult
) {
  const feeStructureId = String(data.feeStructureId || "");
  if (!feeStructureId) return fail("Fee structure is required");

  const fee = await db.feeStructure.findFirst({
    where: { id: feeStructureId, tenantId: session.tenantId },
    select: { id: true, amount: true, name: true },
  });
  if (!fee) return fail("Selected fee structure does not exist in your madrasa");

  let dueDate: Date | null = null;
  if (data.dueDate) {
    const d = new Date(String(data.dueDate));
    if (!isNaN(d.getTime())) dueDate = d;
  }

  const errors: string[] = [];
  let success = 0;

  // Create FeeCollection rows one-by-one to surface per-student failures
  for (const id of studentIds) {
    try {
      await db.feeCollection.create({
        data: {
          tenantId: session.tenantId,
          studentId: id,
          feeStructureId: fee.id,
          amount: fee.amount,
          paidAmount: 0,
          dueDate,
          status: "pending",
        },
      });
      success++;
    } catch (e) {
      errors.push(`${id}: ${e instanceof Error ? e.message : "fee assignment failed"}`);
    }
  }

  result.success = success;
  result.failed = studentIds.length - success;
  result.errors = errors;

  await auditAfter(session, {
    action: "create",
    module: "finance",
    entityName: `Bulk fee assignment — ${fee.name}`,
    details: { feeStructureId: fee.id, count: success, dueDate: dueDate?.toISOString() ?? null },
  });
  return ok(result);
}

// promote: data = { toClassId }
async function handlePromote(
  session: SessionUser,
  studentIds: string[],
  data: Record<string, unknown>,
  result: BulkResult
) {
  const toClassId = String(data.toClassId || "");
  if (!toClassId) return fail("Target class is required");

  const cls = await db.class.findFirst({
    where: { id: toClassId, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!cls) return fail("Selected class does not exist in your madrasa");

  try {
    const updateResult = await db.student.updateMany({
      where: { id: { in: studentIds }, tenantId: session.tenantId },
      data: { classId: cls.id },
    });
    result.success = updateResult.count;
    result.failed = studentIds.length - updateResult.count;
    await auditAfter(session, {
      action: "update",
      module: "students",
      entityName: `Bulk promote — to ${cls.name}`,
      details: { toClassId: cls.id, count: updateResult.count },
    });
    return ok(result);
  } catch (e) {
    result.failed = studentIds.length;
    result.errors.push(e instanceof Error ? e.message : "Promotion failed");
    return ok(result);
  }
}
