// Website CMS API — GET (public preview data) + POST (update tenant + optionally post a notice)
// All scoped to session.tenantId.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

// GET /api/website — returns everything the public website preview needs
export const GET = withSession(async ({ session }) => {
  const [tenant, students, alumni, teachers, notices, events] = await Promise.all([
    db.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true, name: true, subdomain: true, logoUrl: true,
        phone: true, email: true, address: true,
        language: true, theme: true, plan: true, createdAt: true,
      },
    }),
    db.student.count({ where: { tenantId: session.tenantId, isActive: true } }),
    db.alumni.count({ where: { tenantId: session.tenantId, isActive: true } }),
    db.teacher.count({ where: { tenantId: session.tenantId, isActive: true } }),
    db.notice.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    db.calendarEvent.findMany({
      where: { tenantId: session.tenantId, startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
  ]);

  if (!tenant) return fail("Tenant not found", 404);

  const establishedYear = new Date(tenant.createdAt).getFullYear();

  return ok({
    tenant,
    stats: {
      activeStudents: students,
      alumni,
      staff: teachers,
      yearsOfService: Math.max(1, new Date().getFullYear() - establishedYear),
      establishedYear,
    },
    notices: notices.map((n) => ({
      id: n.id, title: n.title, type: n.type,
      publishedAt: n.publishedAt.toISOString(),
    })),
    events: events.map((e) => ({
      id: e.id, title: e.title, type: e.type, location: e.location,
      startDate: e.startDate.toISOString(),
    })),
  });
});

type UpdateBody = {
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  announcement?: { title: string; content: string; type?: string };
};

// POST /api/website — update tenant contact info; optionally publish an announcement notice
export const POST = withSession(async ({ session, req }) => {
  // RBAC: require website:update permission
  const allowed = await checkPermission(session, "website", "update");
  if (!allowed) return forbidden("You don't have permission to update website settings");

  const body = (await req.json().catch(() => ({}))) as UpdateBody;
  const data: Record<string, unknown> = {};

  if (body.logoUrl !== undefined) data.logoUrl = (body.logoUrl || "").trim() || null;
  if (body.phone !== undefined) data.phone = (body.phone || "").trim() || null;
  if (body.email !== undefined) data.email = (body.email || "").trim() || null;
  if (body.address !== undefined) data.address = (body.address || "").trim() || null;

  let updatedTenant = null;
  if (Object.keys(data).length > 0) {
    updatedTenant = await db.tenant.update({
      where: { id: session.tenantId },
      data,
      select: {
        id: true, name: true, subdomain: true, logoUrl: true,
        phone: true, email: true, address: true,
        language: true, theme: true, plan: true, createdAt: true,
      },
    });
    await auditAfter(session, {
      action: "update",
      module: "website",
      entityName: updatedTenant.name,
      details: { changed: Object.keys(data) },
    });
  }

  let createdNotice = null;
  if (body.announcement && body.announcement.title?.trim() && body.announcement.content?.trim()) {
    const allowed = ["general", "urgent", "holiday", "exam", "event"];
    const type = allowed.includes(body.announcement.type || "") ? body.announcement.type! : "general";
    createdNotice = await db.notice.create({
      data: {
        tenantId: session.tenantId,
        title: body.announcement.title.trim(),
        content: body.announcement.content.trim(),
        type,
        audience: "all",
      },
    });
    await auditAfter(session, {
      action: "create",
      module: "website",
      entityId: createdNotice.id,
      entityName: createdNotice.title,
      details: { type, source: "website-cms" },
    });
  }

  if (!updatedTenant && !createdNotice) {
    return fail("No valid fields to update");
  }

  return ok({ tenant: updatedTenant, notice: createdNotice });
});
