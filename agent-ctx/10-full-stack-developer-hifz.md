# Task 10 — Hifz Tracking Engine (full-stack-developer)

## Work Log
- Read project worklog, Prisma schema (HifzRecord + Student + User relations), `@/lib/api`
  (`ok/fail/notFound/withSession/auditAfter`), `@/lib/session` (`getSession` →
  `{ userId, tenantId, name, phone, roles }`), `@/lib/audit`, `useApp` Zustand store
  (`t`, `dir`, `locale`), existing `hifz.*` translation keys, and the `students/[id]` route
  pattern for the `withSession` + `params` convention.
- Added 35 new `hifz.*` translation keys per locale (en / bn / ar) for: tabs, student
  selector, date filters, table headers, empty/loading states, success/error toasts,
  delete confirm, paras covered legend, stats labels (last30d, avgQuality, byType,
  qualityTrend), submit button, hints, etc. Kept `Sabak / Sabaq Para / Dhor / Para /
  Surah / Ayah` verbatim across all three languages (per project convention).
- Built `/api/hifz/route.ts` (134 lines): `withSession`-wrapped GET + POST.
  - GET: builds a tenant-scoped `where` clause from `?studentId`, `?type`, `?from`,
    `?to`, plus `?page` & `?limit` (default 20, capped 100). Includes the related
    Student (name/nameArabic/rollNo) and Teacher (name). Returns flattened `items`
    with `page/limit/total/totalPages`. Date range uses `gte`/`lte` (with end-of-day
    on `to`).
  - POST: validates `studentId`, `type ∈ {sabak,sabaq_para,dhor}`, integer `paraNumber
    1-30`, optional `status ∈ {completed,revision,weak}`. Verifies the student belongs
    to the tenant (404 otherwise). Sets `teacherId = session.userId`. After insert,
    if the student now has ≥30 distinct completed paras, auto-flags `isHafiz=true`.
    Audit logged via `auditAfter`.
- Built `/api/hifz/[id]/route.ts` (27 lines): DELETE — `withSession`, tenant-scoped
  `findFirst` (404 if missing/foreign), then `delete`, then `auditAfter`.
- Built `/api/hifz/progress/route.ts` (90 lines): GET — verifies student belongs to
  tenant, loads all of the student's records (tenant-scoped), then computes:
    - `totalParas`: distinct paras with `status=completed`
    - `last30d`: count of records with `recordedAt >= now-30d`
    - `byType`: `{ sabak, sabaq_para, dhor }` counts
    - `avgQuality`: average `qualityRating` over rated records (rounded to 0.1)
    - `parasCovered`: 30-cell array `{para, status}` where `memorized` >
      `in-progress` (revision/weak) > `not-started`
    - `trend`: last 20 rated records reversed to oldest→newest for the chart
  All done in-memory from a single DB query (small per-student dataset).
- Built `src/modules/hifz/hifz-types.ts` (119 lines): shared TS types
  (`HifzType`, `HifzStatus`, `ParaStatus`, `HifzRecord`, `HifzListResponse`,
  `ProgressResponse`, `StudentOption`), `HIFZ_TYPES`/`HIFZ_STATUSES` arrays,
  `typeLabelKey`/`statusLabelKey` i18n helpers, warm accent colors per type
  (teal/yellow/purple — no indigo/blue), Tailwind class tokens for status badges
  and para cells, `fmtDate` (locale-aware via `Intl.DateTimeFormat`), and a
  `starString` helper.
- Built `src/modules/hifz/hifz-form.tsx` (275 lines): "use client" add-record Dialog.
  Student select + Para (1-30) select + radio-card Type selector (with accent dot),
  Surah name + Ayah range (3-col), 5-star quality picker (lucide `Star`, amber fill),
  mistakes number input, status Select, notes Textarea. Submits to `/api/hifz`,
  shows toast on success/error, calls `onCreated` to refresh parents.
- Built `src/modules/hifz/hifz-records-table.tsx` (273 lines): filters bar
  (student / type / from / to / Add button) + responsive Table with columns
  Student · Type · Para · Surah/Ayah · Quality (stars) · Mistakes · Status · Date ·
  Actions. Skeleton rows while loading, friendly empty state, AlertDialog-gated
  delete with destructive action, simple pagination (prev/next + page indicator).
- Built `src/modules/hifz/hifz-progress.tsx` (283 lines): student selector with
  Hafiz badge (when `student.isHafiz`); big card with hand-rolled SVG circular
  progress (animated `strokeDashoffset`, emerald); stats row (last30d / avgQuality /
  byType breakdown with accent dots); 30-cell para grid (5 cols mobile → 10 cols
  desktop) with green/amber/gray status colors + hover scale + tooltip; recharts
  LineChart for quality trend (last 20 rated, teal stroke, domain 0-5, Tooltip
  localized). Wrapped in `<div dir="ltr">` so the chart axis renders correctly
  regardless of app RTL state.
- Built `src/modules/hifz/hifz-view.tsx` (120 lines): top-level shell. Loads the
  tenant's students once via `/api/students?limit=100` (shared by form/records/
  progress). Header with emerald icon tile + Add button. Two-tab `Tabs`:
  `recordsTab` (renders `HifzRecordsTable`) and `progressTab` (renders
  `HifzProgress`). Owns the shared `HifzForm` Dialog and a `refreshKey` counter
  bumped on every successful create so both children refetch.
- Ran `bunx eslint src/modules/hifz src/app/api/hifz src/i18n/translations.ts` →
  0 errors, 0 warnings on all files I authored.
- Verified dev.log shows successful incremental compiles with no errors after
  touching each new file.

## Files Created
- `/home/z/my-project/src/app/api/hifz/route.ts` (134 lines)
- `/home/z/my-project/src/app/api/hifz/[id]/route.ts` (27 lines)
- `/home/z/my-project/src/app/api/hifz/progress/route.ts` (90 lines)
- `/home/z/my-project/src/modules/hifz/hifz-types.ts` (119 lines)
- `/home/z/my-project/src/modules/hifz/hifz-form.tsx` (275 lines)
- `/home/z/my-project/src/modules/hifz/hifz-records-table.tsx` (273 lines)
- `/home/z/my-project/src/modules/hifz/hifz-progress.tsx` (283 lines)
- `/home/z/my-project/src/modules/hifz/hifz-view.tsx` (120 lines)

## Files Modified
- `/home/z/my-project/src/i18n/translations.ts` — appended 35 `hifz.*` keys × 3 locales.

## Key Decisions
- All API routes use the project's `withSession` helper (auto session check, error
  wrapping, tenant scoping via `session.tenantId`).
- Allowed-types/statuses validated server-side via `Set` constants — rejects
  arbitrary strings even if the column is a free-form `String`.
- Auto-`isHafiz` flag: when a student first reaches 30 distinct completed paras,
  `db.student.update` flips `isHafiz=true`. Uses `distinct: ["paraNumber"]` which
  Prisma supports on SQLite.
- Progress endpoint does ONE query (`findMany`) and computes everything in memory
  — keeps the SQL simple and the latency low for typical per-student volumes.
- Quality trend chart is wrapped in `dir="ltr"` to avoid recharts axis inversion
  under Arabic RTL app mode (chart stays readable; rest of UI respects RTL).
- Color palette intentionally avoids indigo/blue (per project rule): emerald +
  amber + rose + teal + purple + gray. Status badges use `bg-emerald/amber/rose`
  soft variants for light/dark parity.
- Islamic terminology (`Sabak`, `Sabaq Para`, `Dhor`, `Para`, `Surah`, `Ayah`)
  preserved verbatim in en/bn/ar dictionaries — only the descriptive parenthetical
  is translated (e.g. "Sabak (New Lesson)" / "সবক (নতুন পাঠ)" / "السبك (درس جديد)").
- Star rating: custom button group with lucide `Star` (filled amber when active)
  instead of a third-party widget — keeps bundle small and styling consistent with
  shadcn.
- The HifzForm accepts an optional `defaultStudentId` so a future per-student
  "quick add" affordance can pre-populate the student select.
- `HifzView` owns the shared `refreshKey` so a new record created from the dialog
  appears in both the Records table AND the Progress charts without manual refresh.
- Pre-existing lint errors in `src/modules/finance/*` (another agent's files) were
  left untouched per scope rules — verified my files lint to 0/0.
