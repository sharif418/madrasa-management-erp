// ID-card-specific pdf-lib drawing helpers (kept separate to keep route file under 200 lines).
// Latin-only (StandardFonts don't support Unicode).
import { PDFFont, PDFPage, rgb } from "pdf-lib";

const WHITE = rgb(1, 1, 1);
const SLATE = rgb(51 / 255, 65 / 255, 85 / 255);
const EMERALD = rgb(16 / 255, 185 / 255, 129 / 255);

/** Truncate text to fit maxW at given font size, appending an ellipsis. */
export function truncText(s: string, maxW: number, font: PDFFont, size: number): string {
  if (font.widthOfTextAtSize(s, size) <= maxW) return s;
  let lo = 0, hi = s.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (font.widthOfTextAtSize(s.slice(0, mid) + "…", size) <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? s.slice(0, lo) + "…" : "";
}

/** Get up to 2 uppercase initials from a name. */
export function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** True if string contains only ASCII characters (StandardFonts safe). */
export function isAscii(s: string): boolean {
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 127) return false;
  return true;
}

/** Draw an Islamic-style star-pattern border strip (decorative). */
export function drawStarStrip(page: PDFPage, x: number, y: number, w: number, h: number, color = EMERALD): void {
  page.drawRectangle({ x, y, width: w, height: h, color });
  for (let sx = x + 4; sx < x + w - 4; sx += 12) {
    page.drawCircle({ x: sx, y: y + h / 2, size: 1.2, color: WHITE });
  }
}

/** Draw a deterministic barcode-like pattern based on a seed string. */
export function drawBarcode(page: PDFPage, x: number, y: number, w: number, h: number, seed: string): void {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  let cx = x, i = 0;
  while (cx < x + w - 4) {
    const barW = ((hash >> (i % 24)) & 1) ? 2 : 1.2;
    if (i % 5 !== 0) page.drawRectangle({ x: cx, y, width: barW, height: h, color: SLATE });
    cx += barW + 1.4; i++;
  }
}
