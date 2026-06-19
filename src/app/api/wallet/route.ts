// Wallet API — list all tenant wallets with student name + recent-logs count.
// GET /api/wallet?search=&page=1&limit=20
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

  // Build tenant-scoped where clause
  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (search) {
    where.student = {
      OR: [
        { name: { contains: search } },
        { nameArabic: { contains: search } },
        { rollNo: { contains: search } },
      ],
    };
  }

  const [items, total, sum] = await Promise.all([
    db.wallet.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, nameArabic: true, rollNo: true, isActive: true } },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, amount: true, trxType: true, createdAt: true },
        },
        _count: { select: { logs: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.wallet.count({ where }),
    db.wallet.aggregate({ where, _sum: { balance: true } }),
  ]);

  const totalBalance = sum._sum.balance || 0;
  const activeWallets = items.filter((w) => w.balance > 0).length;

  return ok({
    items: items.map((w) => ({
      id: w.id,
      studentId: w.studentId,
      balance: w.balance,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      student: w.student,
      recentLog: w.logs[0] ?? null,
      logsCount: w._count.logs,
    })),
    total,
    page,
    limit,
    totalBalance,
    activeWallets,
  });
});
