// Audit Log API — list tenant audit logs with filters + pagination + actor name.
// GET /api/audit?action=&module=&actorId=&from=&to=&page=1&limit=50
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";

const ACTIONS = new Set(["create", "update", "delete", "login", "logout"]);

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";
  const moduleFilter = url.searchParams.get("module") || "";
  const actorId = url.searchParams.get("actorId") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (ACTIONS.has(action)) where.action = action;
  if (moduleFilter) where.module = moduleFilter;
  if (actorId) where.actorId = actorId;

  const dateFilter: Record<string, Date> = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) dateFilter.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      dateFilter.lte = d;
    }
  }
  if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

  const [items, total, modules] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where: { tenantId: session.tenantId },
      distinct: ["module"],
      select: { module: true },
      orderBy: { module: "asc" },
    }),
  ]);

  return ok({
    items: items.map((a) => ({
      id: a.id,
      actorId: a.actorId,
      actorName: a.actor?.name ?? null,
      actorPhone: a.actor?.phone ?? null,
      action: a.action,
      module: a.module,
      entityId: a.entityId,
      entityName: a.entityName,
      details: a.details,
      ip: a.ip,
      createdAt: a.createdAt,
    })),
    total,
    page,
    limit,
    modules: modules.map((m) => m.module),
  });
});
