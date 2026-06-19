// Single class API
// GET    /api/academic/classes/[id]   — fetch one class (tenant scoped)
// PUT    /api/academic/classes/[id]   — update (audit recorded)
// DELETE /api/academic/classes/[id]   — delete; blocked if has students (400)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, notFound, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const CURRICULA = ["qawmi", "alia"];
type Ctx = { params: Promise<{ id: string }> };

async function getOwned(tenantId: string, id: string) {
  return db.class.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { students: true } } },
  });
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const cls = await getOwned(session.tenantId, id);
  if (!cls) return notFound("Class not found");
  return ok(cls);
}

type UpdateInput = {
  name?: string;
  code?: string;
  curriculum?: string;
  level?: number;
  capacity?: number;
};

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  // RBAC: require academic:update permission
  const allowed = await checkPermission(session, "academic", "update");
  if (!allowed) return forbidden("You don't have permission to update classes");
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Class not found");

  const body = (await req.json().catch(() => ({}))) as UpdateInput;
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.code !== undefined) data.code = body.code.trim() || null;
  if (body.curriculum && CURRICULA.includes(body.curriculum)) data.curriculum = body.curriculum;
  if (body.level !== undefined) {
    const n = Number(body.level);
    if (!Number.isNaN(n) && n >= 0) data.level = n;
  }
  if (body.capacity !== undefined) {
    const n = Number(body.capacity);
    if (!Number.isNaN(n) && n > 0) data.capacity = n;
  }

  const updated = await db.class.update({
    where: { id },
    data,
    include: { _count: { select: { students: true } } },
  });
  await auditAfter(session, {
    action: "update",
    module: "academic",
    entityId: updated.id,
    entityName: updated.name,
    details: { entity: "class", updatedFields: Object.keys(data) },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  // RBAC: require academic:delete permission
  const allowed = await checkPermission(session, "academic", "delete");
  if (!allowed) return forbidden("You don't have permission to delete classes");
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Class not found");

  if (existing._count.students > 0) {
    return fail(
      "Cannot delete a class with enrolled students. Please move or remove them first.",
      400
    );
  }

  await db.class.delete({ where: { id } });
  await auditAfter(session, {
    action: "delete",
    module: "academic",
    entityId: existing.id,
    entityName: existing.name,
    details: { entity: "class" },
  });
  return ok({ id: existing.id, deleted: true });
}
