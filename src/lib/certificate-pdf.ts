// Reusable PDF certificate generator built on pdf-lib.
// A4 landscape, decorative Islamic border, emerald + gold accents.
// StandardFonts only support Latin — Arabic fields are skipped if non-Latin.
import { PDFDocument, StandardFonts, PDFFont, PDFPage, rgb, degrees } from "pdf-lib";

export type CertType = "completion" | "hifz" | "merit" | "participation";

export const CERT_TITLES: Record<CertType, string> = {
  completion: "Certificate of Completion",
  hifz: "Hifz Completion Certificate",
  merit: "Certificate of Merit",
  participation: "Certificate of Participation",
};

const BODY_VERB: Record<CertType, string> = {
  completion: "has successfully completed the course at",
  hifz: "has successfully completed the memorization of the Holy Quran (Hifz) at",
  merit: "has demonstrated outstanding academic achievement at",
  participation: "has actively participated in the program at",
};

// A4 landscape (PDF points)
const PW = 841.89;
const PH = 595.28;
const WHITE = rgb(1, 1, 1);
const EMERALD = rgb(16 / 255, 185 / 255, 129 / 255);
const EMERALD_DARK = rgb(4 / 255, 120 / 255, 87 / 255);
const GOLD = rgb(202 / 255, 161 / 255, 61 / 255);
const SLATE = rgb(51 / 255, 65 / 255, 85 / 255);
const MUTED = rgb(100 / 255, 116 / 255, 139 / 255);
const CREAM = rgb(252 / 255, 248 / 255, 235 / 255);

const isLatin = (s?: string | null) => !!s && /^[\x00-\x7F]*$/.test(s);

function centerText(page: PDFPage, text: string, font: PDFFont, size: number, y: number, color = SLATE) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PW - w) / 2, y, size, font, color });
}

function centerTextAt(page: PDFPage, text: string, font: PDFFont, size: number, cx: number, y: number, color: ReturnType<typeof rgb>) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx - w / 2, y, size, font, color });
}

// 8-point Islamic star (two overlapping squares)
function drawStar(page: PDFPage, cx: number, cy: number, r: number, color: ReturnType<typeof rgb>, thickness = 1.2) {
  const half = r / Math.SQRT2;
  page.drawSquare({ x: cx - half, y: cy - half, size: r * Math.SQRT2, borderColor: color, borderWidth: thickness });
  page.drawSquare({ x: cx - half, y: cy - half, size: r * Math.SQRT2, rotate: degrees(-45), borderColor: color, borderWidth: thickness });
}

function drawDecorativeBorder(page: PDFPage) {
  page.drawRectangle({ x: 24, y: 24, width: PW - 48, height: PH - 48, borderColor: EMERALD, borderWidth: 3, color: undefined });
  page.drawRectangle({ x: 34, y: 34, width: PW - 68, height: PH - 68, borderColor: GOLD, borderWidth: 1.2, color: undefined });
  page.drawRectangle({ x: 42, y: 42, width: PW - 84, height: PH - 84, borderColor: EMERALD_DARK, borderWidth: 0.6, color: undefined });
  drawStar(page, 56, PH - 56, 11, GOLD, 1);
  drawStar(page, PW - 56, PH - 56, 11, GOLD, 1);
  drawStar(page, 56, 56, 11, GOLD, 1);
  drawStar(page, PW - 56, 56, 11, GOLD, 1);
}

function wrapText(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxW) {
      if (line) lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export type CertInput = {
  tenantName: string;
  tenantAddress?: string | null;
  tenantPhone?: string | null;
  tenantEmail?: string | null;
  studentName: string;
  studentNameArabic?: string | null;
  className?: string | null;
  certificateType: CertType;
  customText?: string | null;
  studentId: string;
};

export async function generateCertificate(input: CertInput): Promise<Uint8Array> {
  const { tenantName, certificateType: ct } = input;
  const studentName = input.studentName || "Student";
  const arabicName = isLatin(input.studentNameArabic) ? input.studentNameArabic : null;
  const className = input.className || "the program";
  const custom = (typeof input.customText === "string" && input.customText.trim())
    ? input.customText.trim().slice(0, 220)
    : null;

  const now = new Date();
  const gregStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  let hijriStr = "";
  try {
    hijriStr = new Intl.DateTimeFormat("en-US", {
      calendar: "islamic", day: "2-digit", month: "long", year: "numeric",
    }).format(now);
  } catch { hijriStr = ""; }
  const refNo = `CERT-${now.getFullYear()}-${input.studentId.slice(-6).toUpperCase()}`;

  const doc = await PDFDocument.create();
  doc.setTitle(`${CERT_TITLES[ct]} — ${studentName}`);
  doc.setAuthor(tenantName);
  doc.setCreator("Madrasa Manager ERP");
  doc.setSubject("Student Certificate");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const page = doc.addPage([PW, PH]);

  page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: CREAM });
  drawDecorativeBorder(page);

  // Top emerald band with Bismillah (transliterated)
  page.drawRectangle({ x: 50, y: PH - 70, width: PW - 100, height: 30, color: EMERALD, borderColor: GOLD, borderWidth: 1 });
  page.drawRectangle({ x: 50, y: PH - 73, width: PW - 100, height: 2, color: GOLD });
  centerText(page, "Bismillah ir-Rahman ir-Raheem", italic, 11, PH - 60, WHITE);

  // Madrasa name
  centerText(page, tenantName.toUpperCase(), bold, 22, PH - 110, EMERALD_DARK);
  const contactParts = [input.tenantAddress, input.tenantPhone, input.tenantEmail].filter(Boolean);
  if (contactParts.length) {
    centerText(page, contactParts.join("  ·  "), regular, 8.5, PH - 124, MUTED);
  }

  // Gold divider with diamond accents
  const dividerW = 220, dx = (PW - dividerW) / 2;
  page.drawLine({ start: { x: dx, y: PH - 138 }, end: { x: dx + dividerW, y: PH - 138 }, thickness: 1, color: GOLD });
  page.drawCircle({ x: PW / 2, y: PH - 138, size: 2.5, color: GOLD });
  page.drawCircle({ x: dx - 8, y: PH - 138, size: 1.8, color: GOLD });
  page.drawCircle({ x: dx + dividerW + 8, y: PH - 138, size: 1.8, color: GOLD });

  // Title banner
  const titleText = CERT_TITLES[ct];
  const titleW = bold.widthOfTextAtSize(titleText, 28);
  page.drawRectangle({
    x: (PW - titleW - 56) / 2, y: PH - 188, width: titleW + 56, height: 38,
    color: EMERALD_DARK, borderColor: GOLD, borderWidth: 1.2,
  });
  centerText(page, titleText, bold, 28, PH - 175, WHITE);

  centerText(page, "This is to certify that", italic, 13, PH - 220, MUTED);

  // Student name (auto-fit)
  let nameSize = 32;
  while (bold.widthOfTextAtSize(studentName, nameSize) > PW - 200 && nameSize > 18) nameSize -= 1;
  centerText(page, studentName, bold, nameSize, PH - 258, SLATE);
  if (arabicName) centerText(page, arabicName, italic, 14, PH - 278, EMERALD_DARK);

  const ulW = 180, ulx = (PW - ulW) / 2;
  page.drawLine({ start: { x: ulx, y: PH - 290 }, end: { x: ulx + ulW, y: PH - 290 }, thickness: 0.8, color: GOLD });

  // Body sentence
  centerText(page, BODY_VERB[ct], regular, 12, PH - 318, SLATE);
  centerText(page, tenantName, bold, 14, PH - 336, EMERALD_DARK);
  if (ct === "completion" || ct === "participation") {
    centerText(page, `(Class: ${className})`, italic, 11, PH - 354, MUTED);
  } else if (ct === "hifz") {
    centerText(page, "May Allah accept and preserve the Hifz of the Holy Quran.", italic, 10.5, PH - 354, EMERALD_DARK);
  } else {
    centerText(page, "We pray for continued success and excellence.", italic, 10.5, PH - 354, EMERALD_DARK);
  }

  // Custom message (wrapped, max 3 lines)
  let customY = PH - 380;
  if (custom) {
    const lines = wrapText(custom, regular, 11, PW - 240).slice(0, 3);
    for (const ln of lines) {
      centerText(page, `"${ln}"`, italic, 11, customY, MUTED);
      customY -= 16;
    }
    customY -= 6;
  }

  // Dates (left) + Reference (right)
  const dateY = Math.min(customY, PH - 410);
  page.drawText("Date:", { x: 90, y: dateY, size: 10, font: bold, color: MUTED });
  page.drawText(gregStr, { x: 130, y: dateY, size: 11, font: regular, color: SLATE });
  if (hijriStr) {
    page.drawText("Hijri:", { x: 90, y: dateY - 18, size: 10, font: bold, color: MUTED });
    page.drawText(hijriStr, { x: 130, y: dateY - 18, size: 11, font: regular, color: SLATE });
  }
  const refLabelW = regular.widthOfTextAtSize("Reference:", 10);
  const refValW = bold.widthOfTextAtSize(refNo, 11);
  page.drawText("Reference:", { x: PW - 90 - refLabelW - 4 - refValW, y: dateY, size: 10, font: regular, color: MUTED });
  page.drawText(refNo, { x: PW - 90 - refValW, y: dateY, size: 11, font: bold, color: SLATE });

  // Signature line (left)
  const sigY = dateY - 50;
  page.drawLine({ start: { x: 90, y: sigY }, end: { x: 240, y: sigY }, thickness: 0.8, color: SLATE });
  page.drawText("Principal", { x: 90, y: sigY - 14, size: 10, font: bold, color: SLATE });
  page.drawText(tenantName, { x: 90, y: sigY - 26, size: 8, font: regular, color: MUTED });

  // Seal (drawn circle, right side)
  const sealX = PW - 150, sealY = sigY + 12;
  page.drawCircle({ x: sealX, y: sealY, size: 38, color: undefined, borderColor: EMERALD_DARK, borderWidth: 1.6 });
  page.drawCircle({ x: sealX, y: sealY, size: 30, color: undefined, borderColor: GOLD, borderWidth: 0.8 });
  page.drawCircle({ x: sealX, y: sealY, size: 22, color: CREAM });
  centerTextAt(page, "OFFICIAL", bold, 7.5, sealX, sealY + 6, EMERALD_DARK);
  centerTextAt(page, "SEAL", bold, 8, sealX, sealY - 4, EMERALD_DARK);
  drawStar(page, sealX, sealY + 30, 3, GOLD, 0.6);
  drawStar(page, sealX, sealY - 30, 3, GOLD, 0.6);

  // Bottom emerald band
  page.drawRectangle({ x: 50, y: 40, width: PW - 100, height: 18, color: EMERALD, borderColor: GOLD, borderWidth: 0.8 });
  centerText(page, "Jazakallahu Khairan", italic, 9, 47, WHITE);

  return doc.save();
}
