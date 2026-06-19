// Billing API — GET (subscription status + usage + invoices) + POST (upgrade plan)
// All scoped to session.tenantId. Mock — no real payment gateway integration.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

type Plan = "trial" | "basic" | "pro" | "enterprise";

const PLAN_LIMITS: Record<Plan, { students: number; teachers: number; storage: string }> = {
  trial: { students: 50, teachers: 5, storage: "500 MB" },
  basic: { students: 200, teachers: 20, storage: "2 GB" },
  pro: { students: 1000, teachers: 100, storage: "10 GB" },
  enterprise: { students: -1, teachers: -1, storage: "Unlimited" }, // -1 = unlimited
};

const PLAN_PRICES: Record<Plan, number> = {
  trial: 0,
  basic: 999,
  pro: 2499,
  enterprise: 5999,
};

function planLimits(plan: string) {
  return PLAN_LIMITS[(plan as Plan) ?? "trial"] ?? PLAN_LIMITS.trial;
}

// Generate 3 deterministic mock invoices based on tenant id (stable per tenant)
function generateMockInvoices(tenantId: string, plan: string) {
  const seed = tenantId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const now = new Date();
  const amount = PLAN_PRICES[(plan as Plan) ?? "trial"] ?? 0;
  const out: Array<{
    id: string;
    number: string;
    date: string;
    plan: string;
    amount: number;
    status: "paid" | "pending";
  }> = [];
  if (amount === 0) return out; // trial — no invoices yet
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const seq = String((seed % 900) + 100 + i);
    out.push({
      id: `inv-${tenantId.slice(0, 6)}-${i}`,
      number: `INV-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${seq}`,
      date: d.toISOString(),
      plan,
      amount,
      status: "paid",
    });
  }
  return out;
}

// GET /api/billing — current subscription, usage, invoices
export const GET = withSession(async ({ session }) => {
  const [tenant, students, teachers, modules] = await Promise.all([
    db.tenant.findUnique({
      where: { id: session.tenantId },
      select: { id: true, name: true, plan: true, status: true, createdAt: true, email: true, currency: true },
    }),
    db.student.count({ where: { tenantId: session.tenantId, isActive: true } }),
    db.teacher.count({ where: { tenantId: session.tenantId, isActive: true } }),
    db.featureToggle.count({ where: { tenantId: session.tenantId, enabled: true } }),
  ]);

  if (!tenant) return fail("Tenant not found", 404);

  const plan = (tenant.plan as Plan) ?? "trial";
  const limits = planLimits(plan);
  const createdAt = new Date(tenant.createdAt);
  const trialEndsAt = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const msRemaining = trialEndsAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  const isTrial = plan === "trial";

  // Mock storage usage — derived from student count (rough proxy)
  const storageBytes = students * 256 * 1024; // ~256KB per student
  const storageMB = Math.max(1, Math.round(storageBytes / (1024 * 1024)));

  // Next billing date — 1st of next month (for paid plans)
  const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const invoices = generateMockInvoices(tenant.id, plan);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  return ok({
    plan,
    status: tenant.status,
    currency: tenant.currency || "BDT",
    tenantName: tenant.name,
    email: tenant.email,
    memberSince: createdAt.toISOString(),
    trialEndsAt: isTrial ? trialEndsAt.toISOString() : null,
    daysRemaining: isTrial ? daysRemaining : null,
    usage: {
      students,
      teachers,
      modules,
      storage: `${storageMB} MB`,
    },
    limits: {
      students: limits.students, // -1 = unlimited
      teachers: limits.teachers,
      storage: limits.storage,
    },
    invoices,
    totalPaid,
    nextBilling: plan === "trial" ? null : nextBilling.toISOString(),
  });
});

type UpgradeBody = {
  plan: "basic" | "pro" | "enterprise";
  paymentMethod: "bkash" | "nagad" | "bank" | "card";
  reference?: string;
};

const ALLOWED_PLANS = ["basic", "pro", "enterprise"];
const ALLOWED_METHODS = ["bkash", "nagad", "bank", "card"];

// POST /api/billing — upgrade/downgrade plan (mock — just updates tenant.plan)
export const POST = withSession(async ({ session, req }) => {
  // RBAC: require billing:update permission
  const allowed = await checkPermission(session, "billing", "update");
  if (!allowed) return forbidden("You don't have permission to manage billing");

  const body = (await req.json().catch(() => ({}))) as UpgradeBody;

  if (!ALLOWED_PLANS.includes(body.plan)) {
    return fail("Invalid plan. Allowed: basic, pro, enterprise");
  }
  if (!ALLOWED_METHODS.includes(body.paymentMethod)) {
    return fail("Invalid payment method");
  }

  const updated = await db.tenant.update({
    where: { id: session.tenantId },
    data: { plan: body.plan, status: "active" },
    select: { id: true, name: true, plan: true, status: true },
  });

  await auditAfter(session, {
    action: "update",
    module: "billing",
    entityName: updated.name,
    details: {
      newPlan: body.plan,
      paymentMethod: body.paymentMethod,
      reference: (body.reference || "").slice(0, 64) || null,
    },
  });

  return ok({
    plan: updated.plan,
    status: updated.status,
    message: "Plan updated successfully",
  });
});
