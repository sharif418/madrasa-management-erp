# Task 50 — Performance Optimization (Lazy Loading + Code Splitting)

**Agent:** full-stack-developer (Performance Optimization)
**Task:** Implement lazy loading + code splitting for all module views in app shell.

## Work Log
- Read `worklog.md` (last ~100 lines) — confirmed project state: 433 TS files, 39 module views, dev server OOM during Turbopack compilation.
- Read `src/components/shell/app-shell.tsx` — found 39 static `import { XView } from "@/modules/..."` statements feeding a single `switch(view)` in `renderView()`. All views loaded on first paint → bloated initial bundle + dev OOM.
- Verified export shapes of all 39 view modules with a grep sweep:
  - `dashboard-router.tsx` is the only one with a `default` export.
  - The other 38 use named exports (`export function StudentsView()`, etc.).
- Confirmed no `import * as Recharts from "recharts"` wildcard imports exist anywhere in `src/` — all 20 recharts-using files use named imports (`ResponsiveContainer, AreaChart, ...`), so tree-shaking already works. No changes needed in dashboard-charts / analytics-charts / reports-*-tab.
- Verified PDF libraries (pdf-lib) are already server-only inside API routes — no client-side changes needed.
- Created `src/components/shell/view-loading-skeleton.tsx` (68 lines):
  - Emerald→teal→cyan gradient header band with Islamic 8-point star SVG pattern overlay.
  - Skeleton header line + subline + 2 action button skeletons.
  - 4-card KPI skeleton grid (`sm:grid-cols-2 lg:grid-cols-4`).
  - 3-column content area: 2-col chart block (`h-64` skeleton) + 1-col table block (6 row skeletons).
  - Centered `Loader2` spinner + "Loading…" caption in emerald/muted-foreground.
  - Uses existing `Skeleton` from `@/components/ui/skeleton` (no new dependencies).
  - Mirrors the standard module header layout so the loading state feels native.
- Rewrote `src/components/shell/app-shell.tsx` (184 lines, well under 300):
  - Replaced all 39 static imports with `lazy(() => import(...).then(m => ({ default: m.X })))` constants.
  - `DashboardRouter` uses the simpler `lazy(() => import("@/modules/dashboard/dashboard-router"))` form since it has a default export.
  - Kept the entire `switch(view)` case list intact — no functional changes, only import strategy.
  - Wrapped `renderView()` output in `<Suspense fallback={<ViewLoadingSkeleton />}>`.
  - Preserved layout: `AppSidebar`, `AppHeader` with command-palette hook, `CommandPalette`, `OfflineIndicator`, gradient background, RTL-aware `lg:ps-72` indent.
- Ran `bun run lint` — 0 errors, 0 warnings.
- Verified dev server health via `curl http://localhost:3000/` — HTTP 200 in 293ms total (compile: 55ms, render: 236ms). Recent `dev.log` entries show typical `GET / 200 in 60-130ms (compile: 3-30ms)` — orders of magnitude faster than the previous all-modules-at-once compilation, and no OOM/SIGKILL/crash entries.

## Performance Improvements
1. **Initial bundle**: Only the dashboard router + shell now ship on first paint. The other 38 modules (students, finance, hifz, reports, etc., each pulling recharts, form components, PDF-related code paths, etc.) are deferred into separate chunks fetched on demand.
2. **Turbopack compile time**: Dev server now compiles 1 module per navigation instead of 433 files upfront. Latest `dev.log` shows compile times of 3–30ms for repeat visits and ≤385ms for first-touch chunk compiles — previously the server OOM'd before serving the first request.
3. **Memory footprint**: Fewer modules held in memory at once — the dev server stays responsive during long sessions.
4. **User-perceived UX**: A branded loading skeleton (emerald gradient + Islamic pattern + spinner) is shown for the ~50–400ms while a chunk loads, instead of a blank screen or full app re-render.
5. **No functionality lost**: All 39 switch cases preserved exactly. Each module still mounts with the same props/state as before; lazy loading is purely a transport concern.

## Stage Summary
- **Files created**: 1
  - `src/components/shell/view-loading-skeleton.tsx` (68 lines)
- **Files modified**: 1
  - `src/components/shell/app-shell.tsx` (113 → 184 lines; still well under the 300-line cap)
- **Verification**:
  - `bun run lint` → clean (0 errors)
  - `curl http://localhost:3000/` → HTTP 200, 293ms total
  - `dev.log` recent entries → no OOM/crash/SIGKILL; typical compile times 3–30ms
  - All 39 lazy imports verified against actual named exports in their target files
- **No changes needed** (verified clean):
  - Recharts imports — already tree-shakeable named imports across all 20 usage sites
  - pdf-lib — already server-side only in API routes
  - Sidebar lucide icons — `optimizePackageImports` already configured in `next.config.ts`
