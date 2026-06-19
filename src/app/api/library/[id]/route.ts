// Single book API
// PUT    /api/library/[id]   — update book (audit recorded)
// DELETE /api/library/[id]   — delete book (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, unauthorized, notFound, fail, auditAfter } from "@/lib/api";

const CATEGORIES = ["fiqh", "tafsir", "hadith", "nahw", "sarf", "literature", "other"];
type Ctx = { params: Promise<{ id: string }> };

async function getOwned(tenantId: string, id: string) {
  return db.book.findFirst({ where: { id, tenantId } });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Book not found");

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body.titleArabic !== undefined) data.titleArabic = (body.titleArabic as string).trim() || null;
  if (body.author !== undefined) data.author = (body.author as string).trim() || null;
  if (typeof body.category === "string" && CATEGORIES.includes(body.category)) data.category = body.category;
  if (body.isbn !== undefined) data.isbn = (body.isbn as string).trim() || null;
  if (body.shelfLocation !== undefined) data.shelfLocation = (body.shelfLocation as string).trim() || null;
  if (body.description !== undefined) data.description = (body.description as string).trim() || null;
  if (body.totalCopies !== undefined) {
    const n = Number(body.totalCopies);
    if (!Number.isFinite(n) || n < 0) return fail("Invalid copies count");
    // keep availableCopies in sync: delta = newTotal - oldTotal
    const delta = n - existing.totalCopies;
    data.totalCopies = n;
    data.availableCopies = Math.max(0, existing.availableCopies + delta);
  }

  const updated = await db.book.update({ where: { id }, data });
  await auditAfter(session, {
    action: "update",
    module: "library",
    entityId: updated.id,
    entityName: updated.title,
    details: { updatedFields: Object.keys(data) },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const existing = await getOwned(session.tenantId, id);
  if (!existing) return notFound("Book not found");

  await db.book.delete({ where: { id } });
  await auditAfter(session, {
    action: "delete",
    module: "library",
    entityId: existing.id,
    entityName: existing.title,
  });
  return ok({ id: existing.id, deleted: true });
}
