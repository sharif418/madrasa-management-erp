# Task ID: 27 — Timetable + Academic Levels

**Agent**: full-stack-developer (Timetable + Academic Levels)
**Task**: Build Timetable module + Academic Levels UI

## What was built

### Feature 1: Timetable Module (weekly class schedule)
- API routes: `/api/timetable` (GET/POST) + `/api/timetable/[id]` (PUT/DELETE)
- View: `src/modules/timetable/timetable-view.tsx` (258 lines)
- Grid: `src/modules/timetable/timetable-grid.tsx` (211 lines)
- Form: `src/modules/timetable/slot-form.tsx` (229 lines)
- Parts: `src/modules/timetable/timetable-parts.tsx` (59 lines) — TodayStrip + EmptyState
- Types/helpers: `src/modules/timetable/types.ts` (111 lines)
- Wired into sidebar (CalendarClock icon, after Academic) + app-shell switch + Zustand ViewKey

### Feature 2: Academic Levels UI (3rd tab in Academic module)
- API routes: `/api/academic/levels` (GET/POST) + `/api/academic/levels/[id]` (PUT/DELETE)
- Tab: `src/modules/academic/academic-levels-tab.tsx` (300 lines) — vertical timeline
- Form: `src/modules/academic/level-form.tsx` (196 lines)
- Updated `src/modules/academic/academic-view.tsx` (295 lines) to add 3rd "Levels" tab

### Stub created
- `src/modules/ai/ai-view.tsx` (81 lines) — unblocks compilation since another agent had referenced `@/modules/ai/ai-view` from app-shell.tsx but the file didn't exist. AI agent can overwrite.

## Files modified
- `src/i18n/translations.ts` — 75 new keys × 3 locales = 225 entries
- `src/store/app-store.ts` — added `"timetable"` to ViewKey
- `src/components/shell/app-sidebar.tsx` — added CalendarClock import + Timetable nav item
- `src/components/shell/app-shell.tsx` — added TimetableView import + case
- `src/modules/academic/academic-view.tsx` — 3rd "Levels" tab

## Files created
- `src/app/api/timetable/route.ts` (134/150)
- `src/app/api/timetable/[id]/route.ts` (76/80)
- `src/app/api/academic/levels/route.ts` (91/120)
- `src/app/api/academic/levels/[id]/route.ts` (66/80)
- `src/modules/timetable/types.ts` (111/300)
- `src/modules/timetable/timetable-view.tsx` (258/300)
- `src/modules/timetable/timetable-grid.tsx` (211/300)
- `src/modules/timetable/slot-form.tsx` (229/300)
- `src/modules/timetable/timetable-parts.tsx` (59/300)
- `src/modules/academic/academic-levels-tab.tsx` (300/300)
- `src/modules/academic/level-form.tsx` (196/300)
- `src/modules/ai/ai-view.tsx` (81/300) — STUB

## Key decisions

1. **Subject color palette (12 colors)** — emerald, teal, cyan, sky, blue, violet, purple, fuchsia, rose, amber, orange, lime. Stable hash of subject name ensures the same subject always renders the same color across the weekly grid.

2. **Prayer-time overlay** — Fajr (05:15), Dhuhr (12:15), Asr (16:00), Maghrib (18:15), Isha (19:45) marked on the time column with emoji badges. Purely visual; does not block scheduling.

3. **Friday holiday** — Friday excluded from grid columns. Footer banner "🕌 Friday — Holiday" reminds users. Only Sat–Thu shown.

4. **Today highlight** — Today's column header gets emerald→teal gradient + "Today's Schedule" pill. Today's cells get subtle bg tint. A gradient hero card at the top shows up to 6 of today's slots as compact pills.

5. **Click empty cell → Add Slot dialog pre-filled** with day + start time + selected class. Click occupied cell → edit dialog.

6. **No N+1 in timetable GET** — class + teacher names resolved in 2 batched findMany calls.

7. **Levels color split** — Qawmi = emerald, Alia = violet. Alia detected via `/kamil/i` regex on level name (Kamil is highest Alia stage).

8. **5 suggested Qawmi stages** — Ibtedayi (ابتدائية), Mutawassitah (متوسطة), Sanawiyyah (ثانوية), Fazilat (فضيلة), Dawra-e-Hadith (دورة الحديث). One-click seed button.

9. **Vertical timeline track** — 2px gradient connector line + numbered circular nodes per level. Staggered motion animation.

10. **Delete protection** — Levels with assigned classes return 409 on DELETE; delete button disabled in UI when `_count.classes > 0`.

11. **AI stub** — Created 81-line stub at `src/modules/ai/ai-view.tsx` because another agent's in-progress AI module had already wired `case "ai"` + sidebar entry + i18n keys but the view file didn't exist. Without the stub, the home page was HTTP 500 (module-not-found). The AI agent can overwrite with the real implementation.

12. **RTL safety** — All layouts use logical Tailwind properties (ps-/pe-/ms-/me-/start-/end-/text-end). Arabic-name input fields have `dir="rtl"`. Time labels always `dir="ltr"`. Timeline positioning uses `start-3`/`start-6` so it flips in Arabic.

## Verification

- `bun run lint` → exit 0 (clean, no errors, no warnings)
- `curl /` → 200
- All 8 new API endpoints verified via curl with authenticated demo session:
  - GET /api/timetable → 200
  - POST /api/timetable → 201 (validates day, time-order, subject)
  - PUT /api/timetable/[id] → 200 (validates time-order; FK ownership for classId/teacherId)
  - DELETE /api/timetable/[id] → 200 (tenantId-scoped + audit)
  - GET /api/academic/levels → 200 (ordered by `order`, with _count.classes)
  - POST /api/academic/levels → 201 (validates name/order/durationYears)
  - PUT /api/academic/levels/[id] → 200 (per-field updates, audit on changed fields)
  - DELETE /api/academic/levels/[id] → 200 (blocks 409 if has classes)
- Dev log shows no compile errors after my changes; Prisma queries log correctly for both new tables; AuditLog inserts succeed.
- Test data created during verification was cleaned up (deleted test level + test slot).
- All file lengths within stated limits (verified above).
