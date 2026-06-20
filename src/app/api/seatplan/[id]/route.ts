// SeatPlan [id] API — DELETE only. Tenant-scoped. RBAC: exams:delete. Audit logged.
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

// DELETE /api/seatplan/[id]
export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Seat plan id is required");

  const allowed = await checkPermission(session, "exams", "delete");
  if (!allowed) return forbidden("No permission to delete seat plans");

  const existing = await db.seatPlan.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { exam: { select: { name: true } } },
  });
  if (!existing) return fail("Seat plan not found", 404);

  await db.seatPlan.delete({ where: { id } });

  await auditAfter(session, {
    action: "delete",
    module: "exams",
    entityId: existing.id,
    entityName: `${existing.exam?.name ?? "Exam"} — ${existing.roomName}`,
    details: {
      roomName: existing.roomName,
      rows: existing.rows,
      cols: existing.cols,
    },
  });

  return ok({ id, deleted: true });
});
