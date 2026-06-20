// PTM [id] API — PUT (update status/notes) + DELETE.
// Tenant-scoped. RBAC: communications:update / communications:delete.
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const VALID_STATUS = ["scheduled", "completed", "cancelled"] as const;

// PUT /api/ptm/[id]
export const PUT = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("PTM id is required");

  const allowed = await checkPermission(session, "communications", "update");
  if (!allowed) return forbidden("No permission to update PTM");

  const existing = await db.ptmSession.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      student: { select: { name: true } },
      teacher: { select: { name: true } },
    },
  });
  if (!existing) return fail("PTM not found", 404);

  const body = await req.json().catch(() => ({}));
  const { status, notes, topic, date, time, duration } = body || {};

  const data: Record<string, unknown> = {};
  if (typeof status === "string" && VALID_STATUS.includes(status as never)) {
    data.status = status;
    if (status === "completed" && !existing.completedAt) data.completedAt = new Date();
  }
  if (typeof notes === "string") data.notes = notes.trim() || null;
  if (typeof topic === "string") data.topic = topic.trim() || null;
  if (typeof date === "string") {
    const d = new Date(date);
    if (!isNaN(d.getTime())) data.date = d;
  }
  if (typeof time === "string" && /^\d{2}:\d{2}$/.test(time)) data.time = time;
  if (Number.isFinite(Number(duration))) data.duration = Number(duration);

  const updated = await db.ptmSession.update({ where: { id }, data });

  await auditAfter(session, {
    action: "update",
    module: "communications",
    entityId: updated.id,
    entityName: `${existing.student.name} ↔ ${existing.teacher.name}`,
    details: data,
  });

  return ok(updated);
});

// DELETE /api/ptm/[id]
export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("PTM id is required");

  const allowed = await checkPermission(session, "communications", "delete");
  if (!allowed) return forbidden("No permission to delete PTM");

  const existing = await db.ptmSession.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      student: { select: { name: true } },
      teacher: { select: { name: true } },
    },
  });
  if (!existing) return fail("PTM not found", 404);

  await db.ptmSession.delete({ where: { id } });

  await auditAfter(session, {
    action: "delete",
    module: "communications",
    entityId: existing.id,
    entityName: `${existing.student.name} ↔ ${existing.teacher.name}`,
    details: { status: existing.status, date: existing.date.toISOString().slice(0, 10) },
  });

  return ok({ id, deleted: true });
});
