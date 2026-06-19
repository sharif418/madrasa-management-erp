# Task 21 — Bulk Import/Export Module

**Agent:** full-stack-developer (Import/Export)
**Date:** 2026-06-19

## Summary
Built a complete Bulk Import/Export module for the Madrasa Management ERP — CSV import for students & teachers, CSV export for 4 record types, and a print-friendly HTML fee receipt generator.

## Files Created
- `src/lib/csv.ts` (124 lines) — Minimal CSV parser/serializer (handles quoted fields, escaped quotes, BOM, CRLF). Exports `parseCsv`, `toCsv`, `csvToObjects`, `pick`.
- `src/app/api/import/students/route.ts` (113 lines) — POST multipart/form-data CSV upload. Caches classes by name, validates name + roll uniqueness, creates student + wallet in a transaction, audits the bulk operation. Returns `{ success, errors, total }`.
- `src/app/api/import/teachers/route.ts` (99 lines) — POST CSV upload for teachers. Validates name, joinDate, salary, specialization (whitelist). Audits.
- `src/app/api/export/students/route.ts` (49 lines) — GET CSV with 12 columns (rollNo, name, nameArabic, gender, phone, guardian*, class, isHafiz, isZakatEligible, isActive, admissionDate). Sets `Content-Type: text/csv` + `Content-Disposition: attachment`.
- `src/app/api/export/teachers/route.ts` (45 lines) — GET CSV for teachers.
- `src/app/api/export/transactions/route.ts` (72 lines) — GET CSV for finance transactions. Supports `?from=&to=&type=` filters.
- `src/app/api/export/hifz/route.ts` (77 lines) — GET CSV for hifz records. Supports `?studentId=&type=&from=&to=` filters.
- `src/app/api/export/fee-receipt/[collectionId]/route.ts` (58 lines) — GET returns print-friendly HTML (text/html). Auto-opens print dialog on load.
- `src/modules/import-export/receipt-template.ts` (179 lines) — Renders the fee receipt HTML with inline i18n (en/bn/ar), RTL support, A4 print CSS, Amiri font for Arabic, Inter for Latin. Header w/ gradient logo, status badge, fields grid, totals, signature, footer.
- `src/modules/import-export/csv-templates.ts` (37 lines) — Sample CSV templates (header + 2 sample rows) for students and teachers. Includes `downloadTextFile` helper.
- `src/modules/import-export/import-card.tsx` (255 lines) — Reusable import card with: download-template button, drag-and-drop file area (keyboard accessible), Import button (gradient), CSV format hint (column chips), results display (success/errors/total stat tiles + error details table).
- `src/modules/import-export/export-cards.tsx` (189 lines) — 4 export cards (students/teachers/transactions/hifz) with gradient icon tiles + hover lift, and a separate Fee Receipt card with collection-ID input + Download Receipt button (opens HTML in new tab).
- `src/modules/import-export/import-export-view.tsx` (95 lines) — Main view: gradient emerald→teal header tile with Islamic 8-point star pattern, 2 tabs (Import/Export), wires up the cards.

## Files Modified
- `src/store/app-store.ts` — Added `"import"` to the `ViewKey` union type.
- `src/components/shell/app-sidebar.tsx` — Added `ArrowUpDown` icon import + new nav item in the "system" group (after Reports).
- `src/components/shell/app-shell.tsx` — Imported `ImportExportView` + added `case "import": return <ImportExportView />;`.
- `src/i18n/translations.ts` — Added 36 new translation keys × 3 locales (en/bn/ar = 108 entries) under `nav.import` and `importExport.*` namespaces. Bengali and Arabic use Islamic-appropriate terminology.

## Key Decisions
- **Custom CSV parser**: Wrote a minimal RFC 4180-compliant parser in `src/lib/csv.ts` (no external deps like papaparse). Handles BOM, quoted fields, escaped quotes (`""` → `"`), and CRLF/LF line endings.
- **Critical parser bug fix**: First version lost the last field of each row on `\n` because it pushed `cur` before flushing `field`. Fixed by pushing `field` to `cur` before the row push. Verified by importing a test CSV with 11 columns → all columns correctly parsed.
- **Header-name flexibility**: The `pick()` helper tolerates header whitespace/case differences (e.g., `Name`, `name`, `studentName` all map to name). Makes imports resilient to Excel's habit of capitalizing headers.
- **Class lookup by name**: Students CSV uses `className` (not classId) so admins don't need to know CUIDs. Class names are cached in a Map at the start of the import to avoid N+1 queries.
- **Atomic student + wallet creation**: Each successful row creates the student + wallet in a `db.$transaction` so a partial failure can't leave orphaned students.
- **Error reporting granularity**: Each failed row is reported with its row number (header is row 1, so first data row is row 2) + a clear message. The frontend shows a scrollable error table.
- **HTML receipt approach**: Returns print-friendly HTML (not PDF). The browser's print-to-PDF handles the actual PDF generation — no heavy PDF library needed. Auto-opens `window.print()` after load. A4 page size with 16mm margins.
- **Inline i18n for receipt**: The receipt template has its own mini translation dictionary (en/bn/ar) so the receipt renders correctly even though it's a server-rendered HTML page with no access to the Zustand store. Locale is read from `tenant.language`.
- **RTL support for receipt**: When locale is `ar`, the HTML sets `dir="rtl"` and flips alignments (totals, signature, table cells). Uses Amiri font for Arabic, Inter for Latin scripts.
- **Fee receipt lookup**: Frontend probes the URL with `fetch` first (to show a friendly 404 toast), then opens it in a new tab via `window.open`. This avoids the browser showing a blank tab on 404.
- **Component split**: Main view + 4 sub-components (import-card, export-cards, csv-templates, receipt-template) to keep each file under 300 lines. The ImportCard is reusable for both students and teachers (parameterized by `endpoint`, `templateFilename`, `templateContent`, `columns`, `accent`).
- **Transactions & Hifz exports**: Created extra `/api/export/transactions` and `/api/export/hifz` routes (not strictly required by the task but needed by the 4-card Export tab). Both support optional date-range filters.

## Issues/Notes
- **CSV parser bug**: Initial parser dropped the last field of every row when the CSV ended with `\n`. Caught via curl test — first import succeeded but the imported student had `classId: null` because `className` was never parsed. Fixed by flushing `field` to `cur` before pushing the row on `\n`/`\r`.
- **File-size limits**: Students import limits files to 2 MB. Larger imports should be chunked (future enhancement).
- **No transactions for test data**: The fee receipt endpoint was tested with a real collection ID from the demo DB (`cmql3bos200dnos0h1g2irch4`) — returned 200 with full Bengali-localized HTML receipt (5844 bytes). Invalid IDs return 404 with "Fee collection not found".
- **Audit logging**: Bulk imports create a single audit entry per import (not per row) with summary stats `{ total, success, errors, source: "csv" }` to avoid audit-log spam on large imports.
- **Cleanup**: Test data created during verification (1 test student, 1 test teacher) was deleted to leave the demo DB clean.
- **Lint**: `bun run lint` exit 0 (clean, no errors). No new ESLint warnings introduced.
- **All file lengths within limits**: import/students 113/200, import/teachers 99/150, export/students 49/100, export/teachers 45/80, export/transactions 72/-, export/hifz 77/-, fee-receipt route 58/150 (template split into receipt-template.ts at 179 lines), import-export-view 95/300, import-card 255/300, export-cards 189/300.
- **All endpoints verified working via curl**:
  - `POST /api/import/students` → `{ ok: true, data: { success: 1, errors: [], total: 1 } }`
  - `POST /api/import/teachers` → `{ ok: true, data: { success: 1, errors: [], total: 1 } }`
  - `GET /api/export/students` → 200, CSV with 12 columns
  - `GET /api/export/teachers` → 200, CSV with 11 columns
  - `GET /api/export/transactions` → 200, CSV with 10 columns
  - `GET /api/export/hifz` → 200, CSV with 13 columns
  - `GET /api/export/fee-receipt/{validId}` → 200, HTML (5844 bytes, Bengali localized)
  - `GET /api/export/fee-receipt/invalid-id` → 404, "Fee collection not found"
  - Error CSV test: 3 rows → 1 success + 2 errors (missing name, class not found)
