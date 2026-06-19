// Single donor API
// PUT    /api/donors/[id]   — update donor (audit recorded)
// DELETE /api/donors/[id]   — delete donor (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, unauthorized, notFound, auditAfter } from "@/lib/api";

const TYPES = ["individual", "organization", "recurring"];
const FUNDS = ["zakat", "lillah", "waqf", "sadaqah", "general"];
type Ctx = { params: Promise<{ id: string }> };

async function getOwned(tenantId: string, id: string) {
  return db.donor.findFirst({ where: { id, tenantId } });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Donor not found");

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.nameArabic !== undefined) data.nameArabic = (body.nameArabic as string).trim() || null;
  if (body.email !== undefined) data.email = (body.email as string).trim() || null;
  if (body.phone !== undefined) data.phone = (body.phone as string).trim() || null;
  if (body.address !== undefined) data.address = (body.address as string).trim() || null;
  if (body.country !== undefined) data.country = (body.country as string).trim() || "Bangladesh";
  if (typeof body.type === "string" && TYPES.includes(body.type)) data.type = body.type;
  if (body.preferredFund !== undefined) {
    data.preferredFund = FUNDS.includes(body.preferredFund as string) ? body.preferredFund : null;
  }
  if (typeof body.isRecurring === "boolean") data.isRecurring = body.isRecurring;
  if (body.notes !== undefined) data.notes = (body.notes as string).trim() || null;

  const updated = await db.donor.update({ where: { id }, data });
  await auditAfter(session, {
    action: "update",
    module: "donors",
    entityId: updated.id,
    entityName: updated.name,
    details: { updatedFields: Object.keys(data) },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Donor not found");

  await db.donor.delete({ where: { id } });
  await auditAfter(session, {
    action: "delete",
    module: "donors",
    entityId: existing.id,
    entityName: existing.name,
  });
  return ok({ id: existing.id, deleted: true });
}
