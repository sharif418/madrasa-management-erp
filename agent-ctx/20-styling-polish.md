# Task 20 — Styling Polish (Teachers + Students + Wallet + Audit + Exams)

## Summary
Brought 5 modules (Teachers, Students, Wallet, Audit, Exams) to parity with the
established emerald/teal Islamic design language already used in Dashboard,
Finance, Hifz, Academic, Attendance, Notices, Settings.

## Files Modified (16)
- src/modules/teachers/{teachers-view,teachers-grid,types}.tsx
- src/modules/students/{students-view,students-table}.tsx
- src/modules/wallet/{wallet-view,wallet-table,wallet-types}.tsx
- src/modules/audit/{audit-view,audit-timeline,audit-filters}.tsx
- src/modules/exams/{exams-view,exams-list,exams-types,marks-entry,report-card-view}.tsx
- src/i18n/translations.ts (added `teachers.subtitle` × 3 locales)

## Files Created (1)
- src/modules/import-export/import-export-view.tsx (43-line stub to unblock
  pre-existing HTTP 500 caused by in-progress Task 21)

## Design Tokens Applied (consistent across all 5 modules)
- Header icon tile: `bg-gradient-to-br from-{c1}-500 to-{c2}-600 text-white
  rounded-2xl p-2.5 shadow-lg ring-1 ring-white/30` + Islamic 8-point star
  SVG pattern overlay at `opacity-[0.15]`.
- Hover lift: `hover:-translate-y-1 hover:shadow-lg transition-all duration-300`.
- Primary buttons: `bg-gradient-to-r from-emerald-600 to-teal-600`.
- Color families per module:
  - Teachers / Students / Wallet → emerald→teal
  - Audit → amber→orange (preserved existing amber theme)
  - Exams → violet→purple (preserved existing violet theme)

## Verification
- `bun run lint` → clean (0 errors, 0 warnings).
- `curl http://localhost:3000/` → 200.
- dev.log: no compile errors after edits.
- All files ≤300 lines (marks-entry.tsx at exactly 300).

## Issues/Notes
- Pre-existing breakage: `app-shell.tsx` imported `ImportExportView` from a
  non-existent module (in-progress Task 21). Created a stub to unblock.
  Task 21 agent should overwrite this stub.
- No API/data changes — visual only.
- RTL-safe: all logical Tailwind properties used (ms-/me-/ps-/pe-/text-end).
- All tints have `dark:` variants.
