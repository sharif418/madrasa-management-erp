// Funds API — list & create (with optional initial balance). Scoped by tenantId.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

const VALID_TYPES = ["general", "lillah", "waqf", "zakat", "sadaqah"] as const;
type FundType = (typeof VALID_TYPES)[number];

export const GET = withSession(async ({ session }) => {
  const funds = await db.fund.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { transactions: true } },
    },
  });
  const totalBalance = funds.reduce((s, f) => s + (f.balance || 0), 0);
  return ok({ funds, totalBalance });
});

export const POST = withSession(async ({ session, req }) => {
  const body = await req.json().catch(() => ({}));
  const { name, type, description, initialBalance } = body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return fail("Fund name is required");
  }
  const t: FundType = VALID_TYPES.includes(type) ? (type as FundType) : "general";
  const initial =
    typeof initialBalance === "number" && initialBalance > 0
      ? initialBalance
      : 0;

  // Name must be unique within tenant
  const existing = await db.fund.findFirst({
    where: { tenantId: session.tenantId, name: name.trim() },
    select: { id: true },
  });
  if (existing) return fail("A fund with this name already exists");

  const fund = await db.fund.create({
    data: {
      tenantId: session.tenantId,
      name: name.trim(),
      type: t,
      description: description?.trim() || null,
      balance: initial,
    },
  });

  // If an initial balance is provided, record it as an opening income transaction
  // so the audit trail stays complete and consistent with fund.balance.
  if (initial > 0) {
    await db.transaction.create({
      data: {
        tenantId: session.tenantId,
        fundId: fund.id,
        amount: initial,
        type: "income",
        category: "opening_balance",
        description: `Opening balance for ${fund.name}`,
        paymentMethod: "cash",
        date: new Date(),
      },
    });
  }

  await auditAfter(session, {
    action: "create",
    module: "finance",
    entityId: fund.id,
    entityName: fund.name,
    details: { type: fund.type, initialBalance: initial },
  });

  return ok(fund, 201);
});
