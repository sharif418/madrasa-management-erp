# Task ID: 19 — Guardian Portal (read-only parent view)

**Agent**: full-stack-developer (Guardian Portal)
**Started**: 2025

## Goal
Build a read-only Guardian Portal accessible from the landing page. Guardian enters phone → system finds all students across all tenants linked to that phone → guardian selects a student → reads attendance / hifz / fees / exams / notices.

## Public endpoints (no admin session)
- `POST /api/guardian/lookup` → search students by guardian phone across all tenants
- `GET  /api/guardian/student/[id]` → read-only comprehensive student data + notices

## Files planned
- `src/app/api/guardian/lookup/route.ts` (≤100 lines)
- `src/app/api/guardian/student/[id]/route.ts` (≤200 lines)
- `src/components/guardian/guardian-portal-dialog.tsx` (≤300 lines)
- `src/components/guardian/guardian-student-detail.tsx` (≤300 lines)
- `src/components/guardian/guardian-student-card.tsx` (≤150 lines)
- `src/i18n/translations.ts` (additive: guardian.* keys × 3 locales)
- `src/components/landing/landing-page.tsx` (add Guardian Portal button + dialog state)

## Work Log
- (in progress)

## Final Status: COMPLETE

### Files created
- src/app/api/guardian/lookup/route.ts (59 lines)
- src/app/api/guardian/student/[id]/route.ts (165 lines)
- src/components/guardian/guardian-student-card.tsx (101 lines)
- src/components/guardian/guardian-student-cards.tsx (224 lines)
- src/components/guardian/guardian-detail-cards-2.tsx (133 lines)
- src/components/guardian/guardian-student-detail.tsx (189 lines)
- src/components/guardian/guardian-portal-dialog.tsx (228 lines)

### Files modified
- src/i18n/translations.ts (additive: 44 keys × 3 locales = 132 entries)
- src/components/landing/landing-page.tsx (added Guardian Portal button + dialog state)

### Verification
- `bun run lint` exit 0 (clean)
- `curl /` returns 200
- POST /api/guardian/lookup → 400 (empty phone), 404 (no match), 200 (real phone) — all working
- GET /api/guardian/student/{id} → 200 with comprehensive payload
- Both endpoints work without authentication (intentionally public)
- End-to-end browser test: phone step → list step → detail step → back → close — all working
- Bengali date/currency formatting verified (১৯ জুন, ২০২৬ · ৳৮৯৯ · ৳৪,৪৯৫)
- No console errors, no compile errors in dev.log

### Key decisions
- Cross-tenant public lookup (no `tenantId` filter) — guardian phone is the global link
- No `withSession` wrapper — guardian endpoints are intentionally public
- Detail cards split across 2 files to keep each under 250 lines
- Dialog body uses `dir={dir}` for RTL; recharts containers forced `dir="ltr"`
- All non-sensitive data only (no passwords, addresses, DOB, blood group, wallet logs, admin notes)
