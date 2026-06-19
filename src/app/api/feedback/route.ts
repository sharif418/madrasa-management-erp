// Feedback & Complaints API
// GET  /api/feedback?type=&status=  — list feedback
// POST /api/feedback               — create feedback
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

const TYPES = new Set(["complaint", "suggestion", "appreciation", "grievance"]);
const CATEGORIES = new Set(["academic", "residential", "mess", "transport", "finance", "staff", "other"]);
const STATUSES = new Set(["open", "in_review", "resolved", "closed"]);
const PRIORITIES = new Set(["low", "medium", "high", "urgent"]);
const ROLES = new Set(["parent", "student", "staff", "visitor"]);

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "";
  const status = url.searchParams.get("status") || "";

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (type && TYPES.has(type)) where.type = type;
  if (status && STATUSES.has(status)) where.status = status;

  const items = await db.feedback.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    take: 200,
  });

  // KPIs
  const [openCount, resolvedCount, ratings] = await Promise.all([
    db.feedback.count({ where: { tenantId: session.tenantId, status: { in: ["open", "in_review"] } } }),
    db.feedback.count({ where: { tenantId: session.tenantId, status: "resolved" } }),
    db.feedback.aggregate({
      where: { tenantId: session.tenantId, rating: { not: null } },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  return ok({
    items: items.map((f) => ({
      id: f.id,
      type: f.type,
      category: f.category,
      subject: f.subject,
      description: f.description,
      submittedBy: f.submittedBy,
      submitterRole: f.submitterRole,
      contact: f.contact,
      priority: f.priority,
      status: f.status,
      assignedTo: f.assignedTo,
      resolution: f.resolution,
      rating: f.rating,
      submittedAt: f.submittedAt.toISOString(),
      resolvedAt: f.resolvedAt ? f.resolvedAt.toISOString() : null,
    })),
    kpis: {
      open: openCount,
      resolved: resolvedCount,
      avgRating: ratings._avg.rating ? Math.round((ratings._avg.rating as number) * 10) / 10 : 0,
      ratedCount: ratings._count,
    },
  });
});

type Body = {
  type?: string;
  category?: string;
  subject?: string;
  description?: string;
  submittedBy?: string;
  submitterRole?: string;
  contact?: string;
  priority?: string;
  rating?: number;
};

export const POST = withSession(async ({ session, req }) => {
  const body = (await req.json().catch(() => ({}))) as Body;
  const subject = (body.subject || "").trim();
  const description = (body.description || "").trim();
  const submittedBy = (body.submittedBy || "").trim();
  if (!subject) return fail("Subject is required");
  if (!description) return fail("Description is required");
  if (!submittedBy) return fail("Submitter name is required");

  const type = body.type && TYPES.has(body.type) ? body.type : "complaint";
  const category = body.category && CATEGORIES.has(body.category) ? body.category : "other";
  const priority = body.priority && PRIORITIES.has(body.priority) ? body.priority : "medium";
  const submitterRole = body.submitterRole && ROLES.has(body.submitterRole) ? body.submitterRole : "parent";
  const rating = body.rating && body.rating >= 1 && body.rating <= 5 ? Math.round(body.rating) : null;

  const created = await db.feedback.create({
    data: {
      tenantId: session.tenantId,
      type, category, subject, description,
      submittedBy, submitterRole,
      contact: body.contact?.trim() || null,
      priority, status: "open",
      rating,
    },
  });

  await auditAfter(session, {
    action: "create", module: "feedback", entityId: created.id,
    entityName: subject, details: { type, priority, category },
  });

  return ok(created, 201);
});
