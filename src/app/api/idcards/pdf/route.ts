// POST /api/idcards/pdf — generates a printable PDF of ID cards.
// Body: { type: "student" | "teacher", ids: string[] }.
// A4 landscape, 2 cards per page. Uses pdf-lib directly (custom card layout).
// Latin-only (StandardFonts). Tenant-scoped. Requires students:export or teachers:export.
import { NextResponse } from "next/server";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { unauthorized, fail, forbidden, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";
import { truncText, getInitials, isAscii, drawStarStrip, drawBarcode } from "@/lib/pdf-idcard";

const PAGE_W = 841.89, PAGE_H = 595.28, MARGIN = 24;
const CARD_W = (PAGE_W - MARGIN * 3) / 2, CARD_H = PAGE_H - MARGIN * 2;
const C = {
  emerald: rgb(16 / 255, 185 / 255, 129 / 255),
  teal: rgb(20 / 255, 184 / 255, 166 / 255),
  deep: rgb(6 / 255, 78 / 255, 59 / 255),
  slate: rgb(51 / 255, 65 / 255, 85 / 255),
  muted: rgb(100 / 255, 116 / 255, 139 / 255),
  border: rgb(203 / 255, 213 / 255, 225 / 255),
  white: rgb(1, 1, 1),
  cardBg: rgb(252 / 255, 254 / 255, 252 / 255),
  badge: rgb(245 / 255, 252 / 255, 249 / 255),
  paleGreen: rgb(167 / 255, 243 / 255, 208 / 255),
  pageBg: rgb(247 / 255, 251 / 255, 249 / 255),
};

type Student = {
  id: string; name: string; nameArabic: string | null; rollNo: string | null;
  className: string | null; bloodGroup: string | null;
  guardianPhone: string | null; photoUrl: string | null; dob: string | null;
};
type Teacher = {
  id: string; name: string; nameArabic: string | null;
  designation: string | null; phone: string | null; photoUrl: string | null;
};
type Tenant = { name: string; address: string | null; phone: string | null };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const body = await req.json().catch(() => ({})) as { type?: "student" | "teacher"; ids?: string[] };
  const type = body.type === "teacher" ? "teacher" : "student";
  const ids = Array.isArray(body.ids) ? body.ids.filter((x) => typeof x === "string") : [];
  if (ids.length === 0) return fail("No IDs provided");
  const moduleKey = type === "student" ? "students" : "teachers";
  if (!(await checkPermission(session, moduleKey, "export")))
    return forbidden("You don't have permission to export ID cards");

  const [tenant, people] = await Promise.all([
    db.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, address: true, phone: true, email: true },
    }) as Promise<Tenant | null>,
    type === "student"
      ? db.student.findMany({
          where: { id: { in: ids }, tenantId: session.tenantId },
          select: { id: true, name: true, nameArabic: true, rollNo: true, bloodGroup: true, guardianPhone: true, photoUrl: true, dob: true, class: { select: { name: true } } },
        }).then((r): Student[] => r.map((s) => ({
          id: s.id, name: s.name, nameArabic: s.nameArabic, rollNo: s.rollNo,
          className: s.class?.name || null, bloodGroup: s.bloodGroup,
          guardianPhone: s.guardianPhone, photoUrl: s.photoUrl,
          dob: s.dob ? s.dob.toISOString().slice(0, 10) : null,
        })))
      : db.teacher.findMany({
          where: { id: { in: ids }, tenantId: session.tenantId },
          select: { id: true, name: true, nameArabic: true, designation: true, phone: true, photoUrl: true },
        }).then((r): Teacher[] => r.map((t) => ({
          id: t.id, name: t.name, nameArabic: t.nameArabic,
          designation: t.designation, phone: t.phone, photoUrl: t.photoUrl,
        }))),
  ]);
  if (people.length === 0) return fail("No matching people found in your madrasa");
  const tenantInfo: Tenant = tenant || { name: "Madrasa", address: null, phone: null };

  try {
    const pdfBytes = await buildPdf(tenantInfo, people, type);
    await auditAfter(session, {
      action: "export", module: moduleKey,
      entityName: `ID Cards PDF (${type}, ${people.length} cards)`,
      details: { type, count: people.length, ids: ids.slice(0, 50) },
    });
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="id-cards-${type}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[idcards/pdf] build failed:", e);
    return fail(e instanceof Error ? e.message : "PDF generation failed", 500);
  }
}

async function buildPdf(tenant: Tenant, people: (Student | Teacher)[], type: "student" | "teacher"): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(`ID Cards — ${tenant.name}`);
  doc.setCreator("Madrasa Manager ERP");
  doc.setProducer("Madrasa Manager ERP (pdf-lib)");
  const now = new Date();
  const validUntil = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const issuedStr = fmt(now), validStr = fmt(validUntil);
  for (let i = 0; i < people.length; i += 2) {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.pageBg });
    people.slice(i, i + 2).forEach((p, idx) => {
      drawCard(page, MARGIN + idx * (CARD_W + MARGIN), MARGIN, CARD_W, CARD_H, p, type, tenant, font, bold, issuedStr, validStr);
    });
  }
  return doc.save();
}

function drawCard(page: PDFPage, x: number, y: number, w: number, h: number,
  person: Student | Teacher, type: "student" | "teacher",
  tenant: Tenant, font: PDFFont, bold: PDFFont, issuedStr: string, validStr: string) {
  page.drawRectangle({ x, y, width: w, height: h, color: C.cardBg, borderColor: C.border, borderWidth: 0.75 });
  drawStarStrip(page, x, y + h - 8, w, 8);
  drawStarStrip(page, x, y, w, 8);
  page.drawRectangle({ x, y: y + 8, width: 6, height: h - 16, color: C.emerald });
  page.drawRectangle({ x: x + w - 6, y: y + 8, width: 6, height: h - 16, color: C.teal });

  // Header band
  const headerH = 70;
  const headerY = y + h - 8 - headerH;
  page.drawRectangle({ x: x + 6, y: headerY, width: w - 12, height: headerH, color: C.deep });
  page.drawRectangle({ x: x + 6, y: headerY + headerH - 5, width: w - 12, height: 5, color: C.emerald });
  const ix = x + 24;
  page.drawCircle({ x: ix + 14, y: headerY + headerH / 2, size: 16, color: C.emerald });
  page.drawText("M", { x: ix + 8, y: headerY + headerH / 2 - 6, size: 14, font: bold, color: C.white });
  page.drawText(truncText(tenant.name || "Madrasa", w - 100, bold, 13), { x: ix + 38, y: headerY + headerH / 2 + 4, size: 13, font: bold, color: C.white });
  page.drawText(type === "student" ? "STUDENT IDENTITY CARD" : "STAFF IDENTITY CARD", { x: ix + 38, y: headerY + headerH / 2 - 11, size: 8, font, color: C.paleGreen });

  // Photo placeholder + initials
  const ps = 92, px = ix, py = headerY - ps - 16;
  page.drawRectangle({ x: px, y: py, width: ps, height: ps, color: C.white, borderColor: C.emerald, borderWidth: 1.5 });
  const init = getInitials(person.name);
  const iw = bold.widthOfTextAtSize(init, 28);
  page.drawText(init, { x: px + (ps - iw) / 2, y: py + ps / 2 - 10, size: 28, font: bold, color: C.emerald });

  // Name + ID badge
  const nameY = py + ps - 12, nameX = px + ps + 16, nameW = x + w - 24 - nameX;
  page.drawText(truncText(person.name || "—", nameW, bold, 14), { x: nameX, y: nameY, size: 14, font: bold, color: C.slate });
  if (person.nameArabic && isAscii(person.nameArabic))
    page.drawText(truncText(person.nameArabic, nameW, font, 10), { x: nameX, y: nameY - 14, size: 10, font, color: C.muted });
  const idLabel = type === "student" ? "ID" : "STAFF ID";
  const idValue = (person as Student).rollNo || person.id.slice(-6).toUpperCase();
  const bw = Math.max(bold.widthOfTextAtSize(idLabel, 7), bold.widthOfTextAtSize(idValue, 10)) + 14;
  page.drawRectangle({ x: nameX, y: nameY - 38, width: bw, height: 24, color: C.badge, borderColor: C.emerald, borderWidth: 0.75 });
  page.drawText(idLabel, { x: nameX + 7, y: nameY - 16, size: 7, font, color: C.muted });
  page.drawText(idValue, { x: nameX + 7, y: nameY - 30, size: 10, font: bold, color: C.deep });

  // Detail fields
  const leftX = ix, rightX = x + w / 2 + 8;
  let ry = py - 14;
  const field = (label: string, value: string, fx: number, fy: number) => {
    page.drawText(label, { x: fx, y: fy, size: 7, font, color: C.muted });
    page.drawText(truncText(value || "N/A", (x + w - 24) - fx - 4, bold, 10), { x: fx, y: fy - 12, size: 10, font: bold, color: C.slate });
  };
  if (type === "student") {
    const s = person as Student;
    field("CLASS", s.className || "—", leftX, ry);
    field("BLOOD GROUP", s.bloodGroup || "—", rightX, ry);
    ry -= 35;
    field("GUARDIAN PHONE", s.guardianPhone || "—", leftX, ry);
    field("DATE OF BIRTH", s.dob || "—", rightX, ry);
  } else {
    const t = person as Teacher;
    field("DESIGNATION", t.designation || "—", leftX, ry);
    field("PHONE", t.phone || "—", rightX, ry);
  }

  // Validity strip + barcode
  const stripH = 56, stripY = y + 8;
  page.drawRectangle({ x: x + 6, y: stripY, width: w - 12, height: stripH, color: C.badge, borderColor: C.border, borderWidth: 0.5 });
  page.drawText("ISSUED", { x: ix, y: stripY + stripH - 14, size: 7, font, color: C.muted });
  page.drawText(issuedStr, { x: ix, y: stripY + stripH - 26, size: 9, font: bold, color: C.slate });
  page.drawText("VALID UNTIL", { x: ix, y: stripY + 10, size: 7, font, color: C.muted });
  page.drawText(validStr, { x: ix, y: stripY - 2, size: 9, font: bold, color: C.emerald });
  drawBarcode(page, x + w - 6 - 110, stripY + 8, 100, stripH - 16, person.id);

  const contactParts = [tenant.address, tenant.phone].filter(Boolean).map(String);
  if (contactParts.length)
    page.drawText(truncText(contactParts.join("  |  "), w - 48, font, 7), { x: ix, y: headerY - 12, size: 7, font, color: C.muted });
}
