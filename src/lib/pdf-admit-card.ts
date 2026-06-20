// Admit Card PDF generator — built on pdf-lib.
// A4 portrait, 1 card per page, Latin-only (StandardFonts). Emerald accent + Islamic star border.
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

const PAGE_W = 595.28, PAGE_H = 841.89, MARGIN = 40;
export const C = {
  emerald: rgb(16 / 255, 185 / 255, 129 / 255),
  teal: rgb(20 / 255, 184 / 255, 166 / 255),
  deep: rgb(6 / 255, 78 / 255, 59 / 255),
  slate: rgb(51 / 255, 65 / 255, 85 / 255),
  muted: rgb(100 / 255, 116 / 255, 139 / 255),
  border: rgb(203 / 255, 213 / 255, 225 / 255),
  white: rgb(1, 1, 1),
  bg: rgb(247 / 255, 251 / 255, 249 / 255),
};

export type AdmitCard = {
  studentName: string; nameArabic: string | null; rollNo: string | null;
  className: string | null; seatNo: string | null; roomName: string;
};

const RULES = [
  "1. Arrive at the exam hall 15 minutes before the scheduled time.",
  "2. Bring this admit card and a valid ID. No entry without it.",
  "3. Mobile phones and electronic devices are strictly prohibited.",
  "4. Follow the invigilator's instructions at all times.",
  "5. Any form of cheating will result in disqualification.",
  "6. Maintain silence and Islamic etiquette inside the exam hall.",
];

const isAscii = (s: string) => /^[\x00-\x7F]*$/.test(s);

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

export function asciiArabic(s: string | null): string | null {
  return s && isAscii(s) ? s : null;
}

function drawStar(page: PDFPage, cx: number, cy: number, r: number) {
  const pts: [number, number][] = [];
  for (let k = 0; k < 16; k++) {
    const a = (Math.PI * 2 * k) / 16 - Math.PI / 2;
    pts.push([cx + Math.cos(a) * (k % 2 === 0 ? r : r * 0.42), cy + Math.sin(a) * (k % 2 === 0 ? r : r * 0.42)]);
  }
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    page.drawLine({ start: { x: pts[i][0], y: pts[i][1] }, end: { x: pts[j][0], y: pts[j][1] }, thickness: 0.4, color: C.white });
  }
}

function drawStarStrip(page: PDFPage, x: number, y: number, w: number, h: number) {
  page.drawRectangle({ x, y, width: w, height: h, color: C.emerald });
  const step = 18;
  for (let i = 0; i < Math.ceil(w / step); i++) drawStar(page, x + i * step + step / 2, y + h / 2, h * 0.36);
}

export async function buildAdmitCardPdf(
  tenantName: string, tenantAddr: string, tenantPhone: string,
  examName: string, startDate: Date | null, endDate: Date | null,
  subjects: string[], cards: AdmitCard[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(`Admit Cards — ${examName}`);
  doc.setCreator("Madrasa Manager ERP");
  doc.setProducer("Madrasa Manager ERP (pdf-lib)");
  const fmt = (d: Date | null) =>
    d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const dateRange = startDate && endDate ? `${fmt(startDate)} — ${fmt(endDate)}` : fmt(startDate) || "—";

  for (const card of cards) {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawCard(page, font, bold, tenantName, tenantAddr, tenantPhone, examName, dateRange, subjects, card);
  }
  return doc.save();
}

function drawCard(
  page: PDFPage, font: PDFFont, bold: PDFFont,
  tenantName: string, tenantAddr: string, tenantPhone: string,
  examName: string, dateRange: string, subjects: string[], card: AdmitCard,
) {
  const cw = PAGE_W - MARGIN * 2;
  page.drawRectangle({ x: MARGIN, y: MARGIN, width: cw, height: PAGE_H - MARGIN * 2, color: C.bg, borderColor: C.emerald, borderWidth: 1.5 });
  drawStarStrip(page, MARGIN, PAGE_H - MARGIN - 16, cw, 16);
  drawStarStrip(page, MARGIN, MARGIN, cw, 16);

  let y = PAGE_H - MARGIN - 28;
  const headerH = 56;
  page.drawRectangle({ x: MARGIN + 14, y: y - headerH, width: cw - 28, height: headerH, color: C.deep });
  page.drawRectangle({ x: MARGIN + 14, y: y - 5, width: cw - 28, height: 5, color: C.emerald });
  const tn = trunc(tenantName, cw - 80, bold, 16);
  page.drawText(tn, { x: (PAGE_W - bold.widthOfTextAtSize(tn, 16)) / 2, y: y - 22, size: 16, font: bold, color: C.white });
  const ac = "ADMIT CARD";
  page.drawText(ac, { x: (PAGE_W - bold.widthOfTextAtSize(ac, 11)) / 2, y: y - 40, size: 11, font: bold, color: C.emerald });
  y -= headerH + 14;

  const ex = trunc(examName, cw - 60, bold, 13);
  page.drawText(ex, { x: (PAGE_W - bold.widthOfTextAtSize(ex, 13)) / 2, y, size: 13, font: bold, color: C.slate });
  y -= 14;
  page.drawText(dateRange, { x: (PAGE_W - font.widthOfTextAtSize(dateRange, 10)) / 2, y, size: 10, font, color: C.muted });
  y -= 18;

  const leftX = MARGIN + 24, rightX = PAGE_W / 2 + 8;
  const fieldW = PAGE_W / 2 - MARGIN - 24;
  const field = (label: string, value: string, fx: number, fy: number) => {
    page.drawText(label, { x: fx, y: fy, size: 8, font, color: C.muted });
    page.drawText(trunc(value || "—", fieldW, bold, 11), { x: fx, y: fy - 14, size: 11, font: bold, color: C.slate });
  };
  field("STUDENT NAME", card.studentName, leftX, y);
  field("ROLL NO", card.rollNo || "—", rightX, y);
  y -= 34;
  field("ARABIC NAME", card.nameArabic || "—", leftX, y);
  field("CLASS", card.className || "—", rightX, y);
  y -= 34;
  field("SEAT NO", card.seatNo || "—", leftX, y);
  field("ROOM", card.roomName, rightX, y);
  y -= 30;

  page.drawRectangle({ x: MARGIN + 14, y: y - 14, width: 3.5, height: 14, color: C.emerald });
  page.drawText("SUBJECTS", { x: MARGIN + 24, y: y - 11, size: 10, font: bold, color: C.slate });
  y -= 22;
  const subjPerRow = 2;
  const subjColW = (cw - 28) / subjPerRow;
  const rowH = 18;
  for (let i = 0; i < subjects.length; i++) {
    const col = i % subjPerRow;
    const row = Math.floor(i / subjPerRow);
    const sx = MARGIN + 14 + col * subjColW + 8;
    const sy = y - row * rowH;
    page.drawRectangle({ x: sx, y: sy - 11, width: 4, height: 4, color: C.emerald });
    page.drawText(trunc(subjects[i], subjColW - 18, font, 9.5), { x: sx + 6, y: sy - 13, size: 9.5, font, color: C.slate });
  }
  y -= Math.ceil(subjects.length / subjPerRow) * rowH + 14;

  page.drawRectangle({ x: MARGIN + 14, y: y - 14, width: 3.5, height: 14, color: C.emerald });
  page.drawText("EXAM RULES", { x: MARGIN + 24, y: y - 11, size: 10, font: bold, color: C.slate });
  y -= 22;
  for (const rule of RULES) {
    page.drawText(trunc(rule, cw - 50, font, 8.5), { x: MARGIN + 24, y, size: 8.5, font, color: C.slate });
    y -= 13;
  }
  y -= 12;

  const contact = [tenantAddr, tenantPhone].filter(Boolean).join("  |  ");
  if (contact) {
    page.drawText(trunc(contact, cw - 50, font, 8), { x: MARGIN + 24, y, size: 8, font, color: C.muted });
  }

  const sigY = MARGIN + 36;
  page.drawLine({ start: { x: MARGIN + 30, y: sigY }, end: { x: MARGIN + 160, y: sigY }, thickness: 0.5, color: C.slate });
  page.drawText("Invigilator", { x: MARGIN + 30, y: sigY - 12, size: 9, font: bold, color: C.slate });
  page.drawLine({ start: { x: PAGE_W - MARGIN - 160, y: sigY }, end: { x: PAGE_W - MARGIN - 30, y: sigY }, thickness: 0.5, color: C.slate });
  page.drawText("Principal", { x: PAGE_W - MARGIN - 160, y: sigY - 12, size: 9, font: bold, color: C.slate });
}
