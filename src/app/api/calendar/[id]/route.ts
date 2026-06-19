// Single event API
// PUT    /api/calendar/[id]   — update event (audit recorded)
// DELETE /api/calendar/[id]   — delete event (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, unauthorized, notFound, fail, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const TYPES = ["exam", "holiday", "islamic", "meeting", "admission", "result", "event"];
const AUDIENCES = ["all", "staff", "parents", "students"];
type Ctx = { params: Promise<{ id: string }> };

async function getOwned(tenantId: string, id: string) {
  return db.calendarEvent.findFirst({ where: { id, tenantId } });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  // RBAC: require calendar:update permission
  const allowed = await checkPermission(session, "calendar", "update");
  if (!allowed) return forbidden("You don't have permission to update calendar events");
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Event not found");

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body.titleArabic !== undefined) data.titleArabic = (body.titleArabic as string).trim() || null;
  if (body.description !== undefined) data.description = (body.description as string).trim() || null;
  if (typeof body.type === "string" && TYPES.includes(body.type)) data.type = body.type;
  if (typeof body.audience === "string" && AUDIENCES.includes(body.audience)) data.audience = body.audience;
  if (body.location !== undefined) data.location = (body.location as string).trim() || null;
  if (typeof body.isAllDay === "boolean") data.isAllDay = body.isAllDay;
  if (typeof body.isHighlighted === "boolean") data.isHighlighted = body.isHighlighted;
  if (body.startDate) {
    const d = new Date(body.startDate as string);
    if (!isNaN(d.getTime())) data.startDate = d;
    else return fail("Invalid start date");
  }
  if (body.endDate !== undefined) {
    if (body.endDate === null || body.endDate === "") {
      data.endDate = null;
    } else {
      const d = new Date(body.endDate as string);
      if (!isNaN(d.getTime())) data.endDate = d;
      else return fail("Invalid end date");
    }
  }

  const updated = await db.calendarEvent.update({ where: { id }, data });
  await auditAfter(session, {
    action: "update",
    module: "calendar",
    entityId: updated.id,
    entityName: updated.title,
    details: { updatedFields: Object.keys(data) },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  // RBAC: require calendar:delete permission
  const allowed = await checkPermission(session, "calendar", "delete");
  if (!allowed) return forbidden("You don't have permission to delete calendar events");
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Event not found");

  await db.calendarEvent.delete({ where: { id } });
  await auditAfter(session, {
    action: "delete",
    module: "calendar",
    entityId: existing.id,
    entityName: existing.title,
  });
  return ok({ id: existing.id, deleted: true });
}
