import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { initiatePayment } from "@/lib/payment-gateway";

// POST — initiate a payment session
// Body: { amount, type: "FEE"|"DONATION", description, customerName, customerEmail, customerPhone, studentId?, fundId?, feeCollectionId? }
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = session.tenantId;

  const body = await req.json().catch(() => ({}));
  const { amount, type, description, customerName, customerEmail, customerPhone, studentId, fundId, feeCollectionId } = body;

  if (!amount || !type || !description) {
    return NextResponse.json({ error: "amount, type, and description are required" }, { status: 400 });
  }

  const amt = Number(amount);
  if (amt < 1) {
    return NextResponse.json({ error: "Amount must be at least 1 BDT" }, { status: 400 });
  }

  // Generate a unique reference ID for SSLCommerz transaction
  const reference = `${type === "FEE" ? "FEE" : "DON"}-${Date.now().toString(36).toUpperCase()}`;

  // Initiate payment with SSLCommerz (or sandbox)
  const baseUrl = new URL(req.url).origin;
  const paymentSession = await initiatePayment({
    amount: amt,
    currency: "BDT",
    description,
    customerName: customerName || session.name || "Customer",
    customerEmail: customerEmail || "",
    customerPhone: customerPhone || session.phone || "",
    referenceId: reference,
    successUrl: `${baseUrl}/api/payments/success?ref=${reference}&amount=${amt}&opt_a=${studentId || ""}&opt_b=${fundId || ""}&opt_c=${feeCollectionId || ""}&opt_d=${tenantId}`,
    failUrl: `${baseUrl}/api/payments/fail?ref=${reference}`,
    cancelUrl: `${baseUrl}/api/payments/fail?ref=${reference}&cancelled=true`,
    type,
    studentId: studentId || undefined,
    fund: fundId || undefined,
    feeCollectionId: feeCollectionId || undefined,
    tenantId,
  });

  return NextResponse.json({
    success: true,
    sessionId: paymentSession.sessionId,
    gatewayUrl: paymentSession.gatewayUrl,
    sandbox: paymentSession.sandbox,
    reference,
  });
}
