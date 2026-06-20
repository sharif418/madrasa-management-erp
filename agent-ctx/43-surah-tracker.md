# Task 43 — Surah-level Quran Progress Tracker

Agent: full-stack-developer (Surah Tracker)
Task: Enhance the existing Hifz module with a new "Surah Tracker" tab that tracks Quran memorization progress at the surah level (114 surahs) instead of just the para level (30 paras).

## Work Log
- Read worklog tail + hifz-view.tsx + hifz-progress.tsx + hifz-types.ts + /api/hifz/progress/route.ts + /api/hifz/route.ts + lib/api.ts + prisma HifzRecord model + translations.ts hifz keys + app-store.ts. Understood: HifzRecord has paraNumber(1-30), surahName(text), ayahFrom/ayahTo (Int?), qualityRating(1-5?), status (completed/revision/weak), type (sabak/sabaq_para/dhor). Tenant scoped via withSession helper.
- Created src/lib/quran-data.ts (202 lines): all 114 surahs. First 20 (Al-Fatiha→Taha) full detail with English/Arabic/Bengali names + ayah count + revelationType + paraNumbers array. Surahs 21-114 compact tuples expanded at runtime. Helper `matchSurahName(input)` normalizes free-text (strips Al-, removes Arabic diacritics, lowercases) and matches against English/Arabic/Bengali name variants + numeric fallback + 4-char English prefix fallback.
- Created src/app/api/hifz/surah-progress/route.ts (150 lines): GET, session-protected, tenant-scoped. Verifies student ownership, fetches all HifzRecords for student, buckets by matched surah number. For each surah: computes memorizedAyahs as union of completed-status ayah ranges (bitset), status = not_started (no records) | in_progress (partial) | completed (full) | revision (full + recent dhor). Aggregates: totalSurahsMemorized, totalAyahsMemorized, completionPercent (by ayah count over total 6236), byStatus counts, parasFullyCovered (every surah spanning a para is completed/revision). Returns SurahProgressResponse.
- Created src/modules/hifz/surah-grid.tsx (102 lines): responsive 5/8/10/12-col grid of 114 cells. Each tile = surah number (top-start), Arabic name (center, dir=rtl, Amiri/Scheherazade serif), memorized/total ayah count. Status colors: not_started=muted, in_progress=amber, completed=emerald, revision=sky. Hover tooltip shows full English+Arabic name, ayah progress, Meccan/Medinan, last practiced date. Click triggers onSelect.
- Created src/modules/hifz/surah-detail-dialog.tsx (183 lines): opens when a surah is clicked. Header with gradient emerald icon tile + English/Arabic/Bengali name. 4 mini stats: ayahs memorized, avg quality, last practiced, status with colored dot. Records list (fetched via /api/hifz?studentId=&limit=100 then client-filtered by matched surah) showing type badge, para+surah+ayah range, date+teacher, star rating, status badge. ScrollArea max-h-72.
- Created src/modules/hifz/surah-tracker-tab.tsx (291 lines): main 3rd-tab orchestrator. Student selector (auto-picks first). Overall progress card: 44×44 SVG circular progress (teal stroke) showing completionPercent + 3 BigStats (X/114 surahs, total ayahs, X/30 paras covered). Toolbar: 5 status filter buttons (all/completed/in_progress/revision/not_started) with live counts + grid/list ToggleGroup. Grid view uses SurahGrid; list view uses Table with surah#, name (English+Arabic RTL), ayahs mem/total, status badge, last practiced. Click any row/cell opens SurahDetailDialog.
- Modified src/modules/hifz/hifz-view.tsx: added ScrollText icon import + SurahTrackerTab import + 3rd TabsTrigger ("surah", icon ScrollText, label hifz.surahTracker) + 3rd TabsContent with loading/empty/surah-tracker rendering. Tab state type extended to "records" | "progress" | "surah". Existing records/progress tabs untouched.
- Added 14 new i18n keys × 3 locales (en/bn/ar) to translations.ts: surahTracker, surahProgress, totalSurahs, totalAyahs, completionPercent, gridView, listView, surahNumber, surahName, ayahsMemorized, lastPracticed, selectStudentFirst, meccan, medinan. Reused existing hifz.completed/inProgress/notStarted/revision keys for status badges (their existing values are compatible with the task spec). Used Islamic-appropriate Bengali and Arabic, with RTL rendering for Arabic surah names (dir="rtl" lang="ar" + serif font).
- TypeScript type-check: fixed two issues — (1) added explicit return type annotation `(s): SurahProgressItem` to the SURAHS.map callback to satisfy the union-narrowing check; (2) converted `latest.recordedAt` (Date) to `.toISOString()` to match the `lastPracticed: string | null` field type.
- Ran `bun run lint` — 0 errors. Verified dev.log shows server healthy (GET / 200, GET /api/dashboard 200).

## Stage Summary
- Files created (5):
  - src/lib/quran-data.ts (202 lines) — 114-surah reference data + matchSurahName helper
  - src/app/api/hifz/surah-progress/route.ts (150 lines) — GET endpoint, session+tenant scoped
  - src/modules/hifz/surah-grid.tsx (102 lines) — 114-cell responsive grid with tooltips
  - src/modules/hifz/surah-detail-dialog.tsx (183 lines) — per-surah HifzRecords dialog
  - src/modules/hifz/surah-tracker-tab.tsx (291 lines) — main 3rd-tab orchestrator
- Files modified (2):
  - src/modules/hifz/hifz-view.tsx — added 3rd tab "Surah Tracker" (ScrollText icon, label hifz.surahTracker)
  - src/i18n/translations.ts — added 14 keys × 3 locales (en/bn/ar) at the end of the hifz block
- All files under 300-line limit (largest: surah-tracker-tab.tsx at 291).
- Lint: 0 errors. TypeScript: 0 errors in new files.
- No existing Hifz module behavior changed — Records + Progress tabs remain untouched.
- Surah status colors match task spec: not_started=gray, in_progress=amber, completed=emerald, revision=sky.
- RTL support: Arabic surah names rendered with dir="rtl" lang="ar" + serif font (Scheherazade New/Amiri fallback) in grid, list, dialog header, and dialog record rows.
