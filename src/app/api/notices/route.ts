// Notices API — list (filter + paginate) + create (audit)
// GET  /api/notices?type=&audience=&page=1&limit=20
// POST /api/notices  { title, content, type, audience, expiresAt? }
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

const TYPES = new Set(["general", "urgent", "holiday", "exam", "event"]);
const AUDIENCES = new Set(["all", "teachers", "students", "guardians"]);

// GET — paginated list
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "";
  const audience = url.searchParams.get("audience") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (type && TYPES.has(type)) where.type = type;
  if (audience && AUDIENCES.has(audience)) where.audience = audience;

  const [rows, total] = await Promise.all([
    db.notice.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notice.count({ where }),
  ]);

  const items = rows.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    type: n.type,
    audience: n.audience,
    publishedAt: n.publishedAt.toISOString(),
    expiresAt: n.expiresAt ? n.expiresAt.toISOString() : null,
  }));

  return ok({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

// POST — create notice
type CreateBody = {
  title?: string;
  content?: string;
  type?: string;
  audience?: string;
  expiresAt?: string | null;
};

export const POST = withSession(async ({ session, req }) => {
  const body = (await req.json().catch(() => ({}))) as CreateBody;
  const title = (body.title || "").trim();
  const content = (body.content || "").trim();
  if (!title) return fail("Title is required");
  if (!content) return fail("Content is required");
  const type = body.type && TYPES.has(body.type) ? body.type : "general";
  const audience = body.audience && AUDIENCES.has(body.audience) ? body.audience : "all";

  let expiresAt: Date | null = null;
  if (body.expiresAt) {
    const d = new Date(body.expiresAt);
    if (!isNaN(d.getTime())) expiresAt = d;
  }

  const created = await db.notice.create({
    data: {
      tenantId: session.tenantId,
      title,
      content,
      type,
      audience,
      expiresAt,
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "notices",
    entityId: created.id,
    entityName: created.title,
    details: { type, audience, expiresAt: expiresAt?.toISOString() ?? null },
  });

  return ok({
    id: created.id,
    title: created.title,
    content: created.content,
    type: created.type,
    audience: created.audience,
    publishedAt: created.publishedAt.toISOString(),
    expiresAt: created.expiresAt ? created.expiresAt.toISOString() : null,
  }, 201);
});
