// Transactions API — list (filters + pagination) & create (income/expense/transfer-Tamlik).
// All multi-table writes happen inside db.$transaction for atomicity.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const VALID_TYPES = ["income", "expense", "transfer"] as const;
const VALID_METHODS = ["cash", "bkash", "nagad", "bank", "wallet"] as const;
type TxType = (typeof VALID_TYPES)[number];

// ----------------------------- GET (list) -----------------------------
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const fundId = url.searchParams.get("fundId") || "";
  const type = url.searchParams.get("type") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (fundId) where.fundId = fundId;
  if (VALID_TYPES.includes(type as TxType)) where.type = type;

  // Date range filter (inclusive)
  const dateFilter: Record<string, Date> = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) dateFilter.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) {
      // include the entire `to` day
      d.setHours(23, 59, 59, 999);
      dateFilter.lte = d;
    }
  }
  if (Object.keys(dateFilter).length) where.date = dateFilter;

  const [items, total] = await Promise.all([
    db.transaction.findMany({
      where,
      include: {
        fund: { select: { name: true, type: true } },
        student: { select: { id: true, name: true, rollNo: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.transaction.count({ where }),
  ]);

  // Aggregates for the current filter set — useful for the table header
  const agg = await db.transaction.groupBy({
    by: ["type"],
    where,
    _sum: { amount: true },
  });
  const sums: Record<string, number> = { income: 0, expense: 0, transfer: 0 };
  for (const row of agg) sums[row.type] = row._sum.amount || 0;

  return ok({ items, total, page, limit, sums });
});

// ----------------------------- POST (create) --------------------------
export const POST = withSession(async ({ session, req }) => {
  // RBAC: require finance:create permission
  const allowed = await checkPermission(session, "finance", "create");
  if (!allowed) return forbidden("You don't have permission to create transactions");

  const body = await req.json().catch(() => ({}));
  const {
    fundId, amount, type, category, description,
    relatedStudentId, paymentMethod, date,
  } = body || {};

  // --- Validation ---
  if (!fundId || typeof fundId !== "string") return fail("Fund is required");
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return fail("Amount must be a positive number");
  const txType: TxType = VALID_TYPES.includes(type as TxType) ? (type as TxType) : "income";
  const method =
    VALID_METHODS.includes(paymentMethod as (typeof VALID_METHODS)[number])
      ? paymentMethod
      : "cash";

  // Fund must belong to tenant
  const fund = await db.fund.findFirst({
    where: { id: fundId, tenantId: session.tenantId },
    select: { id: true, type: true, balance: true, name: true },
  });
  if (!fund) return fail("Fund not found in your madrasa");

  // Tamlik (transfer) requires a related student & must come from a zakat fund
  if (txType === "transfer") {
    if (!relatedStudentId) return fail("Tamlik transfer requires a beneficiary student");
    if (fund.type !== "zakat") return fail("Tamlik transfers must originate from a Zakat fund");
    if (amt > fund.balance) return fail("Insufficient balance in the Zakat fund");
  } else if (txType === "expense" && amt > fund.balance) {
    return fail("Insufficient balance in this fund");
  }

  const txDate = date ? new Date(date) : new Date();
  if (isNaN(txDate.getTime())) return fail("Invalid date");

  // --- Execute atomically ---
  const result = await db.$transaction(async (tx) => {
    // For transfer (Tamlik): student + wallet + WalletLog + tamlik proof
    if (txType === "transfer") {
      const student = await tx.student.findFirst({
        where: { id: relatedStudentId, tenantId: session.tenantId },
        select: { id: true, name: true, isZakatEligible: true },
      });
      if (!student) throw new Error("Beneficiary student not found");
      if (!student.isZakatEligible) {
        throw new Error("Student is not marked as Zakat-eligible");
      }

      // Decrement zakat fund
      const updatedFund = await tx.fund.update({
        where: { id: fund.id },
        data: { balance: { decrement: amt } },
      });

      // Upsert student wallet (auto-create if missing) then top-up
      const wallet = await tx.wallet.upsert({
        where: { studentId: student.id },
        update: { balance: { increment: amt } },
        create: {
          studentId: student.id,
          tenantId: session.tenantId,
          balance: amt,
        },
      });

      // Wallet log: top-up entry
      await tx.walletLog.create({
        data: {
          walletId: wallet.id,
          tenantId: session.tenantId,
          amount: amt,
          trxType: "top_up",
          description: `Tamlik (Zakat) transfer from ${fund.name}`,
        },
      });

      const tamlikProof = JSON.stringify({
        studentId: student.id,
        studentName: student.name,
        amount: amt,
        date: txDate.toISOString(),
        fundId: fund.id,
        fundName: fund.name,
        witness: session.userId,
        witnessName: session.name,
      });

      const trx = await tx.transaction.create({
        data: {
          tenantId: session.tenantId,
          fundId: fund.id,
          amount: amt,
          type: "transfer",
          category: category || "tamlik_zakat",
          description: description || `Tamlik — Zakat to ${student.name}`,
          relatedStudentId: student.id,
          tamlikProof,
          paymentMethod: "wallet",
          date: txDate,
        },
        include: {
          fund: { select: { name: true, type: true } },
          student: { select: { id: true, name: true, rollNo: true } },
        },
      });

      return { trx, fundBalance: updatedFund.balance, walletBalance: wallet.balance };
    }

    // Income or expense — adjust fund balance accordingly
    const delta = txType === "income" ? amt : -amt;
    const updatedFund = await tx.fund.update({
      where: { id: fund.id },
      data: { balance: { increment: delta } },
    });

    const trx = await tx.transaction.create({
      data: {
        tenantId: session.tenantId,
        fundId: fund.id,
        amount: amt,
        type: txType,
        category: category || null,
        description: description || null,
        relatedStudentId: relatedStudentId || null,
        paymentMethod: method,
        date: txDate,
      },
      include: {
        fund: { select: { name: true, type: true } },
        student: { select: { id: true, name: true, rollNo: true } },
      },
    });

    return { trx, fundBalance: updatedFund.balance };
  });

  await auditAfter(session, {
    action: "create",
    module: "finance",
    entityId: result.trx.id,
    entityName: `${txType} ${amt}`,
    details: {
      type: txType,
      amount: amt,
      fundId: fund.id,
      fundName: fund.name,
      relatedStudentId: relatedStudentId || null,
      tamlik: txType === "transfer",
    },
  });

  return ok(result.trx, 201);
});
