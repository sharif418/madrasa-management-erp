# Task 11 — Finance Module (Shariah-Compliant + Tamlik)

**Agent:** full-stack-developer (Finance)
**Status:** ✅ Complete — `bun run lint` clean, all routes registered.

## Files Created

### API Routes (all tenant-scoped via `withSession` + `session.tenantId`)

| Route | Methods | Lines | Notes |
|---|---|---|---|
| `src/app/api/finance/route.ts` | GET | 57 | Overview: funds, total balance, 30d sums, 10 recent txns |
| `src/app/api/finance/funds/route.ts` | GET, POST | 76 | Create fund optionally records an `opening_balance` income txn |
| `src/app/api/finance/transactions/route.ts` | GET, POST | 221 | GET filters+pagination+sums. POST income/expense/transfer. Tamlik path runs in `db.$transaction` |
| `src/app/api/finance/transactions/[id]/route.ts` | DELETE | 78 | Reverses fund balance; Tamlik-aware (reverses wallet + WalletLog) |

### UI Module (`src/modules/finance/`)

| File | Lines | Role |
|---|---|---|
| `finance-types.ts` | 117 | Shared types + color tokens |
| `finance-view.tsx` | 140 | Top-level: stat strip + Tabs |
| `finance-funds.tsx` | 232 | Funds tab: total card, fund grid, recent activity |
| `finance-form.tsx` | 4 | Barrel re-export |
| `finance-form-fund.tsx` | 175 | Add Fund dialog |
| `finance-form-transaction.tsx` | 271 | Add Transaction dialog (radio type + Shariah note) |
| `tamlik-dialog.tsx` | 297 | Tamlik automation: Zakat fund → eligible student wallet |
| `finance-transactions.tsx` | 219 | Transactions tab container |
| `finance-tx-filters.tsx` | 172 | Filter bar + summary chips |
| `finance-tx-table.tsx` | 146 | Table presentation |
| `finance-chart.tsx` | 164 | recharts 6-month income/expense/transfer bars |

### Files Modified
- `src/i18n/translations.ts` — added ~35 `finance.*` keys per locale (en/bn/ar).

## Key Decisions
- **Tamlik = `type=transfer`** with `category=tamlik_zakat`, `paymentMethod=wallet`, and a JSON `tamlikProof` containing `{ studentId, studentName, amount, date, fundId, fundName, witness, witnessName }`.
- **Tamlik backend validation**: requires `relatedStudentId`, requires fund.type === `zakat`, requires `student.isZakatEligible === true`, requires `amount <= fund.balance`. All atomic in `db.$transaction`.
- **Fund creation with `initialBalance`**: writes fund + matching `opening_balance` income transaction so the ledger reconciles.
- **DELETE reverses**: income → decrement fund; expense/transfer → increment fund; transfer+proof → also reverse wallet top-up (clamped to ≥0) and delete the latest matching `WalletLog`.
- **Color coding**: general=slate, lillah=emerald, waqf=blue, zakat=amber, sadaqah=rose. Income=emerald, expense=rose, transfer=purple.
- **File splits** keep every view file under 300 lines (per project rule).

## Notes for Downstream Agents
- The `/api/students` endpoint does not expose `isZakatEligible`; the Tamlik dialog shows all students-with-wallets and relies on the backend POST to validate eligibility. If a future agent adds the flag to `/api/students`, the Tamlik dialog can be tightened.
- `WalletLog` does not carry a `transactionId` foreign key; the DELETE handler matches by `(walletId, trxType=top_up, amount)` + latest createdAt. A future schema migration could add `transactionId` for stricter linkage.
- All API routes respond 401 when called without a session cookie (verified via curl).
- The shell (sidebar / view router) needs to mount `<FinanceView />` when `view === "finance"`. The component itself is self-contained and only depends on the `useApp` store.
