// Subjects collection API
// GET  /api/academic/subjects   — list subjects (filter by ?type= and ?classId=)
// POST /api/academic/subjects   — create subject (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const TYPES = ["academic", "quranic", "arabic", "general"];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = req.nextUrl;
  const type = url.searchParams.get("type") || "";
  const classId = url.searchParams.get("classId") || "";
  const search = (url.searchParams.get("search") || "").trim();

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (type && TYPES.includes(type)) where.type = type;
  if (classId) where.classId = classId;
  if (search) where.OR = [{ name: { contains: search } }, { code: { contains: search } }];

  const subjects = await db.subject.findMany({
    where,
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: { class: { select: { id: true, name: true } } },
  });

  const items = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    type: s.type,
    classId: s.classId,
    createdAt: s.createdAt.toISOString(),
    class: s.class ? { id: s.class.id, name: s.class.name } : null,
  }));

  return ok({ items, total: items.length });
}

type CreateInput = {
  name?: string;
  code?: string;
  type?: string;
  classId?: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  // RBAC: require academic:create permission
  const allowed = await checkPermission(session, "academic", "create");
  if (!allowed) return forbidden("You don't have permission to create subjects");

  const body = (await req.json().catch(() => ({}))) as CreateInput;
  const name = (body.name || "").trim();
  if (!name) return fail("Name is required");

  const type = body.type && TYPES.includes(body.type) ? body.type : "academic";

  const classId = (body.classId || "").trim();
  let classConnectId: string | null = null;
  if (classId) {
    const cls = await db.class.findFirst({
      where: { id: classId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (!cls) return fail("Class not found", 404);
    classConnectId = cls.id;
  }

  const exists = await db.subject.findFirst({
    where: { tenantId: session.tenantId, name },
    select: { id: true },
  });
  if (exists) return fail("A subject with this name already exists", 409);

  const created = await db.subject.create({
    data: {
      tenantId: session.tenantId,
      name,
      code: (body.code || "").trim() || null,
      type,
      classId: classConnectId,
    },
    include: { class: { select: { id: true, name: true } } },
  });

  await auditAfter(session, {
    action: "create",
    module: "academic",
    entityId: created.id,
    entityName: created.name,
    details: { entity: "subject", name, type, classId: classConnectId },
  });

  return ok(
    {
      id: created.id,
      name: created.name,
      code: created.code,
      type: created.type,
      classId: created.classId,
      createdAt: created.createdAt.toISOString(),
      class: created.class ? { id: created.class.id, name: created.class.name } : null,
    },
    201
  );
}
