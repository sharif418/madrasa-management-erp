// Website Pages API — list & create (tenant-scoped)
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

// GET /api/website/pages — list all pages for current tenant
export const GET = withSession(async ({ session }) => {
  const pages = await db.websitePage.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ isHomepage: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true, title: true, slug: true,
      isPublished: true, isHomepage: true,
      createdAt: true, updatedAt: true,
    },
  });
  return ok(pages);
});

type CreateBody = {
  title?: string;
  slug?: string;
  sections?: unknown;
  isPublished?: boolean;
  isHomepage?: boolean;
};

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || `page-${Date.now().toString(36)}`;
}

// POST /api/website/pages — create a new page
export const POST = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "website", "create");
  if (!allowed) return forbidden("You don't have permission to create pages");

  const body = (await req.json().catch(() => ({}))) as CreateBody;
  const title = (body.title || "").trim();
  if (!title) return fail("Title is required");

  const slug = slugify(body.slug || title);
  const sections = Array.isArray(body.sections) ? body.sections : [];

  // If isHomepage, unset existing homepage
  if (body.isHomepage) {
    await db.websitePage.updateMany({
      where: { tenantId: session.tenantId, isHomepage: true },
      data: { isHomepage: false },
    });
  }

  try {
    const page = await db.websitePage.create({
      data: {
        tenantId: session.tenantId,
        title,
        slug,
        sections: JSON.stringify(sections),
        isPublished: !!body.isPublished,
        isHomepage: !!body.isHomepage,
      },
    });
    await auditAfter(session, {
      action: "create",
      module: "website",
      entityId: page.id,
      entityName: page.title,
      details: { slug, type: "page" },
    });
    return ok(page);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    if (msg.includes("Unique")) return fail("A page with this slug already exists", 409);
    return fail(msg, 500);
  }
});
