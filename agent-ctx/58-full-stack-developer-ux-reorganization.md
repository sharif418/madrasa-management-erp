# Task 58 — UX Reorganization (sidebar, header, dashboard)

**Agent**: full-stack-developer (UX Reorganization)
**Task ID**: 58
**Date**: Append to worklog.md (no separate timestamp needed)

## Summary

Comprehensive UX reorganization of the app shell + dashboard to industry-standard quality. All 41 sidebar modules preserved but reorganized into 8 collapsible domain-based groups; header action groups separated by dividers; dashboard gained a Refresh button + Last Updated timestamp.

## Files modified

1. `src/i18n/translations.ts` — added 8 keys × 3 locales (24 new lines)
   - `nav.overview`, `nav.people`, `nav.quranIbadah`, `nav.operations`, `nav.communication`, `nav.toolsSystem`
   - `dashboard.lastUpdated`, `dashboard.refresh`
2. `src/components/shell/app-sidebar.tsx` — full rewrite (168 → 259 lines)
3. `src/components/shell/app-header.tsx` — polished (81 → 108 lines)
4. `src/modules/dashboard/dashboard-view.tsx` — Refresh + Last Updated (228 → 265 lines)

## Key UX improvements

### Sidebar
- 8 collapsible domain groups (was 3 over-stuffed groups with 24 items in one)
- Overview expanded by default; active-view's group always auto-expanded
- Distinct icons: Academic=BookOpen, Quran Log=BookOpenText, Exams=FileEdit, Alumni=Award, Certificates=ScrollText
- Chevron rotates 180° on expand (rtl:-rotate-180 mirrors in Arabic)
- Active item emerald gradient + shadow preserved
- Dark emerald gradient kept; brand header + user footer preserved

### Header
- 3 vertical dividers between action groups: search | language + theme | notifications | logout
- Consistent icon sizing (size=icon for theme/notifications/logout, size=sm for search)
- PrayerTimeWidget separated from title/date by border-l divider
- Dark-mode-aware Moon icon color (emerald-600 dark:emerald-400)
- Logout button rose-tinted to distinguish destructive action
- min-w-0 + truncate prevents overflow on small screens

### Dashboard
- New Refresh button (spins while loading, disabled during fetch)
- New Last Updated timestamp (locale-aware, with emerald pulse dot)
- AbortController replaces `alive` flag pattern (cleaner + lint-clean)
- Existing responsive grids verified: KPI grid-cols-2 lg:grid-cols-4, charts grid-cols-1 lg:grid-cols-3, recent activity grid lg:grid-cols-2
- Welcome banner already stacks on mobile (flex-col sm:flex-row)

## Verification
- `bun run lint` → exit code 0 (clean)
- Dev server: `✓ Compiled in 350ms`, `GET / 200`
- All 41 sidebar modules still accessible (no ViewKey or routing changes)
- No API routes touched

## Notes for future agents
- Sidebar group config lives in `GROUPS` constant at top of app-sidebar.tsx — adding/removing modules is a one-line change in the relevant group.
- Translations for new group labels live alongside existing nav.main/management/system entries in each locale block.
- Refresh pattern (refreshKey state + AbortController in effect with [refreshKey] deps) is reusable for any module that needs a manual refresh button.
