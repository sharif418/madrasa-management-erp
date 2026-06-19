// Wallet detail API — get a specific student wallet + last 20 WalletLog entries.
// GET /api/wallet/[studentId]
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession } from "@/lib/api";

export const GET = withSession(async ({ session, params }) => {
  const studentId = params?.studentId;
  if (!studentId) return fail("Student id is required");

  // Tenant-safe: wallet is unique by studentId; verify ownership via tenantId.
  const wallet = await db.wallet.findFirst({
    where: { studentId, tenantId: session.tenantId },
    include: {
      student: {
        select: {
          id: true, name: true, nameArabic: true, rollNo: true, isActive: true,
          class: { select: { name: true } },
        },
      },
    },
  });
  if (!wallet) return notFound("Wallet not found");

  const [logs, agg] = await Promise.all([
    db.walletLog.findMany({
      where: { walletId: wallet.id, tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.walletLog.aggregate({
      where: { walletId: wallet.id, tenantId: session.tenantId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  return ok({
    wallet: {
      id: wallet.id,
      studentId: wallet.studentId,
      balance: wallet.balance,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      student: wallet.student,
    },
    logs,
    stats: {
      totalTransactions: agg._count._all,
      totalTopUp: agg._sum.amount ?? 0,
    },
  });
});
