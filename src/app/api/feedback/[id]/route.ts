// Feedback detail — PATCH status / assign / resolve
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter } from "@/lib/api";

const STATUSES = new Set(["open", "in_review", "resolved", "closed"]);

type Body = {
  status?: string;
  assignedTo?: string;
  resolution?: string;
};

export const PATCH = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing feedback id");

  const existing = await db.feedback.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, subject: true, status: true },
  });
  if (!existing) return notFound("Feedback not found");

  const body = (await req.json().catch(() => ({}))) as Body;
  const data: Record<string, unknown> = {};
  if (body.status && STATUSES.has(body.status)) data.status = body.status;
  if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo?.trim() || null;
  if (body.resolution !== undefined) data.resolution = body.resolution?.trim() || null;
  if (data.status === "resolved" && !data.resolution) {
    // do not force resolution text; allow resolve without
  }
  if (data.status === "resolved" || data.status === "closed") {
    data.resolvedAt = new Date();
  }

  const updated = await db.feedback.update({ where: { id }, data });

  await auditAfter(session, {
    action: "update", module: "feedback", entityId: id,
    entityName: existing.subject, details: { changed: Object.keys(data), from: existing.status },
  });

  return ok(updated);
});
