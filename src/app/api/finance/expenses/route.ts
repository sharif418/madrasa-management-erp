// Expense Management API — list (with category breakdown) & create (type=expense).
// Expenses are stored as Transaction records with type="expense" and a 7-value
// category set. The recipient ("paidTo") is encoded in the description for now
// since the Transaction model doesn't have a dedicated field.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";
import { cacheInvalidate } from "@/lib/cache";

const EXPENSE_CATEGORIES = new Set([
  "salary", "utilities", "maintenance", "food", "transport", "event", "other",
]);
const VALID_METHODS = new Set(["cash", "bkash", "nagad", "bank", "wallet"]);

// GET /api/finance/expenses?category=&from=&to=&page=1&limit=20
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

  const where: Record<string, unknown> = { tenantId: session.tenantId, type: "expense" };
  if (category && EXPENSE_CATEGORIES.has(category)) where.category = category;
  const dateFilter: Record<string, Date> = {};
  if (from) { const d = new Date(from); if (!isNaN(d.getTime())) dateFilter.gte = d; }
  if (to) { const d = new Date(to); if (!isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); dateFilter.lte = d; } }
  if (Object.keys(dateFilter).length) where.date = dateFilter;

  const [items, total, catAgg, total30d, totalPrev30d] = await Promise.all([
    db.transaction.findMany({
      where, orderBy: { date: "desc" },
      skip: (page - 1) * limit, take: limit,
      include: { fund: { select: { name: true, type: true } } },
    }),
    db.transaction.count({ where }),
    db.transaction.groupBy({
      by: ["category"], where,
      _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } },
    }),
    db.transaction.aggregate({
      where: { tenantId: session.tenantId, type: "expense", date: { gte: daysAgo(30) } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        tenantId: session.tenantId, type: "expense",
        date: { gte: daysAgo(60), lt: daysAgo(30) },
      },
      _sum: { amount: true },
    }),
  ]);

  const categoryBreakdown = catAgg.map((c) => ({
    category: c.category || "other",
    amount: c._sum.amount || 0,
  }));

  return ok({
    items, total, page, limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    categoryBreakdown,
    total30d: total30d._sum.amount || 0,
    totalPrev30d: totalPrev30d._sum.amount || 0,
  });
});

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// POST /api/finance/expenses  { amount, category, description, paidTo, paymentMethod, date, fundId? }
export const POST = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "finance", "create");
  if (!allowed) return forbidden("You don't have permission to create expenses");

  const body = await req.json().catch(() => ({}));
  const { amount, category, description, paidTo, paymentMethod, date, fundId } = body || {};

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return fail("Amount must be a positive number");
  if (!EXPENSE_CATEGORIES.has(category)) return fail("Invalid expense category");

  const method = VALID_METHODS.has(paymentMethod) ? paymentMethod : "cash";

  // Resolve fund: explicit fundId, else the tenant's general fund, else first fund
  let fund = fundId
    ? await db.fund.findFirst({ where: { id: fundId, tenantId: session.tenantId }, select: { id: true, name: true, balance: true } })
    : await db.fund.findFirst({ where: { tenantId: session.tenantId, type: "general" }, select: { id: true, name: true, balance: true } });
  if (!fund) {
    fund = await db.fund.findFirst({ where: { tenantId: session.tenantId }, select: { id: true, name: true, balance: true } });
  }
  if (!fund) return fail("No fund available — create a fund first");

  const txDate = date ? new Date(date) : new Date();
  if (isNaN(txDate.getTime())) return fail("Invalid date");

  // Compose description with paidTo prefix so the table can show both.
  const desc = paidTo ? `→ ${paidTo}: ${description || ""}`.trim() : (description || "");

  const result = await db.$transaction(async (tx) => {
    const updatedFund = await tx.fund.update({
      where: { id: fund!.id },
      data: { balance: { decrement: amt } },
    });
    const trx = await tx.transaction.create({
      data: {
        tenantId: session.tenantId, fundId: fund!.id,
        amount: amt, type: "expense", category,
        description: desc, paymentMethod: method, date: txDate,
      },
      include: { fund: { select: { name: true, type: true } } },
    });
    return { trx, fundBalance: updatedFund.balance };
  });

  await auditAfter(session, {
    action: "create", module: "finance",
    entityId: result.trx.id, entityName: `expense ${amt} (${category})`,
    details: { category, amount: amt, paidTo: paidTo || null, fundId: fund.id, fundName: fund.name },
  });

  cacheInvalidate("dashboard:");
  cacheInvalidate("analytics:");

  return ok(result.trx, 201);
});
