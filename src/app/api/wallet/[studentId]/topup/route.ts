// Wallet Top-Up API — transactional: wallet.balance += amount, WalletLog (top_up),
// Transaction (income, fund=general, category=wallet_topup, relatedStudentId),
// paymentMethod from body (cash|bkash|nagad|bank). Audit afterwards.
// POST /api/wallet/[studentId]/topup  body: { amount, description?, paymentMethod? }
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter } from "@/lib/api";

const VALID_METHODS = ["cash", "bkash", "nagad", "bank"] as const;
type Method = (typeof VALID_METHODS)[number];

export const POST = withSession(async ({ session, req, params }) => {
  const studentId = params?.studentId;
  if (!studentId) return fail("Student id is required");

  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return fail("Amount must be a positive number");
  }
  const description =
    typeof body?.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;
  const method: Method = VALID_METHODS.includes(body?.paymentMethod)
    ? body.paymentMethod
    : "cash";

  // Tenant-safe wallet fetch (unique by studentId; verify tenantId ownership)
  const wallet = await db.wallet.findFirst({
    where: { studentId, tenantId: session.tenantId },
    select: { id: true, balance: true, studentId: true },
  });
  if (!wallet) return notFound("Wallet not found");

  // Locate the tenant's General fund (fallback: any fund named General, else first fund).
  const generalFund = await db.fund.findFirst({
    where: { tenantId: session.tenantId, type: "general" },
    select: { id: true, name: true, balance: true },
  });
  if (!generalFund) {
    return fail("No General fund exists. Create one in Finance before topping up wallets.");
  }

  // Execute atomically: increment wallet, write WalletLog, write Transaction, update fund.
  const result = await db.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    });

    await tx.walletLog.create({
      data: {
        walletId: wallet.id,
        tenantId: session.tenantId,
        amount,
        trxType: "top_up",
        description: description ?? `Top-up via ${method}`,
      },
    });

    const updatedFund = await tx.fund.update({
      where: { id: generalFund.id },
      data: { balance: { increment: amount } },
    });

    const trx = await tx.transaction.create({
      data: {
        tenantId: session.tenantId,
        fundId: generalFund.id,
        amount,
        type: "income",
        category: "wallet_topup",
        description: description ?? `Wallet top-up for student ${studentId}`,
        relatedStudentId: studentId,
        paymentMethod: method,
        date: new Date(),
      },
    });

    return { wallet: updatedWallet, fund: updatedFund, trx };
  });

  await auditAfter(session, {
    action: "create",
    module: "wallet",
    entityId: wallet.id,
    entityName: `Top-up ${amount}`,
    details: {
      studentId,
      amount,
      method,
      description,
      fundId: generalFund.id,
      transactionId: result.trx.id,
      newBalance: result.wallet.balance,
    },
  });

  return ok({
    walletId: wallet.id,
    balance: result.wallet.balance,
    amount,
    method,
    transactionId: result.trx.id,
  }, 201);
});
