// Classes collection API
// GET  /api/academic/classes   — list classes for current tenant with student counts
// POST /api/academic/classes   — create class (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

const CURRICULA = ["qawmi", "alia"];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = req.nextUrl;
  const search = (url.searchParams.get("search") || "").trim();
  const curriculum = url.searchParams.get("curriculum") || "";

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (curriculum && CURRICULA.includes(curriculum)) where.curriculum = curriculum;
  if (search) where.OR = [{ name: { contains: search } }, { code: { contains: search } }];

  const classes = await db.class.findMany({
    where,
    orderBy: [{ level: "asc" }, { name: "asc" }],
    include: { _count: { select: { students: true } } },
  });

  const items = classes.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    curriculum: c.curriculum,
    level: c.level,
    capacity: c.capacity,
    teacherId: c.teacherId,
    createdAt: c.createdAt.toISOString(),
    _count: { students: c._count.students },
  }));

  return ok({ items, total: items.length });
}

type CreateInput = {
  name?: string;
  code?: string;
  curriculum?: string;
  level?: number;
  capacity?: number;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as CreateInput;
  const name = (body.name || "").trim();
  if (!name) return fail("Name is required");

  const curriculum = body.curriculum && CURRICULA.includes(body.curriculum)
    ? body.curriculum
    : "qawmi";

  const level = Number(body.level);
  const capacity = Number(body.capacity);
  if (Number.isNaN(level) || level < 0) return fail("Invalid level");
  if (Number.isNaN(capacity) || capacity <= 0) return fail("Capacity must be greater than 0");

  // Uniqueness guard (tenantId+name)
  const exists = await db.class.findFirst({
    where: { tenantId: session.tenantId, name },
    select: { id: true },
  });
  if (exists) return fail("A class with this name already exists", 409);

  const created = await db.class.create({
    data: {
      tenantId: session.tenantId,
      name,
      code: (body.code || "").trim() || null,
      curriculum,
      level,
      capacity,
    },
    include: { _count: { select: { students: true } } },
  });

  await auditAfter(session, {
    action: "create",
    module: "academic",
    entityId: created.id,
    entityName: created.name,
    details: { entity: "class", name, curriculum, level, capacity },
  });

  return ok(
    {
      id: created.id,
      name: created.name,
      code: created.code,
      curriculum: created.curriculum,
      level: created.level,
      capacity: created.capacity,
      teacherId: created.teacherId,
      createdAt: created.createdAt.toISOString(),
      _count: { students: created._count.students },
    },
    201
  );
}
