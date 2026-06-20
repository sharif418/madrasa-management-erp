# Task 55 — Dark Mode + Excel Export + Leave Management + Late Fee Automation

## Context
- Built 4 medium-priority gap features per worklog GAP-ANALYSIS items 6, 7, 10, 11.
- All features organically integrated into existing modules — no new sidebar items.
- Project: Next.js 16 + TypeScript + Prisma/SQLite (multi-tenant via tenantId).

## Work Log
1. Read existing patterns: `app/layout.tsx`, `app-header.tsx`, `export-cards.tsx`, `teachers-view.tsx`, `fee-structure-form.tsx`, `collections-tab.tsx`, `fees-types.ts`, `lib/api.ts`, `lib/permissions.ts`, `lib/audit.ts`, `lib/csv.ts`, prisma schema, `translations.ts`, `app-store.ts`, `globals.css`.
2. Confirmed `next-themes@0.4.6` installed. Installed `exceljs@4.4.0`.
3. Confirmed `globals.css` already had `:root` (light) + `.dark` (dark) CSS variables — only needed wiring.

## Feature 1 — Dark Mode
- Wrapped `<Providers>` in `<ThemeProvider attribute="class" defaultTheme="light" enableSystem>` in `src/app/layout.tsx`.
- Created `src/components/shared/theme-toggle.tsx` (45 lines): client component, cycles light → dark → system, Sun/Moon/Monitor icons, emerald-tinted hover.
- Integrated `<ThemeToggle />` between LanguageSwitcher and NotificationBell in `src/components/shell/app-header.tsx`.

## Feature 2 — Excel Export
- Created `src/lib/excel.ts` (78 lines): `generateExcel(filename, sheets)` returns Buffer with bold emerald-fill headers, auto-width columns, frozen header row; `excelResponse(buf, filename)` returns a Response with proper .xlsx headers.
- Updated `src/app/api/export/students/route.ts` and `src/app/api/export/teachers/route.ts` to accept `?format=csv|xlsx` query param. Default = csv (preserves existing behavior).
- Updated `src/modules/import-export/export-cards.tsx`: each export card now has two buttons — CSV (outline) + Excel (emerald-tinted). Replaced `filename` prop with `baseFilename`, appends `.csv` / `.xlsx` based on format.

## Feature 3 — Leave Management
- Prisma: added `StaffLeave` model (tenantId, teacherId, type, startDate, endDate, reason, status, approvedBy, approvedAt, createdAt) with cascade relations to Tenant + Teacher. Added `staffLeaves StaffLeave[]` to both. Ran `bun run db:push` successfully.
- Created `src/app/api/teachers/leave/route.ts` (95 lines): GET (list with `?status=` + `?teacherId=` filters, includes teacher name) + POST (create, validates type/dates/reason, RBAC `teachers:create`, audit).
- Created `src/app/api/teachers/leave/[id]/route.ts` (52 lines): PATCH to approve/reject, RBAC `teachers:update`, audit.
- Created `src/modules/teachers/leave-tab.tsx` (~250 lines): 3 summary cards (pending / approved this month / rejected), "Apply Leave" dialog with teacher selector + 5 leave types + date range + reason + days counter + auto-computed days-between, leave requests table with status badges (pending=amber, approved=emerald, rejected=rose), inline approve/reject buttons for pending items.
- Integrated as 3rd "Leave" tab (CalendarDays icon) in `teachers-view.tsx`.

## Feature 4 — Late Fee Automation
- Prisma: added `lateFeePerDay Float @default(0)` to FeeStructure + `lateFee Float @default(0)` to FeeCollection. Ran `bun run db:push`.
- Created `src/app/api/fees/late-fee/route.ts` (76 lines): POST with RBAC `finance:update`, optional `classId` filter. For each FeeCollection where status != paid, dueDate < today, and feeStructure.lateFeePerDay > 0: computes daysOverdue × rate, updates `lateFee` + sets `status="overdue"`. Audit logged.
- Updated `src/app/api/fee-structures/route.ts` (POST) + `[id]/route.ts` (PUT) to accept + persist `lateFeePerDay`.
- Updated `src/app/api/fee-structures/collections/route.ts` (GET) to return `lateFee` on each item + include `lateFee` in summary totals.
- Updated `src/modules/fees/fees-types.ts`: added `lateFeePerDay` to FeeStructure + `lateFee` to FeeCollectionItem.
- Updated `src/modules/fees/fee-structure-form.tsx`: added "Late Fee Per Day (৳)" input alongside Amount with live preview (× days).
- Updated `src/modules/fees/collections-tab.tsx`: added "Calculate Late Fees" button (emerald-tinted) in toolbar, added Late Fee column showing rose badge when lateFee > 0, RTL-aware.

## i18n keys added (3 locales × 28 new keys)
- common.darkMode / common.lightMode / common.systemMode
- export.csv / export.excel
- teachers.leave / teachers.applyLeave / teachers.leaveType / teachers.sick / teachers.casual / teachers.annual / teachers.maternity / teachers.emergency / teachers.startDate / teachers.endDate / teachers.reason / teachers.approve / teachers.reject / teachers.approved / teachers.rejected / teachers.days / teachers.leaveSaved (also reused teachers.pending — already existed)
- fees.lateFeePerDay / fees.calculateLateFees / fees.lateFeesUpdated / fees.lateFee
- Islamic-appropriate Bengali + Arabic (e.g., "ছুটির আবেদন", "طلب إجازة", "বিলম্ব ফি", "رسوم التأخير").

## Lint + Verification
- `bun run lint` → 0 errors (initially had `react-hooks/set-state-in-effect` on theme-toggle; refactored to `useMounted` helper using `queueMicrotask`).
- All 4 new API endpoints respond correctly when probed without session (401 for GET /api/teachers/leave, 405 for GET /api/fees/late-fee, 401 for /api/export/*?format=, 401 for PATCH /api/teachers/leave/[id]).
- Dev server compiles all new routes without errors.

## Files Created
- `src/components/shared/theme-toggle.tsx`
- `src/lib/excel.ts`
- `src/app/api/teachers/leave/route.ts`
- `src/app/api/teachers/leave/[id]/route.ts`
- `src/app/api/fees/late-fee/route.ts`
- `src/modules/teachers/leave-tab.tsx`
- `agent-ctx/55-full-stack-developer-darkmode-excel-leave-latefee.md`

## Files Modified
- `src/app/layout.tsx` (added ThemeProvider)
- `src/components/shell/app-header.tsx` (added ThemeToggle)
- `src/app/api/export/students/route.ts` (?format=xlsx support)
- `src/app/api/export/teachers/route.ts` (?format=xlsx support)
- `src/modules/import-export/export-cards.tsx` (CSV + Excel buttons)
- `prisma/schema.prisma` (StaffLeave model + lateFeePerDay + lateFee + relations)
- `src/app/api/fee-structures/route.ts` (GET + POST lateFeePerDay)
- `src/app/api/fee-structures/[id]/route.ts` (PUT lateFeePerDay)
- `src/app/api/fee-structures/collections/route.ts` (return lateFee + summary)
- `src/modules/fees/fees-types.ts` (added lateFeePerDay + lateFee)
- `src/modules/fees/fee-structure-form.tsx` (added Late Fee Per Day input)
- `src/modules/fees/collections-tab.tsx` (added Calculate Late Fees button + late fee column)
- `src/modules/teachers/teachers-view.tsx` (added Leave tab)
- `src/i18n/translations.ts` (+28 keys × 3 locales)

## Stats
- All files under 300 lines (most under 250).
- All API routes: tenant-scoped + RBAC + audit.
- RTL-aware (dir() wrapper used in all UI components).
- 4 features organically integrated — no new sidebar items.
