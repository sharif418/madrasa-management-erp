// Notice by id — PUT (audit), DELETE (audit). Tenant-scoped.
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter } from "@/lib/api";

const TYPES = new Set(["general", "urgent", "holiday", "exam", "event"]);
const AUDIENCES = new Set(["all", "teachers", "students", "guardians"]);

const getOwned = (id: string, tenantId: string) =>
  db.notice.findFirst({ where: { id, tenantId } });

// PUT /api/notices/[id]
export const PUT = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing notice id");
  const existing = await getOwned(id, session.tenantId);
  if (!existing) return notFound("Notice not found");

  const body = (await req.json().catch(() => ({}))) as {
    title?: string; content?: string; type?: string;
    audience?: string; expiresAt?: string | null;
  };
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const title = (body.title || "").trim();
    if (!title) return fail("Title cannot be empty");
    data.title = title;
  }
  if (body.content !== undefined) {
    const content = (body.content || "").trim();
    if (!content) return fail("Content cannot be empty");
    data.content = content;
  }
  if (body.type && TYPES.has(body.type)) data.type = body.type;
  if (body.audience && AUDIENCES.has(body.audience)) data.audience = body.audience;
  if (body.expiresAt !== undefined) {
    if (!body.expiresAt) data.expiresAt = null;
    else {
      const d = new Date(body.expiresAt);
      if (isNaN(d.getTime())) return fail("Invalid expiresAt");
      data.expiresAt = d;
    }
  }

  const u = await db.notice.update({ where: { id }, data });
  await auditAfter(session, {
    action: "update", module: "notices", entityId: id, entityName: u.title,
    details: { changed: Object.keys(data) },
  });
  return ok({
    id: u.id, title: u.title, content: u.content, type: u.type, audience: u.audience,
    publishedAt: u.publishedAt.toISOString(),
    expiresAt: u.expiresAt ? u.expiresAt.toISOString() : null,
  });
});

// DELETE /api/notices/[id]
export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing notice id");
  const existing = await getOwned(id, session.tenantId);
  if (!existing) return notFound("Notice not found");
  await db.notice.delete({ where: { id } });
  await auditAfter(session, {
    action: "delete", module: "notices", entityId: id, entityName: existing.title,
  });
  return ok({ id });
});
