// Fee Waivers [id] API — PUT (update) + DELETE.
// Tenant-scoped. RBAC: finance:update / finance:delete.
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const VALID_TYPES = ["scholarship", "sibling", "orphan", "staff_child", "zakat_eligible"] as const;
const VALID_DISCOUNT = ["percentage", "fixed"] as const;

// PUT /api/waivers/[id]
export const PUT = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Waiver id is required");

  const allowed = await checkPermission(session, "finance", "update");
  if (!allowed) return forbidden("No permission to update fee waivers");

  const existing = await db.feeWaiver.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { student: { select: { name: true } } },
  });
  if (!existing) return fail("Waiver not found", 404);

  const body = await req.json().catch(() => ({}));
  const { type, discountType, percentage, fixedAmount, reason, validFrom, validUntil } = body || {};

  const data: Record<string, unknown> = {};
  if (typeof type === "string" && VALID_TYPES.includes(type as never)) data.type = type;
  if (typeof discountType === "string" && VALID_DISCOUNT.includes(discountType as never)) {
    data.discountType = discountType;
  }
  const pct = Number(percentage);
  if (Number.isFinite(pct)) {
    if (pct < 0 || pct > 100) return fail("Percentage must be 0–100");
    data.percentage = pct;
  }
  const fixed = Number(fixedAmount);
  if (Number.isFinite(fixed)) {
    if (fixed < 0) return fail("Fixed amount must be ≥ 0");
    data.fixedAmount = fixed;
  }
  if (reason !== undefined) {
    data.reason = typeof reason === "string" ? reason.trim() || null : null;
  }
  if (validFrom) {
    const vf = new Date(validFrom);
    if (!isNaN(vf.getTime())) data.validFrom = vf;
  }
  if (validUntil === null) {
    data.validUntil = null;
  } else if (validUntil) {
    const vu = new Date(validUntil);
    if (!isNaN(vu.getTime())) data.validUntil = vu;
  }

  const updated = await db.feeWaiver.update({ where: { id }, data });

  await auditAfter(session, {
    action: "update",
    module: "finance",
    entityId: updated.id,
    entityName: existing.student.name,
    details: data,
  });

  return ok(updated);
});

// DELETE /api/waivers/[id]
export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Waiver id is required");

  const allowed = await checkPermission(session, "finance", "delete");
  if (!allowed) return forbidden("No permission to delete fee waivers");

  const existing = await db.feeWaiver.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { student: { select: { name: true } } },
  });
  if (!existing) return fail("Waiver not found", 404);

  await db.feeWaiver.delete({ where: { id } });

  await auditAfter(session, {
    action: "delete",
    module: "finance",
    entityId: existing.id,
    entityName: existing.student.name,
    details: { type: existing.type, discountType: existing.discountType },
  });

  return ok({ id, deleted: true });
});
