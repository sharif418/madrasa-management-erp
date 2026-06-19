// Single academic level API
// PUT    /api/academic/levels/[id]   — update level (audit recorded)
// DELETE /api/academic/levels/[id]   — delete level (audit recorded, blocked if has classes)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, notFound, auditAfter } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };
const getOwned = (tenantId: string, id: string) =>
  db.academicLevel.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { classes: true } } },
  });

type UpdateInput = {
  name?: string; nameArabic?: string; order?: number;
  durationYears?: number; description?: string;
};

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Level not found");

  const body = (await req.json().catch(() => ({}))) as UpdateInput;
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.nameArabic !== undefined) data.nameArabic = (body.nameArabic || "").trim() || null;
  if (body.order !== undefined) {
    const o = Number(body.order);
    if (Number.isNaN(o) || o < 0) return fail("Invalid order");
    data.order = o;
  }
  if (body.durationYears !== undefined) {
    const d = Number(body.durationYears);
    if (Number.isNaN(d) || d <= 0) return fail("Duration must be greater than 0");
    data.durationYears = d;
  }
  if (body.description !== undefined) data.description = (body.description || "").trim() || null;

  const updated = await db.academicLevel.update({ where: { id }, data });
  await auditAfter(session, {
    action: "update", module: "academic", entityId: updated.id, entityName: updated.name,
    details: { entity: "academic-level", updatedFields: Object.keys(data) },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Level not found");
  if (existing._count.classes > 0) return fail("Cannot delete a level that has classes assigned", 409);

  await db.academicLevel.delete({ where: { id } });
  await auditAfter(session, {
    action: "delete", module: "academic", entityId: existing.id, entityName: existing.name,
    details: { entity: "academic-level" },
  });
  return ok({ id: existing.id, deleted: true });
}
