// DELETE /api/finance/transactions/[id] — reverse fund balance + delete (Tamlik-aware).
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Transaction id is required");

  const txn = await db.transaction.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { fund: { select: { id: true, name: true, type: true } } },
  });
  if (!txn) return fail("Transaction not found", 404);

  await db.$transaction(async (tx) => {
    // Reverse the fund balance change for income/expense/transfer (Tamlik outflow)
    if (txn.type === "income") {
      await tx.fund.update({
        where: { id: txn.fundId },
        data: { balance: { decrement: txn.amount } },
      });
    } else {
      // expense OR transfer (Tamlik): both reduced fund balance on creation
      await tx.fund.update({
        where: { id: txn.fundId },
        data: { balance: { increment: txn.amount } },
      });
    }

    // For Tamlik transfers, also reverse the wallet top-up + delete the WalletLog.
    if (txn.type === "transfer" && txn.relatedStudentId && txn.tamlikProof) {
      const wallet = await tx.wallet.findUnique({
        where: { studentId: txn.relatedStudentId },
        select: { id: true, balance: true },
      });
      if (wallet) {
        // Reverse only down to 0 — never let wallet go negative.
        const newBal = Math.max(0, wallet.balance - txn.amount);
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBal },
        });
        // Remove the matching WalletLog entry (best-effort: latest top_up of same amount).
        const logs = await tx.walletLog.findMany({
          where: {
            walletId: wallet.id,
            tenantId: session.tenantId,
            trxType: "top_up",
            amount: txn.amount,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        });
        if (logs.length) {
          await tx.walletLog.delete({ where: { id: logs[0].id } });
        }
      }
    }

    await tx.transaction.delete({ where: { id: txn.id } });
  });

  await auditAfter(session, {
    action: "delete",
    module: "finance",
    entityId: txn.id,
    entityName: `${txn.type} ${txn.amount}`,
    details: {
      fundId: txn.fundId,
      fundName: txn.fund.name,
      type: txn.type,
      amount: txn.amount,
      tamlik: txn.type === "transfer",
    },
  });

  return ok({ id: txn.id, deleted: true });
});
