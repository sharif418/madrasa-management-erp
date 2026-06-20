// Website Page [id] API — update & delete (tenant-scoped)
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

type UpdateBody = {
  title?: string;
  slug?: string;
  sections?: unknown;
  isPublished?: boolean;
  isHomepage?: boolean;
};

// PUT /api/website/pages/[id]
export const PUT = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing id");

  const allowed = await checkPermission(session, "website", "update");
  if (!allowed) return forbidden("You don't have permission to update pages");

  const existing = await db.websitePage.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!existing) return notFound("Page not found");

  const body = (await req.json().catch(() => ({}))) as UpdateBody;
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = (body.title || "").trim();
    if (!title) return fail("Title cannot be empty");
    data.title = title;
  }
  if (body.slug !== undefined) data.slug = body.slug.trim() || existing.slug;
  if (body.sections !== undefined) {
    data.sections = JSON.stringify(Array.isArray(body.sections) ? body.sections : []);
  }
  if (body.isPublished !== undefined) data.isPublished = !!body.isPublished;
  if (body.isHomepage !== undefined) data.isHomepage = !!body.isHomepage;

  // If marking as homepage, unset others
  if (data.isHomepage === true) {
    await db.websitePage.updateMany({
      where: { tenantId: session.tenantId, isHomepage: true, NOT: { id } },
      data: { isHomepage: false },
    });
  }

  try {
    const updated = await db.websitePage.update({ where: { id }, data });
    await auditAfter(session, {
      action: "update",
      module: "website",
      entityId: id,
      entityName: updated.title,
      details: { changed: Object.keys(data), type: "page" },
    });
    return ok(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    if (msg.includes("Unique")) return fail("A page with this slug already exists", 409);
    return fail(msg, 500);
  }
});

// DELETE /api/website/pages/[id]
export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing id");

  const allowed = await checkPermission(session, "website", "delete");
  if (!allowed) return forbidden("You don't have permission to delete pages");

  const existing = await db.websitePage.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!existing) return notFound("Page not found");

  await db.websitePage.delete({ where: { id } });
  await auditAfter(session, {
    action: "delete",
    module: "website",
    entityId: id,
    entityName: existing.title,
    details: { slug: existing.slug, type: "page" },
  });
  return ok({ id });
});
