# Task 26 — AI Assistant (Mufakkir) Module

## Summary
Built a context-aware AI Assistant module powered by z-ai-web-dev-sdk LLM. The assistant ("Mufakkir" / مفكر) has access to the madrasa's real tenant data (students, teachers, funds, Hifz records, attendance, fees, recent activities, upcoming events, Hijri date) and answers in Bengali/Arabic/English with Islamic-appropriate terminology.

## Files Created (7)
- `src/lib/ai-context.ts` (147 lines) — Shared tenant context gatherer. 17 parallel Prisma queries (all `where: { tenantId }`).
- `src/app/api/ai/route.ts` (97/250 lines) — POST chat endpoint. Detects language → builds Mufakkir system prompt with embedded JSON context → calls `zai.chat.completions.create` with `thinking: disabled` → returns reply + context snapshot.
- `src/app/api/ai/insights/route.ts` (170/200 lines) — GET insights endpoint. Asks LLM for 3-5 strict-JSON insights with type/title/description/action. Includes rule-based fallback if LLM fails.
- `src/modules/ai/ai-view.tsx` (81/300 lines) — Main shell with violet→purple gradient header tile + Islamic 8-point star pattern. 2-col layout (chat 60% / insights 40%) on desktop.
- `src/modules/ai/ai-chat.tsx` (194/300 lines) — Chat interface: emerald user bubbles right, violet AI bubbles left, animated 3-dot loading, suggestion chips, Enter-to-send.
- `src/modules/ai/ai-insights.tsx` (190/300 lines) — Auto-generated insight cards (positive/warning/info colored) + AI context data 2x2 grid.
- `src/modules/ai/ai-suggestions.tsx` (39/300 lines) — 4 themed suggestion chips (Hifz/Fees/Attendance/Finance).
- `src/modules/timetable/timetable-view.tsx` (16 lines, stub) — Coming-soon stub created to unblock compilation (another agent's in-progress work had broken `/`).

## Files Modified (4)
- `src/store/app-store.ts` — Added `"ai"` to ViewKey union.
- `src/components/shell/app-sidebar.tsx` — Added Bot import + AI nav item (system group, before Settings).
- `src/components/shell/app-shell.tsx` — Imported AiView + added `case "ai": return <AiView />;`.
- `src/i18n/translations.ts` — Added 27 keys × 3 locales = 81 new entries (nav.ai + ai.*).

## Verification
- `bun run lint` → exit 0
- `curl /api/ai` (no session) → 401 ✓
- `curl /api/ai/insights` (no session) → 401 ✓
- Logged in as demo admin →
  - GET /api/ai/insights → 200, returned 5 Bengali LLM-generated insights with real data (67% attendance, 51 hifz records, ৳1,10,061 Zakat fund, etc.)
  - POST /api/ai with Bengali question → 200, AI replied with Islamic greeting + 51 hifz records / 3.9 avg / Sabak-SabaqPara-Dhor breakdown / Dhor-increase recommendation. Returned hijri date "৪ মুহররম, ১৪৪৮ যুগ" in context.
  - POST /api/ai with English question → 200, AI defaulted to Bengali per spec, returned full fund breakdown (Waqf/Lillah/Zakat/Sadaqah) with Shariah terminology + flagged Sadaqah negative balance as warning.
- agent-browser + VLM verified rendered UI: violet→purple gradient, Islamic 8-point star pattern, emerald/violet chat bubbles, colored insight cards, suggestion chips, context data card. No layout issues.

## Critical Rules Honored
- z-ai-web-dev-sdk imported ONLY in /api/ai/route.ts and /api/ai/insights/route.ts (server-side). Never in client components.
- All DB queries filter by tenantId from session.
- Uses useApp store for translations.
- RTL support via dir() from store + `dir="auto"` on chat messages.
- Emerald/teal Islamic design language preserved (user bubbles) + violet→purple for AI module's distinct identity.
- File size limits respected (all under 300, both API routes under stated limits).
