# Task 51 — Website CMS Page Builder + Gateway Config

## Scope
Build 2 features for the Madrasa Management ERP (Next.js 16 / Prisma / multi-tenant):

1. **Advanced Website CMS** — page builder with customizable sections (hero/text/stats/features/gallery/contact/cta), create/edit/delete pages, publish + homepage toggles, live preview.
2. **SMS/WhatsApp/Email Gateway Config** — admin UI to enter provider API keys/secrets, with simulated test-send buttons.

## Outcome
All delivered. Lint clean (0 errors, 0 warnings). No new TypeScript errors (only 52 pre-existing baseline errors from other modules).

## Files Created (10)
- `prisma/schema.prisma` — added `WebsitePage` + `Setting` models (tenant-scoped key-value store)
- `src/app/api/website/pages/route.ts` — GET list + POST create (RBAC website:create)
- `src/app/api/website/pages/[id]/route.ts` — PUT update + DELETE (RBAC website:update/delete)
- `src/app/api/settings/gateway/route.ts` — GET + PUT upsert (RBAC settings:update, key whitelist, audit with masked secrets)
- `src/modules/website/page-section-types.ts` — types + section metadata + factory
- `src/modules/website/page-section-editor.tsx` — per-section inline editor
- `src/modules/website/page-preview.tsx` — stacked preview of all 7 section types
- `src/modules/website/page-builder-dialog.tsx` — full create/edit dialog with live preview
- `src/modules/website/pages-tab.tsx` — page list + CRUD actions
- `src/modules/settings/settings-integrations-tab.tsx` — SMS/WhatsApp/Email gateway config cards

## Files Modified (3)
- `src/i18n/translations.ts` — +57 keys × 3 locales (en/bn/ar) = 171 new entries
- `src/modules/website/website-view.tsx` — added 3rd "Pages" tab
- `src/modules/settings/settings-view.tsx` — added 5th "Integrations" tab

## Key Design Decisions
- **Key-value Setting model** instead of JSON column on Tenant (simpler, atomic upserts, easier to audit/rotate per key)
- **ALLOWED_KEYS whitelist** on gateway API prevents arbitrary key injection (security)
- **Sensitive keys masked in audit log** (regex `/key|secret|password/i` → `***`)
- **`website.pagePublished` instead of `website.published`** to avoid breaking existing toast message in website-settings-tab (existing key means "Notice published to website")
- **Auto-slugify from title** unless user manually edits slug (slugTouched state)
- **Homepage toggle** unsets other pages' isHomepage flag (only one homepage per tenant)
- **Section reorder** via up/down buttons (not full drag-and-drop, per task spec)
- **Section defaults** pre-populated with sensible madrasa content (e.g. hero "Welcome to Our Madrasa", 3 stat cards, 3 features grid)
- **Test buttons simulated** with 700ms delay → toast.success (per spec)
- **Emerald gradient pattern** preserved on all primary Save buttons matching the established design system

## Multi-tenant + RBAC
- Every DB query filters by `tenantId` from session
- `db.websitePage.findFirst({ where: { id, tenantId: session.tenantId } })` before any update/delete
- Gateway Setting scoped by `tenantId_key` composite unique
- All mutations audit-logged via `auditAfter()`
- CASCADE delete from Tenant → WebsitePage + Setting

## Stats
- New Prisma models: 2 (WebsitePage, Setting) — total 56
- New API routes: 3 (4 HTTP methods)
- New i18n entries: 171 (57 × 3 locales)
- All files under 250 lines
- Lint: 0 errors, 0 warnings
