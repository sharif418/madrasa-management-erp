// GET /api/finance — overview: funds, total balance, last-30d income/expense, recent transactions
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";

export const GET = withSession(async ({ session }) => {
  const tenantId = session.tenantId;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [funds, recentTxn, last30d] = await Promise.all([
    db.fund.findMany({
      where: { tenantId },
      orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    }),
    db.transaction.findMany({
      where: { tenantId },
      include: { fund: { select: { name: true, type: true } } },
      orderBy: { date: "desc" },
      take: 10,
    }),
    db.transaction.groupBy({
      by: ["type"],
      where: { tenantId, date: { gte: since } },
      _sum: { amount: true },
    }),
  ]);

  const totalBalance = funds.reduce((s, f) => s + (f.balance || 0), 0);

  // Convert groupBy result into a quick lookup
  const totals: Record<string, number> = { income: 0, expense: 0, transfer: 0 };
  for (const row of last30d) {
    totals[row.type] = row._sum.amount || 0;
  }

  // Type breakdown for the funds grid
  const byType: Record<string, number> = {};
  for (const f of funds) {
    byType[f.type] = (byType[f.type] || 0) + (f.balance || 0);
  }

  return ok({
    funds,
    totalBalance,
    last30d: totals,
    byType,
    recent: recentTxn.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description,
      date: t.date,
      tamlikProof: t.tamlikProof,
      fund: t.fund,
    })),
  });
});
