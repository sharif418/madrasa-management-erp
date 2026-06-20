// Fee Structures API — list (with class + collection count) + create.
// Tenant-scoped. RBAC: finance:create for POST.
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const VALID_TYPES = ["tuition", "admission", "exam", "hostel", "transport"] as const;
const VALID_FREQ = ["monthly", "quarterly", "yearly", "one_time"] as const;
type FeeType = (typeof VALID_TYPES)[number];
type FeeFreq = (typeof VALID_FREQ)[number];

// GET /api/fee-structures — all structures for current tenant w/ class + count
export const GET = withSession(async ({ session }) => {
  const items = await db.feeStructure.findMany({
    where: { tenantId: session.tenantId },
    include: {
      class: { select: { id: true, name: true } },
      _count: { select: { collections: true } },
    },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
  });

  const data = items.map((s) => ({
    id: s.id,
    name: s.name,
    amount: s.amount,
    type: s.type,
    frequency: s.frequency,
    classId: s.classId,
    className: s.class?.name ?? null,
    createdAt: s.createdAt,
    collectionsCount: s._count.collections,
  }));

  return ok({ items: data });
});

// POST /api/fee-structures — create a fee structure
export const POST = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "finance", "create");
  if (!allowed) return forbidden("No permission to create fee structures");

  const body = await req.json().catch(() => ({}));
  const { name, classId, amount, type, frequency } = body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return fail("Fee name is required");
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return fail("Valid amount is required");

  const t: FeeType = VALID_TYPES.includes(type) ? (type as FeeType) : "tuition";
  const f: FeeFreq = VALID_FREQ.includes(frequency) ? (frequency as FeeFreq) : "monthly";

  // Optional classId must belong to tenant
  let resolvedClassId: string | null = null;
  if (classId && typeof classId === "string") {
    const cls = await db.class.findFirst({
      where: { id: classId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (!cls) return fail("Class not found");
    resolvedClassId = cls.id;
  }

  const created = await db.feeStructure.create({
    data: {
      tenantId: session.tenantId,
      name: name.trim(),
      classId: resolvedClassId,
      amount: amt,
      type: t,
      frequency: f,
    },
    include: { class: { select: { name: true } } },
  });

  await auditAfter(session, {
    action: "create",
    module: "finance",
    entityId: created.id,
    entityName: created.name,
    details: { type: t, frequency: f, amount: amt, classId: resolvedClassId },
  });

  return ok(created, 201);
});
