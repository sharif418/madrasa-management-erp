// GET /api/export/fee-receipt-pdf/[collectionId] — generates a real downloadable PDF fee receipt.
// Returns binary PDF (Content-Type: application/pdf, attachment). Tenant-scoped.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { createPdfDoc, finalizePdf, type PdfCtx, PAGE_W, MARGIN } from "@/lib/pdf";
import { rgb } from "pdf-lib";

const cur = (n: number) => `BDT ${new Intl.NumberFormat("en-US").format(Math.round(n || 0))}`;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ collectionId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { collectionId } = await ctx.params;
  if (!collectionId) return NextResponse.json({ ok: false, error: "Missing collection id" }, { status: 400 });

  const fee = await db.feeCollection.findFirst({
    where: { id: collectionId, tenantId: session.tenantId },
    include: {
      student: { include: { class: { select: { name: true } } } },
      feeStructure: { select: { name: true, type: true } },
    },
  });
  if (!fee) return NextResponse.json({ ok: false, error: "Fee collection not found" }, { status: 404 });

  const tenant = await db.tenant.findUnique({
    where: { id: session.tenantId },
    select: { name: true, phone: true, address: true },
  });
  const tenantName = tenant?.name || "Madrasa";

  let pdf: PdfCtx;
  try { pdf = await createPdfDoc("Fee Receipt", tenantName); }
  catch (e) {
    console.error("[fee-receipt-pdf] init failed:", e);
    return NextResponse.json({ ok: false, error: "Failed to initialize PDF" }, { status: 500 });
  }

  const { page, font, bold, y: y0 } = pdf;
  const SLATE = rgb(71 / 255, 85 / 255, 105 / 255);
  const MUTED = rgb(100 / 255, 116 / 255, 139 / 255);
  const BORDER = rgb(203 / 255, 213 / 255, 225 / 255);
  const EMERALD = rgb(16 / 255, 185 / 255, 129 / 255);
  const WHITE = rgb(1, 1, 1);
  let y = y0;

  // Logo placeholder (emerald circle with "M")
  page.drawCircle({ x: MARGIN + 16, y: y - 8, size: 18, color: EMERALD });
  page.drawText("M", { x: MARGIN + 10, y: y - 14, size: 18, font: bold, color: WHITE });
  page.drawText("FEE RECEIPT", { x: MARGIN + 44, y: y - 4, size: 18, font: bold, color: SLATE });
  page.drawText("Official payment receipt", { x: MARGIN + 44, y: y - 18, size: 9, font, color: MUTED });
  // Right side: receipt number + date
  const receiptNo = fee.id.slice(-8).toUpperCase();
  const dateStr = new Date(fee.paidDate || fee.createdAt).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  page.drawText(`Receipt #: ${receiptNo}`, { x: PAGE_W - MARGIN - 130, y: y - 4, size: 10, font: bold, color: SLATE });
  page.drawText(dateStr, { x: PAGE_W - MARGIN - 130, y: y - 18, size: 9, font, color: MUTED });
  y -= 50;

  // Tenant contact line
  const contactParts = [tenant?.address, tenant?.phone].filter(Boolean);
  if (contactParts.length) {
    page.drawText(contactParts.join("  |  "), { x: MARGIN, y, size: 9, font, color: MUTED });
    y -= 18;
  }

  // Status badge
  const status = (fee.status || "pending").toUpperCase();
  const badgeColors: Record<string, typeof EMERALD> = {
    PAID: rgb(16 / 255, 185 / 255, 129 / 255),
    PARTIAL: rgb(245 / 255, 158 / 255, 11 / 255),
    PENDING: rgb(100 / 255, 116 / 255, 139 / 255),
    OVERDUE: rgb(244 / 255, 63 / 255, 94 / 255),
  };
  const badgeColor = badgeColors[status] || EMERALD;
  const badgeW = bold.widthOfTextAtSize(`  ${status}  `, 11) + 16;
  page.drawRectangle({ x: MARGIN, y: y - 18, width: badgeW, height: 22, color: badgeColor });
  page.drawText(status, { x: MARGIN + 10, y: y - 12, size: 11, font: bold, color: WHITE });
  y -= 36;

  // Student details section
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: BORDER });
  y -= 18;
  const student = fee.student;
  const detailRow = (label: string, value: string, x: number, valW = PAGE_W - MARGIN - x) => {
    page.drawText(label, { x, y, size: 8, font, color: MUTED });
    page.drawText(value, { x, y: y - 12, size: 11, font: bold, color: SLATE });
    void valW;
  };
  const col2X = MARGIN + 220;
  detailRow("STUDENT NAME", student?.name || "—", MARGIN);
  detailRow("ROLL NO", student?.rollNo || "—", col2X);
  y -= 36;
  detailRow("CLASS", student?.class?.name || "—", MARGIN);
  detailRow("FEE TYPE", fee.feeStructure?.name || fee.notes || "—", col2X);
  y -= 36;
  detailRow("PAYMENT METHOD", (fee.method || "—").toUpperCase(), MARGIN);
  detailRow("REFERENCE", receiptNo, col2X);
  y -= 28;

  // Amount box (highlighted)
  const boxH = 80;
  page.drawRectangle({ x: MARGIN, y: y - boxH, width: PAGE_W - MARGIN * 2, height: boxH, color: rgb(245 / 255, 252 / 255, 249 / 255), borderColor: rgb(167 / 255, 243 / 255, 208 / 255), borderWidth: 1 });
  const due = Math.max(0, (fee.amount || 0) - (fee.paidAmount || 0));
  const halfW = (PAGE_W - MARGIN * 2) / 3;
  const cols = [
    { label: "TOTAL AMOUNT", value: cur(fee.amount) },
    { label: "PAID AMOUNT", value: cur(fee.paidAmount) },
    { label: "OUTSTANDING", value: cur(due) },
  ];
  cols.forEach((c, i) => {
    const cx = MARGIN + i * halfW + 12;
    page.drawText(c.label, { x: cx, y: y - 22, size: 8, font, color: MUTED });
    page.drawText(c.value, { x: cx, y: y - 40, size: 13, font: bold, color: SLATE });
  });
  y -= boxH + 30;

  // Signature line
  page.drawLine({ start: { x: PAGE_W - MARGIN - 180, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: SLATE });
  page.drawText("Authorized Signature", { x: PAGE_W - MARGIN - 180, y: y - 14, size: 9, font, color: MUTED });
  y -= 40;

  // Footer
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: BORDER });
  y -= 14;
  page.drawText("Jazakallahu Khairan for your timely payment.", { x: MARGIN, y, size: 9, font: bold, color: EMERALD });
  page.drawText("Generated by Madrasa Manager ERP", { x: PAGE_W - MARGIN - 160, y, size: 8, font, color: MUTED });

  pdf.y = y;
  const bytes = await finalizePdf(pdf);
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fee-receipt-${receiptNo}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
