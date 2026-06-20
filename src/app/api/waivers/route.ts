// Fee Waivers API — list (with student + class) + create.
// Tenant-scoped. RBAC: finance:create for POST.
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const VALID_TYPES = ["scholarship", "sibling", "orphan", "staff_child", "zakat_eligible"] as const;
const VALID_DISCOUNT = ["percentage", "fixed"] as const;
type WaiverType = (typeof VALID_TYPES)[number];

// GET /api/waivers — all waivers for current tenant, with student name + class.
// Also returns waiver type breakdown stats.
export const GET = withSession(async ({ session }) => {
  const rows = await db.feeWaiver.findMany({
    where: { tenantId: session.tenantId },
    include: {
      student: {
        select: {
          id: true, name: true, rollNo: true,
          class: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
  });

  const now = Date.now();
  const items = rows.map((w) => {
    const expired = w.validUntil ? new Date(w.validUntil).getTime() < now : false;
    return {
      id: w.id,
      studentId: w.studentId,
      studentName: w.student.name,
      rollNo: w.student.rollNo ?? null,
      classId: w.student.class?.id ?? null,
      className: w.student.class?.name ?? null,
      type: w.type,
      discountType: w.discountType,
      percentage: w.percentage,
      fixedAmount: w.fixedAmount,
      reason: w.reason ?? null,
      validFrom: w.validFrom,
      validUntil: w.validUntil ?? null,
      expired,
      createdAt: w.createdAt,
    };
  });

  // Breakdown by type (counts + total discount measure)
  const byType: Record<string, { count: number; totalPct: number; totalFixed: number }> = {};
  for (const it of items) {
    if (!byType[it.type]) byType[it.type] = { count: 0, totalPct: 0, totalFixed: 0 };
    byType[it.type].count += 1;
    byType[it.type].totalPct += it.percentage || 0;
    byType[it.type].totalFixed += it.fixedAmount || 0;
  }

  const activeCount = items.filter((i) => !i.expired).length;

  return ok({ items, activeCount, byType });
});

// POST /api/waivers — create a waiver
export const POST = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "finance", "create");
  if (!allowed) return forbidden("No permission to create fee waivers");

  const body = await req.json().catch(() => ({}));
  const { studentId, type, discountType, percentage, fixedAmount, reason, validFrom, validUntil } = body || {};

  if (!studentId || typeof studentId !== "string") return fail("Student is required");

  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!student) return fail("Student not found");

  const t: WaiverType = VALID_TYPES.includes(type) ? (type as WaiverType) : "scholarship";
  const dt: "percentage" | "fixed" = VALID_DISCOUNT.includes(discountType) ? discountType : "percentage";

  const pct = Number(percentage);
  const fixed = Number(fixedAmount);
  if (dt === "percentage") {
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return fail("Percentage must be 0–100");
  } else {
    if (!Number.isFinite(fixed) || fixed < 0) return fail("Fixed amount must be ≥ 0");
  }

  const vf = validFrom ? new Date(validFrom) : new Date();
  if (isNaN(vf.getTime())) return fail("Invalid validFrom date");
  let vu: Date | null = null;
  if (validUntil) {
    vu = new Date(validUntil);
    if (isNaN(vu.getTime())) return fail("Invalid validUntil date");
    if (vu.getTime() < vf.getTime()) return fail("validUntil must be after validFrom");
  }

  const created = await db.feeWaiver.create({
    data: {
      tenantId: session.tenantId,
      studentId: student.id,
      type: t,
      discountType: dt,
      percentage: dt === "percentage" ? pct : 0,
      fixedAmount: dt === "fixed" ? fixed : 0,
      reason: typeof reason === "string" ? reason.trim() || null : null,
      validFrom: vf,
      validUntil: vu,
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "finance",
    entityId: created.id,
    entityName: student.name,
    details: { type: t, discountType: dt, percentage: pct, fixedAmount: fixed, studentId: student.id },
  });

  return ok(created, 201);
});
