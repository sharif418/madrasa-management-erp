# Task 13b — Wallet + Audit Log modules

**Agent**: full-stack-developer (Wallet + Audit)
**Task**: Build Digital Wallet + Audit Log viewer modules for the Madrasa ERP

## Work Log

1. Read `worklog.md`, `prisma/schema.prisma`, `lib/api.ts`, `lib/session.ts`, `lib/audit.ts`,
   `store/app-store.ts`, `i18n/translations.ts`, and existing sibling modules
   (`finance/`, `hifz/`, `students/`) to align with established patterns (withSession wrapper,
   auditAfter, RTL-friendly logical Tailwind props, sonner toasts, locale-aware Intl formatting).
2. Extended `src/i18n/translations.ts` with ~80 new `wallet.*` + `audit.*` keys × 3 locales
   (en/bn/ar). Wallet keys include search/empty/loading/toast strings + payment-method labels;
   audit keys include filter/action labels + entries/pageOf/expandDetails.
3. Built `src/app/api/wallet/route.ts` — GET list, tenant-scoped, supports `?search=` (matches
   `student.name`/`nameArabic`/`rollNo` via nested where) + `?page=`/`?limit=`. Includes
   student summary, latest WalletLog entry, `_count.logs`, and aggregates `totalBalance` +
   `activeWallets` (wallets with balance > 0).
4. Built `src/app/api/wallet/[studentId]/route.ts` — GET single wallet (tenant-safe via
   `findFirst({ studentId, tenantId })`) + last 20 WalletLog entries (newest first) +
   aggregate stats (totalTransactions, totalTopUp).
5. Built `src/app/api/wallet/[studentId]/topup/route.ts` — POST atomic top-up inside
   `db.$transaction`: increments `wallet.balance`, creates `WalletLog` (trxType=top_up),
   creates `Transaction` (type=income, fund=General fund, category=wallet_topup,
   relatedStudentId=studentId, paymentMethod from body — defaults to cash; bkash/nagad/bank
   supported). Increments the General fund balance so finance ledger stays reconciled.
   Validates amount > 0, validates General fund exists, returns 404 if wallet missing.
   Audited via `auditAfter` with newBalance + transactionId + method in details.
6. Built `src/app/api/audit/route.ts` — GET list, tenant-scoped, filters by `?action=`,
   `?module=`, `?actorId=`, `?from=`, `?to=` with inclusive date range, `?page=`/`?limit=`
   (default 50, max 200). Includes actor name+phone via Prisma relation. Returns
   `modules: string[]` (distinct) so the filter dropdown stays reactive. (Renamed local var
   `module` -> `moduleFilter` to satisfy `@next/next/no-assign-module-variable` rule.)
7. Built wallet UI module `src/modules/wallet/`:
   - `wallet-types.ts` (102 lines) — types + per-trxType color tokens (emerald/amber/teal/rose)
     + `balanceTone()` helper.
   - `wallet-table.tsx` (153 lines) — table view with student name/rollNo, color-coded
     balance, recent-activity count + relative "last transaction" timestamp, View/Top-Up
     actions. Skeleton loading + empty state.
   - `wallet-details-dialog.tsx` (154 lines) — Dialog showing last 20 WalletLog entries,
     each with icon (top_up=ArrowUpCircle, canteen=ShoppingBag, laundry=WashingMachine,
     fee_deduction=GraduationCap), type badge, signed amount, description, datetime.
     ScrollArea (max-h-60vh).
   - `wallet-topup-dialog.tsx` (169 lines) — Dialog with amount input + payment-method
     Select (cash/bkash/nagad/bank) + optional note. Submits to `/api/wallet/[id]/topup`
     with credentials. Toast feedback. Resets on close.
   - `wallet-view.tsx` (194 lines) — orchestrator with header, gradient hero card showing
     total wallet balance + activeWallets stat, debounced search (300ms), paginated table,
     pagination footer, mounts both dialogs.
8. Built audit UI module `src/modules/audit/`:
   - `audit-types.ts` (78 lines) — types + per-action color tokens per spec
     (create=emerald, update=sky, delete=rose, login=amber, logout=slate).
   - `audit-filters.tsx` (105 lines) — Card with action Select, module Select (driven by
     server-returned distinct modules), from/to date inputs, "clear" button when any active.
   - `audit-timeline.tsx` (163 lines) — vertical timeline with absolute-positioned icon
     nodes on a spine line, each row has action badge + module + entityName, actor name/
     phone (with fallback "System"), absolute+relative timestamp, optional IP. Collapsible
     JSON details block (dir=ltr, monospace) when entry.details present.
   - `audit-view.tsx` (121 lines) — orchestrator with header (amber icon), filters card,
     entries count + pageOf summary, timeline, pagination.
9. Ran `bun run lint` — initial error was `no-assign-module-variable` in audit route
   (variable named `module`); renamed to `moduleFilter`. Final lint: 0 errors / 0 warnings.
10. Verified all 4 new API endpoints return 401 on unauthenticated request (expected).
11. Verified `npx tsc --noEmit` produces no errors in any of my new files (pre-existing
    errors in attendance/students/examples/skills modules are out of scope).
12. Verified dev.log shows clean incremental compiles.

## Stage Summary

- Files created:
  - src/app/api/wallet/route.ts (64 lines)
  - src/app/api/wallet/[studentId]/route.ts (52 lines)
  - src/app/api/wallet/[studentId]/topup/route.ts (106 lines)
  - src/app/api/audit/route.ts (74 lines)
  - src/modules/wallet/wallet-types.ts (102 lines)
  - src/modules/wallet/wallet-table.tsx (153 lines)
  - src/modules/wallet/wallet-details-dialog.tsx (154 lines)
  - src/modules/wallet/wallet-topup-dialog.tsx (169 lines)
  - src/modules/wallet/wallet-view.tsx (194 lines)
  - src/modules/audit/audit-types.ts (78 lines)
  - src/modules/audit/audit-filters.tsx (105 lines)
  - src/modules/audit/audit-timeline.tsx (163 lines)
  - src/modules/audit/audit-view.tsx (121 lines)
- Files modified:
  - src/i18n/translations.ts (+ ~80 wallet.* + audit.* keys per locale × 3 locales)
- Key decisions:
  - Top-up is fully atomic inside `db.$transaction` and touches 4 tables: Wallet (balance),
    WalletLog (top_up entry), Transaction (income with category=wallet_topup), Fund (General
    fund balance). The finance ledger and wallet ledger stay reconciled.
  - General fund is auto-discovered via `Fund.findFirst({ type: "general" })`. If the tenant
    hasn't created one, top-up is rejected with a clear error.
  - Payment method is the SOURCE of the top-up (cash/bkash/nagad/bank) — NOT "wallet" —
    per the spec clarification.
  - Audit timeline uses absolute-positioned icon nodes on a vertical spine (ps-10 + spine
    line) instead of a plain list. Each entry's color/icon maps to its action verb.
  - All audit entries include actor name via Prisma `actor` relation; null-actor (system)
    entries display the localized "System" label.
  - JSON details block is rendered with `dir="ltr"` and `font-mono` regardless of app
    direction, so JSON keys stay readable in Arabic UI.
  - Color palette strictly follows spec (create=emerald, update=blue via sky, delete=rose,
    login=amber, logout=slate) — no indigo.
  - Search & filters are debounced (200–300ms) to avoid hammering the API on every keystroke.
  - All queries filter by `session.tenantId`. Tenant-safety on the `[studentId]` route is
    enforced via `findFirst({ studentId, tenantId })` rather than `findUnique` (since
    `studentId` is globally unique but we still must reject cross-tenant access).
- Issues/notes:
  - WalletView and AuditView are exported but not yet wired into the main app-shell router
    (src/app/page.tsx) — that is the orchestrator/shell agent's responsibility. The ViewKey
    enum already includes `"wallet"` and `"audit"` so a single conditional render is all
    that's needed.
  - The wallet "View Details" dialog lazy-loads details only when opened, to avoid N+1
    queries on the list page.
  - Audit timeline renders up to 50 entries per page; for tenants with very high audit
    volume, server-side pagination keeps DOM size bounded.
  - Pre-existing TS/lint errors in `attendance/`, `students/student-form.tsx`,
    `examples/`, `skills/` are out of scope and left untouched.
