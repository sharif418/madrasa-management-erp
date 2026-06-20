# Task 49 — Parent-Teacher Meeting (PTM) Scheduler + Student Transfer Certificate

## Agent: full-stack-developer (PTM + Transfer Certificate)

## Summary
Built 2 production-ready features on top of the established Next.js 16 + Prisma + shadcn/ui ERP stack:

1. **Parent-Teacher Meeting (PTM) Scheduler** — full lifecycle: schedule upcoming meetings, mark complete with outcome notes, cancel, history tab with completion-rate stats.
2. **Student Transfer Certificate** — generates real printable PDF (pdf-lib, A4 portrait) with Islamic border, student info, academic record, character notes, signature + seal.

## What was created

### PTM module (Feature 1)
- `src/modules/ptm/ptm-view.tsx` — main shell with cyan→blue gradient header + 2 tabs.
- `src/modules/ptm/ptm-upcoming-tab.tsx` — card grid with Mark Complete / Cancel actions.
- `src/modules/ptm/ptm-history-tab.tsx` — summary cards (total/completed/rate/cancelled) + table.
- `src/modules/ptm/ptm-form.tsx` — searchable student + teacher pickers + date/time/duration/topic.
- `src/modules/ptm/ptm-complete-dialog.tsx` — outcome notes dialog.
- `src/modules/ptm/ptm-types.ts` — shared types, status tones (amber/emerald/rose), Islamic pattern SVG.

### Transfer Certificate (Feature 2)
- `src/lib/pdf-transfer.ts` — pdf-lib A4 portrait generator with star strips + decorative seal.
- `src/app/api/students/[id]/transfer-certificate/route.ts` — GET, RBAC students:export, returns PDF binary.

### API routes
- `src/app/api/ptm/route.ts` — GET (list with filters) + POST (create, communications:create, audit).
- `src/app/api/ptm/[id]/route.ts` — PUT (update status/notes, communications:update) + DELETE.

### Schema / config changes
- `prisma/schema.prisma` — added PtmSession model + back-refs on Tenant/Student/Teacher. Pushed to DB.
- `src/store/app-store.ts` — added "ptm" to ViewKey union.
- `src/components/shell/app-sidebar.tsx` — added PTM nav item (CalendarCheck icon, after communications).
- `src/components/shell/app-shell.tsx` — wired case "ptm" → PtmView.
- `src/i18n/translations.ts` — added 32 keys × 3 locales (en/bn/ar) = 96 new entries.
- `src/modules/students/student-profile-view.tsx` — added Transfer Certificate button (emerald outline, FileText icon) in header. Fetches blob → opens in new tab → toast.

## Multi-tenant + RBAC compliance
- Every DB query filters by `tenantId` from session.
- Student + teacher verified to belong to tenant before PTM insert.
- RBAC enforced on all mutations: `communications:create/update/delete` + `students:export`.
- All mutations audit-logged via `auditAfter`.

## Verification
- `bun run lint` → **0 errors**.
- `npx tsc --noEmit --skipLibCheck` on my new files → only the pre-existing baseline `Uint8Array → BodyInit` lib error (identical to idcards/pdf + seatplan/admit-card routes per prior worklog notes).
- Fixed real bug: switched Attendance queries to use `personId + personType: "student"` (the actual schema fields, not the non-existent `studentId`).
- All file sizes under preferred limits (API routes 60–120 lines, PDF lib ~165 lines, view components 50–200 lines).

## Notes for future agents
- PTM Prisma model cascade-deletes with Student/Teacher/Tenant — no orphans.
- Transfer certificate uses StandardFonts (Latin-only); Arabic name field is skipped in the PDF if it contains non-ASCII characters (per established pdf-lib pattern).
- 8-point Islamic star border pattern is shared across admit-cards + transfer certificates for visual consistency.
- The PTM UI follows the established "card grid + status badges + form dialog" pattern used by waivers/seatplan modules.
