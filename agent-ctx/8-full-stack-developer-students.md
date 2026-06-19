# Task ID 8 — Students module (full-stack-developer)

## Scope
Build Students CRUD module: API routes + UI view, all scoped by `tenantId`.

## Files created
**API:**
- `src/app/api/students/route.ts` (128 lines) — GET list (search/classId/gender/page/limit) + POST create (auto-Wallet + audit)
- `src/app/api/students/[id]/route.ts` (144 lines) — GET (with class, wallet, hifzCount, feeSummary), PUT, DELETE + audit
- `src/app/api/students/classes/route.ts` (13 lines) — class list for form dropdown

**UI (src/modules/students/):**
- `types.ts` — Student, StudentInput, StudentClass, Wallet, constants
- `i18n.ts` — useT() hook with trilingual fallback dict (bn/en/ar)
- `use-students.ts` — TanStack Query hooks for CRUD
- `student-form-fields.tsx` — 3 field groups (Basic / Guardian / Additional) — RTL Arabic name
- `student-form.tsx` — Dialog with 3 Tabs, conditional mount via key (no setState-in-effect)
- `students-table.tsx` — Table + actions dropdown + AlertDialog delete confirmation + skeletons + empty state
- `students-view.tsx` — Header, filters (debounced search + class/gender), pagination, dir-aware RTL

## Key decisions
- `useT()` prefers global translations, then falls back to a local dict — avoids editing translations.ts (out of scope)
- TanStack Query with same-origin credentials + invalidation on mutations
- Form state initialised from props at mount (conditional render + key) to avoid useEffect setState lint rule
- POST creates Student + Wallet in a single `$transaction`
- DELETE relies on Prisma cascade (Wallet/Hifz/FeeCollection have onDelete: Cascade / SetNull)

## Notes for other agents
- Main app shell still needs to route `view === "students"` to `<StudentsView />` from `@/modules/students/students-view`
- The "View" action currently delegates to Edit — a future detail drawer task can extend this
- GET `/api/students/[id]` returns `{ ...student, class, wallet, hifzCount, feeSummary: { total, paid, due, count } }` for any future profile page
EOF
