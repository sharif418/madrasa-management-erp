# Task ID: 44 — Fee Structure Manager

**Agent**: full-stack-developer (Fee Structure Manager)
**Task**: Build Fee Structure Manager module — fee structures (tuition/admission/exam/hostel/transport), class assignment, auto-generate fee collections.

## Work Log

- Read worklog tail + existing patterns: `app-store.ts` (ViewKey union), `app-sidebar.tsx` (grouped nav), `app-shell.tsx` (view switch), `lib/api.ts` (`withSession`, `ok`, `fail`, `forbidden`, `auditAfter`), `lib/permissions.ts` (`checkPermission`), `lib/audit.ts`, finance module pattern (`/api/finance/funds/route.ts` + `/api/finance/transactions/[id]/route.ts`), `daily-report-view.tsx` for the established header design (emerald→teal gradient tile + Islamic 8-point star SVG pattern).
- Reviewed Prisma schema for `FeeStructure` (id, tenantId, name, classId?, amount, type, frequency, createdAt), `FeeCollection` (no `month` field — encoded month in `dueDate`), `Student`, `Class`. Confirmed `FeeCollection._count` is available via `_count: { select: { collections: true } }` on FeeStructure.
- **Store update** — added `"fees"` to the `ViewKey` union in `src/store/app-store.ts` (single new line after `"dailyreport"`).
- **Sidebar wiring** — added `Receipt` import from `lucide-react` and inserted `{ key: "fees", icon: Receipt }` immediately after `{ key: "finance", icon: Banknote }` in the "nav.system" group of `src/components/shell/app-sidebar.tsx`.
- **Shell wiring** — imported `FeesView` from `@/modules/fees/fees-view` and added `case "fees": return <FeesView />;` after `dailyreport` in `src/components/shell/app-shell.tsx`.
- **i18n keys** — added the required 35 keys × 3 locales (en/bn/ar) to `src/i18n/translations.ts`, inserted right after the existing `nav.dailyreport` line in each locale. Bengali uses Islamic-appropriate terminology (টিউশন, ভর্তি, পরীক্ষা, ছাত্রাবাস, পরিবহন, মাসিক/ত্রৈমাসিক/বার্ষিক/এককালীন, পরিশোধিত/আংশিক/বকেয়া/অতিবকেয়া). Arabic uses Quranic vocabulary (الرسوم الدراسية, القبول, الامتحان, السكن, النقل, شهري/ربع سنوي/سنوي/مرة واحدة, مدفوع/جزئي/معلق/متأخر). Added 5 extra keys (collectionsCount, statusPaid/Partial/Pending/Overdue, student, paidAmount, method, paidDate, filterStatus/Class/Type) needed by the collections table — all translated.
- **API `/api/fee-structures/route.ts`** (105 lines) — GET returns all tenant fee structures with `class.name` and `_count.collections`. POST validates name + amount + type + frequency against whitelists, optionally resolves `classId` to a tenant-owned Class, RBAC `finance:create`, audit-logged.
- **API `/api/fee-structures/[id]/route.ts`** (98 lines) — PUT updates only provided fields, RBAC `finance:update`, audit-logged. DELETE blocks if `_count.collections > 0`, RBAC `finance:delete`, audit-logged.
- **API `/api/fee-structures/generate/route.ts`** (141 lines) — POST accepts `{ feeStructureId, classId?, month?, dueDate? }`. Resolves `dueDate` from `month` (YYYY-MM → first-of-month UTC), explicit `dueDate`, or now+7d fallback. Fetches all active tenant students in the target class (or all classes if no classId). Dedup: queries existing `FeeCollection`s for the same `feeStructureId` whose `dueDate` falls in the same month (gte first-of-month, lt first-of-next-month) and skips those students. Uses `createMany` for bulk insert. Returns `{ generated, skipped, total }`. RBAC `finance:create`, audit-logged with full details.
- **API `/api/fee-structures/collections/route.ts`** (66 lines) — GET lists recent collections with student + class + feeStructure joined, supports `?status=&classId=&type=&limit=` filters. Computes summary aggregates (totalCollected, totalOutstanding, collectionRate, count) over the filtered set.
- **Module `fees-types.ts`** (73 lines) — shared types: `FeeStructure`, `FeeCollectionItem`, `CollectionsSummary`, `GenerateResult`. Color tone maps `FEE_TYPE_TONES` (tuition=emerald, admission=violet, exam=amber, hostel=sky, transport=rose) and `STATUS_TONES` (paid=emerald, partial=amber, pending=rose, overdue=red). `MONTH_VALUES` 1-12 used by the generate dialog (labels rendered at runtime via `Intl.DateTimeFormat` to avoid translation-key dependencies).
- **Module `fee-structure-form.tsx`** (173 lines) — Add/Edit dialog form. Two-column grid for type + frequency + amount + class selectors. Emerald-gradient submit button. Validates name + amount locally. PUT for edit, POST for create. Toasts on success/failure.
- **Module `generate-dialog.tsx`** (166 lines) — Generate Collections dialog. Emerald-tinted info banner showing the fee structure summary. Class selector (defaults to structure.classId or "all"), month selector (Intl-formatted labels), year input, due-date input. Calls `/api/fee-structures/generate` and toasts `fees.generated` with `{generated, skipped}` interpolation.
- **Module `fee-structures-tab.tsx`** (245 lines) — Grid of fee structure cards. Each card shows name + class (or "All Classes"), type badge (color-coded), frequency badge, amount (৳ + locale-formatted), collection count. Card dropdown menu: Edit / Generate Collections / Delete (rose). Add button (emerald gradient) + Dialog-wrapped `FeeStructureForm`. Generate dialog wraps `GenerateDialog`. Delete uses `AlertDialog` with confirmation. Loading skeletons + empty state with `Inbox` icon.
- **Module `collections-tab.tsx`** (225 lines) — Three summary cards (Total Collected / Total Outstanding / Collection Rate) with gradient backgrounds + hover lift. Three filter dropdowns (Status / Class / Type). Collections table inside `ScrollArea` (max-h-60vh) with: student name + class subline, fee type badge, amount, paid amount (sm+), status badge (color-coded), method (lg+), due date (md+), paid date (md+). Locale-aware number + date formatting. Loading skeletons + empty state.
- **Module `fees-view.tsx`** (60 lines) — Main shell. Emerald→teal gradient header tile with `Receipt` icon + Islamic 8-point star SVG pattern overlay (matching the daily-report pattern exactly). 2 tabs: Structures / Collections. RTL-aware via `useApp().dir()`.
- **Verification**: `bun run lint` → 0 errors. `npx tsc --noEmit` → 0 errors in any new/modified file (the 11 pre-existing errors in guardian, dashboard, students, reports, and translations.ts duplicate-key issues are unrelated to this task and were present before).
- Dev server log clean — no compilation errors, server responding 200 on `/`.

## Stage Summary

### Files created
- `/home/z/my-project/src/app/api/fee-structures/route.ts` (105 lines) — GET list + POST create
- `/home/z/my-project/src/app/api/fee-structures/[id]/route.ts` (98 lines) — PUT update + DELETE (with collection guard)
- `/home/z/my-project/src/app/api/fee-structures/generate/route.ts` (141 lines) — POST bulk-generate FeeCollections for class
- `/home/z/my-project/src/app/api/fee-structures/collections/route.ts` (66 lines) — GET recent collections + summary
- `/home/z/my-project/src/modules/fees/fees-types.ts` (73 lines) — shared types + color tone maps
- `/home/z/my-project/src/modules/fees/fees-view.tsx` (60 lines) — main view shell with header + tabs
- `/home/z/my-project/src/modules/fees/fee-structures-tab.tsx` (245 lines) — structures grid + add/edit/delete/generate dialogs
- `/home/z/my-project/src/modules/fees/collections-tab.tsx` (225 lines) — collections table + summary cards + filters
- `/home/z/my-project/src/modules/fees/fee-structure-form.tsx` (173 lines) — add/edit form
- `/home/z/my-project/src/modules/fees/generate-dialog.tsx` (166 lines) — generate collections dialog

### Files modified
- `/home/z/my-project/src/store/app-store.ts` — added `"fees"` to `ViewKey` union
- `/home/z/my-project/src/components/shell/app-sidebar.tsx` — added `Receipt` import + `{ key: "fees", icon: Receipt }` nav item in `nav.system` group
- `/home/z/my-project/src/components/shell/app-shell.tsx` — imported `FeesView` + added `case "fees": return <FeesView />;`
- `/home/z/my-project/src/i18n/translations.ts` — added 40 new keys (35 spec + 5 supporting) × 3 locales (en/bn/ar)

### Quality gates
- All files under 300-line limit (largest: `fee-structures-tab.tsx` at 245 lines).
- Lint: 0 errors. TypeScript: 0 errors in new/modified files.
- Multi-tenant safety: every DB query filters by `session.tenantId` via `withSession` wrapper; `classId` lookups also verify tenant ownership.
- RBAC enforced: `finance:create` (POST + generate), `finance:update` (PUT), `finance:delete` (DELETE).
- All mutations audit-logged via `auditAfter` (module: `finance`).
- RTL support: view + all sub-tabs use `dir={dir()}` from `useApp()`; numbers + dates use `Intl.NumberFormat` / `Intl.DateTimeFormat` with locale fallbacks (ar-EG / bn-BD / en-US).
- No existing module behavior broken — sidebar order preserved, all existing views still routed.
