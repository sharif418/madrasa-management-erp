// Fee Structures [id] API — PUT (update) + DELETE (with collection guard).
// Tenant-scoped. RBAC: finance:update / finance:delete.
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const VALID_TYPES = ["tuition", "admission", "exam", "hostel", "transport"] as const;
const VALID_FREQ = ["monthly", "quarterly", "yearly", "one_time"] as const;

// PUT /api/fee-structures/[id]
export const PUT = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Fee structure id is required");

  const allowed = await checkPermission(session, "finance", "update");
  if (!allowed) return forbidden("No permission to update fee structures");

  const existing = await db.feeStructure.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!existing) return fail("Fee structure not found", 404);

  const body = await req.json().catch(() => ({}));
  const { name, classId, amount, type, frequency } = body || {};

  const data: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  const amt = Number(amount);
  if (Number.isFinite(amt) && amt > 0) data.amount = amt;
  if (typeof type === "string" && VALID_TYPES.includes(type as never)) data.type = type;
  if (typeof frequency === "string" && VALID_FREQ.includes(frequency as never)) {
    data.frequency = frequency;
  }

  // classId: null = all classes, string = must belong to tenant
  if (classId === null) {
    data.classId = null;
  } else if (typeof classId === "string" && classId) {
    const cls = await db.class.findFirst({
      where: { id: classId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (!cls) return fail("Class not found");
    data.classId = cls.id;
  }

  const updated = await db.feeStructure.update({
    where: { id },
    data,
    include: { class: { select: { name: true } } },
  });

  await auditAfter(session, {
    action: "update",
    module: "finance",
    entityId: updated.id,
    entityName: updated.name,
    details: data,
  });

  return ok(updated);
});

// DELETE /api/fee-structures/[id] — blocked if has collections
export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Fee structure id is required");

  const allowed = await checkPermission(session, "finance", "delete");
  if (!allowed) return forbidden("No permission to delete fee structures");

  const existing = await db.feeStructure.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { _count: { select: { collections: true } } },
  });
  if (!existing) return fail("Fee structure not found", 404);

  if (existing._count.collections > 0) {
    return fail(
      `Cannot delete: ${existing._count.collections} collection(s) reference this structure. Remove them first.`
    );
  }

  await db.feeStructure.delete({ where: { id } });

  await auditAfter(session, {
    action: "delete",
    module: "finance",
    entityId: existing.id,
    entityName: existing.name,
    details: { type: existing.type, amount: existing.amount },
  });

  return ok({ id, deleted: true });
});
