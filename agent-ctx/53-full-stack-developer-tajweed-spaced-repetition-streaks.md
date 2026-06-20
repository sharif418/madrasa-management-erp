# Task 53 — Tajweed Assessment + Hifz Spaced Repetition + Muhasaba Streaks

**Agent**: full-stack-developer
**Scope**: 3 Islamic-specific features, organically integrated into existing Hifz & Muhasaba modules.

## What was built

### Feature 1 — Tajweed Assessment (4th tab in Hifz module)
- New Prisma model `TajweedAssessment` (5 rubric scores 1-10: madd, waqf, tizkeer, nun, makhraj; computed totalScore 0-100; grade EXCELLENT/GOOD/SATISFACTORY/NEEDS_IMPROVEMENT; improvementAreas as JSON string).
- New API `GET/POST /api/hifz/tajweed` (list + stats + trend; create with auto-compute of total/grade; RBAC `hifz:create`; audit).
- New API `DELETE /api/hifz/tajweed/[id]` (RBAC `hifz:delete`; audit).
- New UI files in `src/modules/hifz/`:
  - `tajweed-types.ts` — shared types, grade colors, improvement-area constants.
  - `tajweed-form.tsx` — dialog with 5 sliders, live total/grade preview, improvement-area chips.
  - `tajweed-stats.tsx` — radar chart (avg per category) + total-score trend line.
  - `tajweed-tab.tsx` — list table (5 category scores, total, grade badge, delete), student filter, dialog + alert.
- 4th tab "Tajweed" added to `hifz-view.tsx` with Sparkles icon.

### Feature 2 — Hifz Spaced Repetition (in Hifz Progress tab)
- 3 new fields on `HifzRecord`: `nextRevisionDate`, `revisionCount`, `strengthScore`.
- New `src/lib/spaced-repetition.ts`: SM-2-like algorithm. strength 1→1d, 2→2d, 3→4d, 4→7d, 5→14d.
- `POST /api/hifz` updated to auto-compute `nextRevisionDate` + `strengthScore` (from `qualityRating`) + `revisionCount: 1` on creation.
- New API `GET /api/hifz/revision-today` — returns due items grouped by student; status: overdue/due/upcoming.
- New `src/modules/hifz/revision-today-card.tsx` — collapsible card with color-coded items, mounted at the top of `hifz-progress.tsx`.

### Feature 3 — Muhasaba Streak Tracking (in Muhasaba Analytics tab)
- New `src/lib/streaks.ts`: `computeStreaks(records)` returns currentStreak, longestStreak, lastEntryDate, monthlyAverage, badges (week/month/perfectWeek).
- New API `GET /api/muhasaba/streaks?studentId=` — per-student personal streaks + badges, OR tenant-wide leaderboard (top 5 + averages + distribution).
- New `src/modules/muhasaba/streak-section.tsx` — student selector switcher; personal KPI cards (current/longest/monthly), badge pills with progress, leaderboard with gold/silver/bronze ranks.
- Integrated into `muhasaba-analytics-tab.tsx` as a new "Streaks & Badges" card at the bottom (existing KPIs, salah chart, adhkar donut, akhlaq trend, top students all preserved).

## i18n
Added 31 new keys (en/bn/ar) for hifz.tajweed*, hifz.revisionToday/dueToday/overdue/upcoming, hifz.strengthScore, muhasaba.streaks/currentStreak/longestStreak/monthlyAverage/badges/streakLeaderboard/days/weekStreak/monthStreak/perfectWeek.

## Files
- Created: `prisma/schema.prisma` (new model + fields), `src/lib/spaced-repetition.ts`, `src/lib/streaks.ts`, `src/app/api/hifz/tajweed/route.ts`, `src/app/api/hifz/tajweed/[id]/route.ts`, `src/app/api/hifz/revision-today/route.ts`, `src/app/api/muhasaba/streaks/route.ts`, `src/modules/hifz/tajweed-types.ts`, `src/modules/hifz/tajweed-form.tsx`, `src/modules/hifz/tajweed-stats.tsx`, `src/modules/hifz/tajweed-tab.tsx`, `src/modules/hifz/revision-today-card.tsx`, `src/modules/muhasaba/streak-section.tsx`.
- Modified: `src/app/api/hifz/route.ts` (nextRevisionDate on create), `src/modules/hifz/hifz-view.tsx` (4th tab), `src/modules/hifz/hifz-progress.tsx` (revision card at top), `src/modules/muhasaba/muhasaba-analytics-tab.tsx` (streak section at bottom), `src/i18n/translations.ts` (new keys × 3 locales).

## Verification
- `bun run db:push` ✅
- `bun run lint` ✅ (no errors)
- API routes compile and return 401 (unauthorized) when probed without session — as expected.
- All new files under 300 lines; most under 200.
- All queries filter by `session.tenantId`.
- RBAC enforced on tajweed create/delete.
- Audit log entries on all mutations.
