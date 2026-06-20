# Task 57 — Doc Gallery + Audit Before/After + Docker Setup

## Summary
Built the 3 remaining blueprint gaps organically integrated into existing modules:

### Feature 1: Student Document Gallery
- **Prisma**: new `StudentDocument` model (base64 data stored as text for SQLite simplicity; relations + index on tenant+student+type). `db:push` ran successfully.
- **API**:
  - `GET /api/students/[id]/documents` — tenant-scoped list.
  - `POST /api/students/[id]/documents` — multipart upload (file + title + type), 5 MB max, validates type ∈ {birth_certificate, transfer_certificate, medical, photo, other}, RBAC `students:create`, audit.
  - `GET /api/students/[id]/documents/[docId]` — returns raw file bytes with proper Content-Type.
  - `DELETE /api/students/[id]/documents/[docId]` — RBAC `students:delete`, audit.
- **UI**: new `src/modules/students/documents-tab.tsx` (color-coded document cards, type filter, upload dialog with file picker + size preview, delete confirmation). Integrated as 6th "Documents" tab (FolderOpen icon) in `student-profile-view.tsx`.

### Feature 2: Audit Log Before/After
- **`src/lib/audit.ts`**: extended `AuditInput` with optional `before?` / `after?` (Record<string, unknown>); merged into existing `details` JSON so the single AuditLog schema column is reused — no migration needed. Backward compatible (older entries just lack these keys).
- **`src/modules/audit/audit-timeline.tsx`**: new collapsible "Changes" section (GitCompare icon) for entries with before/after; renders a 3-column Field/Before/After table with color-coded rows — amber for changed, emerald for added (Before = "—"), rose for removed (After = "—"). Existing entries without before/after render unchanged.
- **Mutations**: `students/[id]/route.ts` PUT now strips class/wallet relations and passes scalar-only `beforeScalars`/`afterScalars` to audit. `teachers/[id]/route.ts` PUT passes full `existing`/`updated` as before/after.

### Feature 3: Docker Setup
- **`Dockerfile`** (44 lines): 3-stage multi-stage build with `oven/bun:1.1-alpine` — deps → build (prisma generate + next build) → runner (non-root `nextjs` user, copies standalone output + static + public + .prisma + @prisma client + prisma schema, `/app/db` dir for SQLite, exposes 3000, runs `bun server.js`).
- **`docker-compose.yml`** (16 lines): single `app` service, port 3000:3000, envs DATABASE_URL/MM_SECRET/NODE_ENV, `./data:/app/db` volume for SQLite persistence.
- **`.dockerignore`** (18 lines): excludes node_modules, .next, .git, logs, dev artifacts to keep build context small.

### i18n
Added 15 new translation keys × 3 locales (en/bn/ar) in `src/i18n/translations.ts`:
- 10 `student.*` keys (documents, uploadDocument, documentTitle, documentType, birthCertificate, medicalRecord, photo, otherDocument, noDocuments, documentUploaded). Reused existing `student.transferCertificate` (same values).
- 5 `audit.*` keys (changes, before, after, field, noChanges).

Islamic-appropriate Bengali (নথিপত্র / জন্ম সনদ / চিকিৎসা নথি) and Arabic (المستندات / شهادة الميلاد / سجل طبي).

## Verification
- `bun run lint` — clean for all my files (single pre-existing error in `src/components/shared/theme-toggle.tsx` is another agent's untracked parallel work; not touched by this task).
- `bun run db:push` — generated Prisma Client v6.19.2 successfully.
- Dev server compiled both new API routes (`✓ Compiled in 913ms` + `898ms`); curl returned 401 (expected — no session cookie).

## File Inventory
**Created:**
- `src/app/api/students/[id]/documents/route.ts` (95 lines)
- `src/app/api/students/[id]/documents/[docId]/route.ts` (50 lines)
- `src/modules/students/documents-tab.tsx` (263 lines)
- `Dockerfile` (44 lines)
- `docker-compose.yml` (16 lines)
- `.dockerignore` (18 lines)

**Modified:**
- `prisma/schema.prisma` (+StudentDocument model + relations)
- `src/lib/audit.ts` (+before/after params)
- `src/modules/audit/audit-timeline.tsx` (+ChangesTable diff view)
- `src/app/api/students/[id]/route.ts` (PUT passes before/after)
- `src/app/api/teachers/[id]/route.ts` (PUT passes before/after)
- `src/modules/students/student-profile-view.tsx` (+6th Documents tab)
- `src/i18n/translations.ts` (+15 keys × 3 locales)

## Compliance
- All files under 300 lines (most under 270).
- All queries filter by `tenantId` from session.
- RBAC + audit on every mutation.
- RTL-aware (logical Tailwind properties, `dir()`, chevron flips).
- All features organically integrated into existing modules — NO new sidebar items.
- Existing functionality untouched (5 existing student-profile tabs, existing audit entries, existing audit fields all render unchanged).
