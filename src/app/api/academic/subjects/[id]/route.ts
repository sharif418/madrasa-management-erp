// Single subject API
// PUT    /api/academic/subjects/[id]   — update (audit recorded)
// DELETE /api/academic/subjects/[id]   — delete (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, notFound, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const TYPES = ["academic", "quranic", "arabic", "general"];
type Ctx = { params: Promise<{ id: string }> };

async function getOwned(tenantId: string, id: string) {
  return db.subject.findFirst({
    where: { id, tenantId },
    include: { class: { select: { id: true, name: true } } },
  });
}

type UpdateInput = {
  name?: string;
  code?: string;
  type?: string;
  classId?: string | null;
};

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  // RBAC: require academic:update permission
  const allowed = await checkPermission(session, "academic", "update");
  if (!allowed) return forbidden("You don't have permission to update subjects");
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Subject not found");

  const body = (await req.json().catch(() => ({}))) as UpdateInput;
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.code !== undefined) data.code = body.code.trim() || null;
  if (body.type && TYPES.includes(body.type)) data.type = body.type;

  if (body.classId !== undefined) {
    const cid = (body.classId || "").trim();
    if (cid) {
      const cls = await db.class.findFirst({
        where: { id: cid, tenantId: session.tenantId },
        select: { id: true },
      });
      if (!cls) return fail("Class not found", 404);
      data.classId = cls.id;
    } else {
      data.classId = null;
    }
  }

  const updated = await db.subject.update({
    where: { id },
    data,
    include: { class: { select: { id: true, name: true } } },
  });
  await auditAfter(session, {
    action: "update",
    module: "academic",
    entityId: updated.id,
    entityName: updated.name,
    details: { entity: "subject", updatedFields: Object.keys(data) },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  // RBAC: require academic:delete permission
  const allowed = await checkPermission(session, "academic", "delete");
  if (!allowed) return forbidden("You don't have permission to delete subjects");
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Subject not found");

  await db.subject.delete({ where: { id } });
  await auditAfter(session, {
    action: "delete",
    module: "academic",
    entityId: existing.id,
    entityName: existing.name,
    details: { entity: "subject" },
  });
  return ok({ id: existing.id, deleted: true });
}
