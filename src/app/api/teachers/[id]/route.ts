// Single teacher API
// GET    /api/teachers/[id]   — fetch one teacher (tenant scoped)
// PUT    /api/teachers/[id]   — update (audit recorded)
// DELETE /api/teachers/[id]   — delete (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, unauthorized, notFound, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const SPECIALIZATIONS = ["hifz", "fiqh", "tafsir", "arabic", "general"];

type Ctx = { params: Promise<{ id: string }> };

async function getOwned(session: { tenantId: string }, id: string) {
  return db.teacher.findFirst({ where: { id, tenantId: session.tenantId } });
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const teacher = await getOwned(session, id);
  if (!teacher) return notFound("Teacher not found");
  return ok(teacher);
}

type UpdateInput = {
  name?: string;
  nameArabic?: string;
  phone?: string;
  email?: string;
  gender?: string;
  designation?: string;
  specialization?: string | null;
  salary?: number;
  joinDate?: string;
  address?: string;
  photoUrl?: string;
  isActive?: boolean;
};

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  // RBAC: require teachers:update permission
  const allowed = await checkPermission(session, "teachers", "update");
  if (!allowed) return forbidden("You don't have permission to update teachers");
  const { id } = await ctx.params;
  const existing = await getOwned(session, id);
  if (!existing) return notFound("Teacher not found");

  const body = (await req.json().catch(() => ({}))) as UpdateInput;
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.nameArabic !== undefined) data.nameArabic = body.nameArabic.trim() || null;
  if (body.phone !== undefined) data.phone = body.phone.trim() || null;
  if (body.email !== undefined) data.email = body.email.trim() || null;
  if (body.gender) data.gender = body.gender === "female" ? "female" : "male";
  if (body.designation !== undefined) data.designation = body.designation.trim() || null;
  if (body.specialization !== undefined) {
    data.specialization =
      body.specialization && SPECIALIZATIONS.includes(body.specialization)
        ? body.specialization
        : null;
  }
  if (body.salary !== undefined) {
    const n = Number(body.salary);
    if (!Number.isNaN(n)) data.salary = n;
  }
  if (body.joinDate) data.joinDate = new Date(body.joinDate);
  if (body.address !== undefined) data.address = body.address.trim() || null;
  if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl.trim() || null;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const updated = await db.teacher.update({ where: { id }, data });
  await auditAfter(session, {
    action: "update",
    module: "teachers",
    entityId: updated.id,
    entityName: updated.name,
    details: { updatedFields: Object.keys(data) },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  // RBAC: require teachers:delete permission
  const allowed = await checkPermission(session, "teachers", "delete");
  if (!allowed) return forbidden("You don't have permission to delete teachers");
  const { id } = await ctx.params;
  const existing = await getOwned(session, id);
  if (!existing) return notFound("Teacher not found");

  await db.teacher.delete({ where: { id } });
  await auditAfter(session, {
    action: "delete",
    module: "teachers",
    entityId: existing.id,
    entityName: existing.name,
  });
  return ok({ id: existing.id, deleted: true });
}
