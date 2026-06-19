// Academic Levels collection API
// GET  /api/academic/levels   — list levels for current tenant with class counts
// POST /api/academic/levels   — create level (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  // Optional curriculum filter (qawmi / alia) — based on level name heuristic is hard,
  // so we leave the API returning all levels; the UI can split.
  void req;

  const levels = await db.academicLevel.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { classes: true } } },
  });

  const items = levels.map((l) => ({
    id: l.id,
    name: l.name,
    nameArabic: l.nameArabic,
    order: l.order,
    durationYears: l.durationYears,
    description: l.description,
    createdAt: l.createdAt.toISOString(),
    _count: { classes: l._count.classes },
  }));

  return ok({ items, total: items.length });
}

type CreateInput = {
  name?: string;
  nameArabic?: string;
  order?: number;
  durationYears?: number;
  description?: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as CreateInput;
  const name = (body.name || "").trim();
  if (!name) return fail("Level name is required");

  const order = Number(body.order);
  const durationYears = Number(body.durationYears);
  if (Number.isNaN(order) || order < 0) return fail("Invalid order");
  if (Number.isNaN(durationYears) || durationYears <= 0) return fail("Duration must be greater than 0");

  const created = await db.academicLevel.create({
    data: {
      tenantId: session.tenantId,
      name,
      nameArabic: (body.nameArabic || "").trim() || null,
      order,
      durationYears,
      description: (body.description || "").trim() || null,
    },
    include: { _count: { select: { classes: true } } },
  });

  await auditAfter(session, {
    action: "create",
    module: "academic",
    entityId: created.id,
    entityName: created.name,
    details: { entity: "academic-level", name, order, durationYears },
  });

  return ok(
    {
      id: created.id,
      name: created.name,
      nameArabic: created.nameArabic,
      order: created.order,
      durationYears: created.durationYears,
      description: created.description,
      createdAt: created.createdAt.toISOString(),
      _count: { classes: created._count.classes },
    },
    201
  );
}
