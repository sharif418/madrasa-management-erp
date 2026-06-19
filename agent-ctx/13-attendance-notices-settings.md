# Task 13 — Attendance + Notices + Settings

**Agent:** full-stack-developer
**Scope:** Three smaller modules built in a single task: Attendance, Notices, Settings.

## What was built

### A. Attendance Module
- `src/app/api/attendance/route.ts` (156 lines) — GET (filters: date / personType / status / page / limit; resolves person name from Student or Teacher table) + POST (bulk upsert by unique `[tenantId, personId, personType, date]`; `markedBy = session.userId`; audit recorded).
- `src/app/api/attendance/stats/route.ts` (50 lines) — GET last-7-days summary `[{ date, present, absent, late, leave, rate }]`.
- `src/modules/attendance/attendance-view.tsx` (152 lines) — date picker (native input type=date), person-type tabs (Students / Teachers), class filter (loaded from `/api/students/classes`), today's-date display, wires marker + stats. `dir={dir()}` for RTL.
- `src/modules/attendance/attendance-marker.tsx` (283 lines) — roster list with status buttons (Present / Absent / Late / Leave), summary badges, "Mark All Present" + Save buttons, ScrollArea with max-h, onSaved callback to refresh stats.
- `src/modules/attendance/attendance-stats.tsx` (117 lines) — Recharts LineChart of 7-day attendance rate, average rate card header, loading skeleton.

### B. Notices Module
- `src/app/api/notices/route.ts` (97 lines) — GET (filters: type / audience / page / limit, ordered by publishedAt desc) + POST (validated create, audit).
- `src/app/api/notices/[id]/route.ts` (67 lines) — PUT (partial update, scoped via `findFirst({id, tenantId})`, audit) + DELETE (audit).
- `src/modules/notices/notices-view.tsx` (158 lines) — header with Add button, type & audience filter chips with color coding, empty states (no notices vs no matches), wires list + form.
- `src/modules/notices/notices-list.tsx` (206 lines) — responsive card grid, type & audience badges with tint, expand/collapse content for long bodies, DropdownMenu edit/delete actions, AlertDialog delete confirmation, ScrollArea with max-h, locale-aware date formatting.
- `src/modules/notices/notice-form.tsx` (192 lines) — Add/Edit dialog (title, content textarea, type select, audience select, expiresAt date). POST/PUT with toast feedback.

### C. Settings Module
- `src/app/api/settings/route.ts` (75 lines) — GET tenant info (selects all display fields incl. plan/status read-only) + PUT update (only name/phone/email/address/currency/language/theme/logoUrl; explicitly cannot update plan or status). Audit recorded.
- `src/app/api/settings/roles/route.ts` (13 lines) — GET list of tenant roles for the Roles tab.
- `src/modules/settings/settings-view.tsx` (93 lines) — three tabs (Madrasa Info / Appearance / Roles), header with plan + status badges, loading skeleton, error card, dir-aware.
- `src/modules/settings/settings-info.tsx` (173 lines) — Madrasa Info form (name, phone, email, address, currency select [BDT/USD/SAR/EUR], default language select [bn/en/ar]). PUT on save, success toast.
- `src/modules/settings/settings-appearance.tsx` (138 lines) — theme color picker as 6 swatches (emerald, violet, rose, amber, teal, cyan) with check indicator; persists via PUT /api/settings; session language switcher wired to `useApp.setLocale`.
- `src/modules/settings/settings-roles.tsx` (91 lines) — placeholder card ("coming soon") + live list of tenant roles fetched from /api/settings/roles.

### i18n
- Extended `src/i18n/translations.ts` with ~50 new keys across `attendance.*`, `notices.*`, `settings.*` for all three locales (en / bn / ar). Arabic strings include proper RTL text.

## Key decisions
- **Bulk upsert for attendance**: POST accepts an array of entries for a single date and uses Prisma `$transaction` of `upsert` calls keyed on the unique constraint. Validates every entry + verifies all referenced personIds belong to the tenant before writing.
- **Person name resolution**: GET `/api/attendance` does two parallel `findMany` (students + teachers) and maps into the response — avoids N+1.
- **Stats endpoint**: builds the 7-day window in JS, fetches raw rows for the window, buckets by date string, computes rate as `(present + late) / total * 100` (consistent with the dashboard module's logic).
- **Native `<input type="date">`** for all date pickers — matches the existing project pattern (hifz / finance / teachers modules).
- **Theme swatches**: clicking a swatch both updates the local Zustand store (instant preview) AND fires a PUT to persist on the tenant — so the choice survives logout / new sessions.
- **Session language switcher** in the Appearance tab updates `useApp.setLocale` only (UI session), while the Madrasa Info tab's "Default Language" select persists the tenant default — clear separation between tenant default and per-user preference.
- **Roles tab**: gracefully degrades if `/api/settings/roles` is not yet implemented (returns empty list). Since I built the endpoint too, it lists existing roles + marks system roles with a badge.
- **No file exceeds its line limit**:
  - attendance/route.ts 156/200 ✓
  - attendance/stats/route.ts 50/80 ✓
  - notices/route.ts 97/130 ✓
  - notices/[id]/route.ts 67/80 ✓
  - settings/route.ts 75/100 ✓
  - All view files ≤ 300 lines (largest is attendance-marker at 283).
- **All queries filter by `session.tenantId`**. Single-record mutations additionally use `findFirst({id, tenantId})` to prevent cross-tenant access.
- **Audit recorded for every mutation** via `auditAfter(session, { action, module, entityId, entityName, details })`.
- **RTL support**: every top-level view wraps in `<div dir={dir()}>`. Arabic translations use proper Arabic text. Status buttons in the marker use `dir="ltr"` for the radio group (since icons+labels read LTR even in RTL contexts).

## Verification
- `bun run lint` — 0 errors, 0 warnings across the whole project (including all my new files).
- Smoke-tested all new endpoints via curl (all return 401 without auth cookie, proving routes are wired + auth middleware is enforced).
- dev.log shows clean compilation for every new endpoint (no warnings/errors).
- Read dev.log after each code change to verify no compile regressions.

## Issues/notes
- AttendanceView / NoticesView / SettingsView are exported but not yet wired into the main app shell router (`src/app/page.tsx` is still the placeholder). Integration is the orchestrator/shell agent's responsibility. Once the sidebar links the `attendance`, `notices`, `settings` ViewKeys to these views, the modules are fully functional.
- The students API returns `class: { name }` as a nested object — `AttendanceMarker` reads `p.class.name` for the student's class subtitle. If the students API ever changes its shape, the marker will display "—" instead of breaking.
- `SettingsAppearanceTab` syncs theme from tenant info on first load via a `useEffect` keyed on `info?.theme`. Subsequent swatch clicks update local state first (instant feedback), then persist via PUT.
- No file outside the three module scopes was modified except `src/i18n/translations.ts` (extended with new keys — additive only, no existing keys changed).
