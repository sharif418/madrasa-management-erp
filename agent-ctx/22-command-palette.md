# Task 22 — Command Palette / Quick Search

**Agent**: full-stack-developer (Command Palette)
**Task**: Build Cmd+K Command Palette for quick navigation + student search

## Summary
Added a global ⌘K / Ctrl+K / `/` command palette that lets users instantly navigate to any of the 13 modules, execute 5 quick actions, and live-search students by name/roll/Arabic name with a 300ms-debounced async fetch.

## Files
### Created
- `src/hooks/use-command-palette.ts` (37 lines) — open/close state + global keydown listener. Cmd+K / Ctrl+K toggles from anywhere; `/` opens only when not typing in INPUT/TEXTAREA/SELECT/contentEditable.
- `src/components/shell/command-palette.tsx` (247 lines) — controlled Dialog + cmdk Command with 3 groups (Navigation, Quick Actions, Students). Gradient emerald→teal header with white search icon + spinner. Emerald-tinted icon tiles per item. Emerald hover/selected accent. Footer with ↑↓/↵/esc kbd hints. RTL via `dir={dir()}`.

### Modified
- `src/i18n/translations.ts` — added 13 `command.*` keys × 3 locales (en/bn/ar) = 39 new entries, additively at the end of each locale block.
- `src/components/shell/app-header.tsx` — added optional `onOpenCommandPalette` prop + emerald outline button with Search icon + "⌘K" kbd badge (icon-only on mobile, full on ≥sm).
- `src/components/shell/app-shell.tsx` — imported `CommandPalette` + `useCommandPalette`. Wired `open`/`setOpen` to both `AppHeader` (button trigger) and `<CommandPalette>` (always mounted at bottom of root div).

## Key decisions
- **Controlled component**: palette accepts `{ open, onOpenChange }` so the header button + keyboard shortcut share state via the hook in AppShell.
- **Direct `cmdk` Input** (bypassing shadcn `CommandInput`) to render the gradient header without the wrapper's built-in border-b + Search icon (which would have been duplicated).
- **300ms debounce + AbortController** on the student search fetch — aborts in-flight requests on new keystrokes to prevent race conditions.
- **Defensive response parsing** — accepts both `json.data.items` and `json.items` shapes (the `ok()` helper wraps as `{ data: ... }`).
- **Emerald accent override**: `[&_[cmdk-item][data-selected=true]]:bg-emerald-50` (+ dark variant) replaces cmdk's default neutral selected state to match the Islamic design language.
- **Reset on close**: useEffect watches `open` and clears `query`/`students`/`loading` when palette closes, so the next open starts fresh.

## Verification
- `bun run lint` → exit 0, clean (no errors, no warnings).
- `curl http://localhost:3000/` → 200.
- `curl http://localhost:3000/api/students?search=test&limit=5` → 401 (endpoint exists, auth required; palette sends same-origin credentials so it works in authenticated sessions).
- dev.log shows clean compiles of all new/modified files.

## Notes
- Quick Actions navigate to the module's main view but do NOT auto-open the Add dialog (per task spec — "the module's Add button can be triggered later"). Auto-opening Add would require extending the `setView` signature.
- Selecting a student from search results navigates to the Students module but does NOT open that student's profile (per task spec — "for now just navigate").
- No existing modules were broken — only additive changes. The palette is mounted at the bottom of AppShell, completely isolated from the main content area.
