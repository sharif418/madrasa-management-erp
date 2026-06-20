// Transfer Certificate PDF generator — built on pdf-lib.
// A4 portrait, single page, Latin-only (StandardFonts).
// Emerald accent + Islamic 8-point star border.
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, degrees } from "pdf-lib";

const PAGE_W = 595.28, PAGE_H = 841.89, MARGIN = 40;

const C = {
  emerald: rgb(16 / 255, 185 / 255, 129 / 255),
  teal: rgb(20 / 255, 184 / 255, 166 / 255),
  deep: rgb(6 / 255, 78 / 255, 59 / 255),
  gold: rgb(202 / 255, 161 / 255, 61 / 255),
  slate: rgb(51 / 255, 65 / 255, 85 / 255),
  muted: rgb(100 / 255, 116 / 255, 139 / 255),
  border: rgb(203 / 255, 213 / 255, 225 / 255),
  white: rgb(1, 1, 1),
  bg: rgb(247 / 255, 251 / 255, 249 / 255),
};

export type TransferCertInput = {
  tenantName: string;
  tenantAddress: string | null;
  tenantPhone: string | null;
  studentName: string;
  nameArabic: string | null;
  rollNo: string | null;
  className: string | null;
  dob: string | null;
  admissionDate: string | null;
  gender: string | null;
  guardianName: string | null;
  lastExamName: string | null;
  lastGrade: string | null;
  attendancePct: number | null;
  conduct: string | null;
};

const isAscii = (s: string | null) => !!s && /^[\x00-\x7F]*$/.test(s);

function trunc(s: string, maxW: number, font: PDFFont, size: number): string {
  if (font.widthOfTextAtSize(s, size) <= maxW) return s;
  let lo = 0, hi = s.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (font.widthOfTextAtSize(s.slice(0, mid) + "…", size) <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? s.slice(0, lo) + "…" : "";
}

function drawStar(page: PDFPage, cx: number, cy: number, r: number, color: typeof C.gold, thickness = 1) {
  const half = r / Math.SQRT2;
  page.drawSquare({ x: cx - half, y: cy - half, size: r * Math.SQRT2, borderColor: color, borderWidth: thickness });
  page.drawSquare({ x: cx - half, y: cy - half, size: r * Math.SQRT2, rotate: degrees(-45), borderColor: color, borderWidth: thickness });
}

function drawStarStrip(page: PDFPage, x: number, y: number, w: number, h: number) {
  page.drawRectangle({ x, y, width: w, height: h, color: C.emerald });
  const step = 18;
  for (let i = 0; i < Math.ceil(w / step); i++) drawStar(page, x + i * step + step / 2, y + h / 2, h * 0.36, C.white, 0.5);
}

export async function buildTransferCertificatePdf(input: TransferCertInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Transfer Certificate");
  doc.setCreator("Madrasa Manager ERP");
  doc.setProducer("Madrasa Manager ERP (pdf-lib)");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const page = doc.addPage([PAGE_W, PAGE_H]);
  drawCert(page, font, bold, italic, input);
  return doc.save();
}

function drawCert(
  page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, input: TransferCertInput,
) {
  const cw = PAGE_W - MARGIN * 2;
  // Background frame + border
  page.drawRectangle({ x: MARGIN, y: MARGIN, width: cw, height: PAGE_H - MARGIN * 2, color: C.bg, borderColor: C.emerald, borderWidth: 1.5 });
  // Star strips top + bottom
  drawStarStrip(page, MARGIN, PAGE_H - MARGIN - 16, cw, 16);
  drawStarStrip(page, MARGIN, MARGIN, cw, 16);

  let y = PAGE_H - MARGIN - 30;
  // Header band
  const headerH = 60;
  page.drawRectangle({ x: MARGIN + 14, y: y - headerH, width: cw - 28, height: headerH, color: C.deep });
  page.drawRectangle({ x: MARGIN + 14, y: y - 5, width: cw - 28, height: 5, color: C.emerald });

  // Madrasa name + transfer cert title
  const tn = trunc(input.tenantName, cw - 80, bold, 16);
  page.drawText(tn, { x: (PAGE_W - bold.widthOfTextAtSize(tn, 16)) / 2, y: y - 24, size: 16, font: bold, color: C.white });
  const tc = "TRANSFER CERTIFICATE";
  page.drawText(tc, { x: (PAGE_W - bold.widthOfTextAtSize(tc, 11)) / 2, y: y - 44, size: 11, font: bold, color: C.emerald });
  y -= headerH + 16;

  // Student info section
  const leftX = MARGIN + 24, rightX = PAGE_W / 2 + 8;
  const fieldW = PAGE_W / 2 - MARGIN - 24;
  const field = (label: string, value: string, fx: number, fy: number) => {
    page.drawText(label, { x: fx, y: fy, size: 8, font, color: C.muted });
    page.drawText(trunc(value || "—", fieldW, bold, 11), { x: fx, y: fy - 14, size: 11, font: bold, color: C.slate });
  };
  const arabic = isAscii(input.nameArabic) ? input.nameArabic : null;
  field("STUDENT NAME", input.studentName, leftX, y);
  field("ARABIC NAME", arabic || "—", rightX, y);
  y -= 34;
  field("ROLL NO", input.rollNo || "—", leftX, y);
  field("CLASS", input.className || "—", rightX, y);
  y -= 34;
  field("DATE OF BIRTH", input.dob || "—", leftX, y);
  field("ADMISSION DATE", input.admissionDate || "—", rightX, y);
  y -= 34;
  field("GENDER", input.gender === "female" ? "Female" : "Male", leftX, y);
  field("GUARDIAN", input.guardianName || "—", rightX, y);
  y -= 32;

  // Body statement
  const pronoun = input.gender === "female" ? "her" : "his";
  const pronounCap = input.gender === "female" ? "She" : "He";
  const conduct = input.conduct || "Satisfactory";
  const lines = [
    `This is to certify that ${input.studentName} was a bonafide`,
    `student of this madrasa from ${input.admissionDate || "—"} to ${new Date().toLocaleDateString("en-GB")}.`,
    `During this period, ${pronoun} conduct was ${conduct.toLowerCase()}.`,
    `${pronounCap} has been transferred to another institution.`,
  ];
  for (const ln of lines) {
    page.drawText(trunc(ln, cw - 50, font, 10), { x: MARGIN + 24, y, size: 10, font, color: C.slate });
    y -= 15;
  }
  y -= 14;

  // Academic record
  page.drawRectangle({ x: MARGIN + 14, y: y - 14, width: 3.5, height: 14, color: C.emerald });
  page.drawText("ACADEMIC RECORD", { x: MARGIN + 24, y: y - 11, size: 10, font: bold, color: C.slate });
  y -= 22;
  field("LAST EXAM", input.lastExamName || "—", leftX, y);
  field("GRADE", input.lastGrade || "—", rightX, y);
  y -= 30;
  field("ATTENDANCE", input.attendancePct != null ? `${input.attendancePct}%` : "—", leftX, y);
  field("CONDUCT", conduct, rightX, y);
  y -= 28;

  // Notes line
  page.drawText("This certificate is issued on request without any alteration.",
    { x: MARGIN + 24, y, size: 8.5, font: italic, color: C.muted });
  y -= 20;

  // Contact line
  const contact = [input.tenantAddress, input.tenantPhone].filter(Boolean).join("  |  ");
  if (contact) {
    page.drawText(trunc(contact, cw - 50, font, 8), { x: MARGIN + 24, y, size: 8, font, color: C.muted });
  }

  // Signature + seal
  const sigY = MARGIN + 40;
  page.drawLine({ start: { x: MARGIN + 30, y: sigY }, end: { x: MARGIN + 170, y: sigY }, thickness: 0.5, color: C.slate });
  page.drawText("Date: __________", { x: MARGIN + 30, y: sigY + 4, size: 8, font, color: C.muted });
  page.drawText("Class Teacher", { x: MARGIN + 30, y: sigY - 12, size: 9, font: bold, color: C.slate });

  // Seal (decorative star ring)
  const sealCx = PAGE_W / 2;
  page.drawCircle({ x: sealCx, y: sigY - 4, size: 28, borderColor: C.emerald, borderWidth: 1.2 });
  page.drawCircle({ x: sealCx, y: sigY - 4, size: 22, borderColor: C.gold, borderWidth: 0.6 });
  drawStar(page, sealCx, sigY - 4, 7, C.gold, 0.8);
  page.drawText("OFFICIAL SEAL", { x: sealCx - bold.widthOfTextAtSize("OFFICIAL SEAL", 6) / 2, y: sigY - 22, size: 6, font: bold, color: C.muted });

  // Principal signature (right side)
  page.drawLine({ start: { x: PAGE_W - MARGIN - 170, y: sigY }, end: { x: PAGE_W - MARGIN - 30, y: sigY }, thickness: 0.5, color: C.slate });
  page.drawText("Principal", { x: PAGE_W - MARGIN - 170, y: sigY - 12, size: 9, font: bold, color: C.slate });
}
