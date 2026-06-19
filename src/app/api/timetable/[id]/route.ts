// Single timetable slot API
// PUT    /api/timetable/[id]   — update slot (audit recorded)
// DELETE /api/timetable/[id]   — delete slot (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, notFound, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const DAYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];
type Ctx = { params: Promise<{ id: string }> };
const getOwned = (tenantId: string, id: string) =>
  db.timetableSlot.findFirst({ where: { id, tenantId } });

type UpdateInput = {
  classId?: string | null; day?: string; startTime?: string; endTime?: string;
  subject?: string; teacherId?: string | null; room?: string | null;
};

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  // RBAC: require academic:update permission (timetable is part of academic module)
  const allowed = await checkPermission(session, "academic", "update");
  if (!allowed) return forbidden("You don't have permission to update timetable slots");
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Slot not found");

  const body = (await req.json().catch(() => ({}))) as UpdateInput;
  const data: Record<string, unknown> = {};
  if (typeof body.subject === "string" && body.subject.trim()) data.subject = body.subject.trim();
  if (body.day && DAYS.includes(body.day.toLowerCase())) data.day = body.day.toLowerCase();
  if (typeof body.startTime === "string" && body.startTime.trim()) data.startTime = body.startTime.trim();
  if (typeof body.endTime === "string" && body.endTime.trim()) data.endTime = body.endTime.trim();
  if (body.room !== undefined) data.room = (body.room || "").trim() || null;

  const newStart = (data.startTime as string) ?? existing.startTime;
  const newEnd = (data.endTime as string) ?? existing.endTime;
  if (newStart >= newEnd) return fail("End time must be after start time");

  if (body.classId !== undefined) {
    const cid = (body.classId || "").trim();
    if (cid) {
      const cls = await db.class.findFirst({ where: { id: cid, tenantId: session.tenantId }, select: { id: true } });
      if (!cls) return fail("Class not found", 404);
      data.classId = cls.id;
    } else data.classId = null;
  }
  if (body.teacherId !== undefined) {
    const tid = (body.teacherId || "").trim();
    if (tid) {
      const tc = await db.teacher.findFirst({ where: { id: tid, tenantId: session.tenantId }, select: { id: true } });
      if (!tc) return fail("Teacher not found", 404);
      data.teacherId = tc.id;
    } else data.teacherId = null;
  }

  const updated = await db.timetableSlot.update({ where: { id }, data });
  await auditAfter(session, {
    action: "update", module: "timetable", entityId: updated.id, entityName: updated.subject,
    details: { entity: "timetable-slot", updatedFields: Object.keys(data) },
  });
  return ok({ ...updated, createdAt: updated.createdAt.toISOString() });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  // RBAC: require academic:delete permission (timetable is part of academic module)
  const allowed = await checkPermission(session, "academic", "delete");
  if (!allowed) return forbidden("You don't have permission to delete timetable slots");
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Slot not found");

  await db.timetableSlot.delete({ where: { id } });
  await auditAfter(session, {
    action: "delete", module: "timetable", entityId: existing.id, entityName: existing.subject,
    details: { entity: "timetable-slot", day: existing.day, startTime: existing.startTime },
  });
  return ok({ id: existing.id, deleted: true });
}
