// Exams API — list (filter + paginate, with class + results count) + create (audit)
// GET  /api/exams?classId=&term=&page=1&limit=20
// POST /api/exams  { name, classId?, term?, startDate?, endDate? }
// All queries scoped by tenantId from session.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const TERMS = new Set(["first", "second", "final"]);

// GET — paginated list with class name + results count
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const classId = url.searchParams.get("classId") || undefined;
  const term = url.searchParams.get("term") || undefined;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (classId) where.classId = classId;
  if (term && TERMS.has(term)) where.term = term;

  const [rows, total] = await Promise.all([
    db.exam.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        class: { select: { id: true, name: true } },
        _count: { select: { results: true } },
      },
    }),
    db.exam.count({ where }),
  ]);

  const items = rows.map((e) => ({
    id: e.id,
    name: e.name,
    classId: e.classId,
    className: e.class?.name ?? null,
    term: e.term,
    startDate: e.startDate ? e.startDate.toISOString() : null,
    endDate: e.endDate ? e.endDate.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    _count: { results: e._count.results },
  }));

  return ok({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

// POST — create exam
type CreateBody = {
  name?: string;
  classId?: string | null;
  term?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export const POST = withSession(async ({ session, req }) => {
  // RBAC: require exams:create permission
  const allowed = await checkPermission(session, "exams", "create");
  if (!allowed) return forbidden("You don't have permission to manage exams");

  const body = (await req.json().catch(() => ({}))) as CreateBody;
  const name = (body.name || "").trim();
  if (!name) return fail("Exam name is required");

  const term = body.term && TERMS.has(body.term) ? body.term : null;

  // Validate classId belongs to this tenant (if provided)
  let classId: string | null = null;
  if (body.classId) {
    const cls = await db.class.findFirst({
      where: { id: body.classId, tenantId: session.tenantId },
      select: { id: true, name: true },
    });
    if (!cls) return fail("Class not found in this tenant", 404);
    classId = cls.id;
  }

  const startDate = body.startDate ? safeDate(body.startDate) : null;
  const endDate = body.endDate ? safeDate(body.endDate) : null;
  if (body.startDate && !startDate) return fail("Invalid startDate");
  if (body.endDate && !endDate) return fail("Invalid endDate");
  if (startDate && endDate && startDate > endDate) return fail("End date must be after start date");

  const created = await db.exam.create({
    data: {
      tenantId: session.tenantId,
      name,
      classId,
      term,
      startDate,
      endDate,
    },
    include: { class: { select: { name: true } } },
  });

  await auditAfter(session, {
    action: "create",
    module: "exams",
    entityId: created.id,
    entityName: created.name,
    details: { name, classId, term, startDate: startDate?.toISOString() ?? null, endDate: endDate?.toISOString() ?? null },
  });

  return ok({
    id: created.id,
    name: created.name,
    classId: created.classId,
    className: created.class?.name ?? null,
    term: created.term,
    startDate: created.startDate ? created.startDate.toISOString() : null,
    endDate: created.endDate ? created.endDate.toISOString() : null,
    createdAt: created.createdAt.toISOString(),
  }, 201);
});

function safeDate(s: string): Date | null {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
