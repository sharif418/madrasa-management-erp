import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPayment } from "@/lib/payment-gateway";

async function confirmPayment(data: {
  transactionId: string;
  amount: number;
  paymentMethod: string;
  studentId?: string;
  fundId?: string;
  feeCollectionId?: string;
  tenantId: string;
}) {
  const { transactionId, amount, paymentMethod, studentId, fundId, feeCollectionId, tenantId } = data;

  // Check if we already created a transaction for this transactionId (idempotence)
  const existing = await db.transaction.findFirst({
    where: { description: { contains: `Trx ID: ${transactionId}` }, tenantId },
  });
  if (existing) return;

  // 1. Find the fund
  let targetFundId = fundId;
  if (!targetFundId) {
    // Default to general fund if not specified
    const generalFund = await db.fund.findFirst({
      where: { tenantId, name: { contains: "General" } },
    });
    targetFundId = generalFund?.id;
  }

  if (!targetFundId) {
    throw new Error("Target fund not found");
  }

  // 2. Start a database transaction
  await db.$transaction(async (tx) => {
    // Update fund balance
    await tx.fund.update({
      where: { id: targetFundId },
      data: { balance: { increment: amount } },
    });

    // If it's a fee collection payment, update FeeCollection status to paid
    if (feeCollectionId) {
      const feeCollection = await tx.feeCollection.findUnique({
        where: { id: feeCollectionId },
      });
      if (feeCollection) {
        const newPaidAmount = Math.min(feeCollection.amount, feeCollection.paidAmount + amount);
        const isFullyPaid = newPaidAmount >= feeCollection.amount;
        await tx.feeCollection.update({
          where: { id: feeCollectionId },
          data: {
            paidAmount: newPaidAmount,
            paidDate: new Date(),
            status: isFullyPaid ? "paid" : "partial",
            method: paymentMethod.toLowerCase(),
            notes: `Paid online via SSLCommerz. Trx: ${transactionId}`,
          },
        });
      }
    }

    // Create the Transaction record
    await tx.transaction.create({
      data: {
        tenantId,
        fundId: targetFundId,
        amount,
        type: "income",
        category: feeCollectionId ? "fee" : "donation",
        description: `Online Payment. Trx ID: ${transactionId}`,
        paymentMethod: paymentMethod.toLowerCase(),
        relatedStudentId: studentId || null,
        date: new Date(),
      },
    });
  });
}

// GET — handle payment success redirect from SSLCommerz
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("ref");
  const amountStr = searchParams.get("amount") ?? "0";
  const studentId = searchParams.get("opt_a") || undefined;
  const fundId = searchParams.get("opt_b") || undefined;
  const feeCollectionId = searchParams.get("opt_c") || undefined;
  const tenantId = searchParams.get("opt_d") || "";

  if (!transactionId || !tenantId) {
    return NextResponse.redirect(new URL("/?view=fees&payment=error", req.url));
  }

  const amount = Number(amountStr);

  // Verify the payment with SSLCommerz
  const verification = await verifyPayment(transactionId, amount, tenantId);

  if (verification.verified) {
    const method = verification.method || "online";
    await confirmPayment({
      transactionId,
      amount,
      paymentMethod: method,
      studentId,
      fundId,
      feeCollectionId,
      tenantId,
    });

    return NextResponse.redirect(new URL("/?view=fees&payment=success", req.url));
  } else {
    return NextResponse.redirect(new URL("/?view=fees&payment=failed", req.url));
  }
}

// POST — IPN (Instant Payment Notification) from SSLCommerz
export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const transactionId = body.get("tran_id") as string;
    const status = body.get("status") as string;
    const amountStr = body.get("amount") as string;
    const studentId = body.get("value_a") as string || undefined;
    const fundId = body.get("value_b") as string || undefined;
    const feeCollectionId = body.get("value_c") as string || undefined;
    const tenantId = body.get("value_d") as string;

    if (!transactionId || !tenantId) {
      return NextResponse.json({ error: "Invalid IPN" }, { status: 400 });
    }

    if (status === "VALID" || status === "VALIDATED") {
      const amount = Number(amountStr);
      const cardType = body.get("card_type") as string || "online";
      await confirmPayment({
        transactionId,
        amount,
        paymentMethod: cardType,
        studentId,
        fundId,
        feeCollectionId,
        tenantId,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, status });
  } catch (e) {
    console.error("[IPN Error]", e);
    return NextResponse.json({ error: "IPN processing failed" }, { status: 500 });
  }
}
