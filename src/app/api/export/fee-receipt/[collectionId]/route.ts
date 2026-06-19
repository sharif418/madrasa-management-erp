// GET /api/export/fee-receipt/[collectionId] — print-friendly HTML fee receipt.
// Returns HTML content type so the browser can render and print (Ctrl+P → Save as PDF).
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { renderReceiptHtml, type ReceiptData } from "@/modules/import-export/receipt-template";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ collectionId: string }> }
) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { collectionId } = await ctx.params;
  if (!collectionId) return new Response("Missing collection id", { status: 400 });

  const fee = await db.feeCollection.findFirst({
    where: { id: collectionId, tenantId: session.tenantId },
    include: {
      student: { include: { class: { select: { name: true } } } },
      feeStructure: { select: { name: true, type: true } },
    },
  });
  if (!fee) return new Response("Fee collection not found", { status: 404 });

  const tenant = await db.tenant.findUnique({
    where: { id: session.tenantId },
    select: { name: true, phone: true, address: true, currency: true, language: true },
  });

  const data: ReceiptData = {
    tenantName: tenant?.name || "Madrasa",
    tenantAddress: tenant?.address,
    tenantPhone: tenant?.phone,
    currency: tenant?.currency || "BDT",
    locale: tenant?.language || "en",
    receiptNo: fee.id.slice(-8).toUpperCase(),
    status: fee.status,
    studentName: fee.student.name,
    rollNo: fee.student.rollNo,
    className: fee.student.class?.name ?? null,
    feeType: fee.feeStructure?.name || fee.notes || null,
    method: fee.method,
    date: fee.paidDate || fee.createdAt,
    amount: fee.amount,
    paidAmount: fee.paidAmount,
  };

  const html = renderReceiptHtml(data);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
