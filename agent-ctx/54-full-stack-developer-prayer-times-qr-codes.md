# Task 54 — Prayer Times + QR Code Student IDs

**Agent:** full-stack-developer
**Task ID:** 54
**Scope:** Build 2 Islamic-specific features (Prayer Time Integration + QR Code Student IDs) and organically integrate them into existing modules.

## What was built

### Feature 1: Prayer Time Integration
- **Prisma schema**: added `latitude Float?` + `longitude Float?` to `Tenant` model + ran `bun run db:push`.
- **`src/lib/prayer-times.ts`** (100 lines): wrapper around the `adhan` npm package. Computes accurate prayer times for any lat/lng using the Muslim World League calculation method + Shafi madhab. Returns Date objects + already-formatted HH:MM strings in the location's local timezone (derived from longitude via `Etc/GMT±N`). Handles "next prayer = none" after Isha by falling back to tomorrow's Fajr. Exposes `getPrayerTimes`, `getNextPrayer`, `formatCountdown`, `listPrayers`, `formatPrayerTime`, `tzFromLongitude`.
- **`src/app/api/prayer-times/route.ts`** (18 lines): GET endpoint, requires session, returns `{ available: false, message }` if tenant has no lat/lng, else `{ available: true, times }` with all 6 prayer times + next prayer + countdown.
- **`src/modules/settings/settings-info.tsx`** (modified): added a new "Location" card with Latitude + Longitude inputs + helper text "Used for prayer time calculations". TenantInfo type extended with `latitude` + `longitude` (both nullable). Form state + submit payload include both fields.
- **`src/app/api/settings/route.ts`** (modified): GET now returns `latitude` + `longitude`; PUT accepts both, parses string-or-number, clamps to valid ranges (±90 / ±180), persists as `null` when empty.
- **`src/components/shell/prayer-time-widget.tsx`** (118 lines): client component that fetches `/api/prayer-times` on mount + every 60s + ticks countdown locally every 5s. Shows a small emerald pill in the header with moon icon + next prayer name + time + countdown ("in 2h 15m" or "now" if within 10 min). Hover tooltip lists all 6 prayer times for today. If no location set, shows amber "Set location for prayer times" link that navigates to settings. Mobile: hides countdown.
- **`src/components/shell/app-header.tsx`** (modified): added `<PrayerTimeWidget />` between the page title block and the actions section (command palette + language switcher + notification bell + logout).

### Feature 2: QR Code Student IDs
- **`bun add qrcode` + `bun add -D @types/qrcode` + `bun add adhan`** installed.
- **`src/app/api/idcards/pdf/route.ts`** (modified, 209 lines = 191 original + 18 for QR): pre-generates a QR code PNG buffer per person (encoding the student/staff id), pre-embeds each as a `PDFImage` in the doc (in parallel), then draws a 56×56 QR code in the bottom-right corner of each ID card with an emerald border + "Scan for attendance" label below it. Existing layout (header band, photo, name, ID badge, detail fields, validity strip, decorative barcode) is untouched.
- **`src/app/api/attendance/qr-scan/route.ts`** (48 lines): POST endpoint, requires session + `attendance:create` permission. Body: `{ studentId, date?, status? }`. Verifies student belongs to tenant, upserts an Attendance record (personType="student", date at local midnight), audits the action, returns `{ success, student: { name, rollNo, className, photoUrl }, status, date }`. 404 if student not found.
- **`src/modules/attendance/qr-scanner.tsx`** (182 lines): client component with manual/paste student-ID input + "Mark Present" button (simulates a scan). On submit: calls `/api/attendance/qr-scan`, plays a confirmation beep (Web Audio API — 880 Hz for success, 220 Hz for failure), shows a success card with the student's initials avatar + name + roll/class + "Present" badge, auto-clears input + refocuses for the next scan. Maintains a scrollable list of today's scans (max 30) at the bottom.
- **`src/modules/attendance/attendance-view.tsx`** (modified): added a 3rd tab "QR Scan" (with QrCode icon) alongside the existing "Students" and "Teachers" tabs. Existing tabs and their AttendanceMarker behavior preserved. Class filter is disabled when on the QR tab.

### i18n keys added to all 3 locales (en, bn, ar)
- `prayer.*` (12 keys): nextPrayer, fajr, dhuhr, asr, maghrib, isha, sunrise, in, now, setLocation, allTimes, time
- `settings.*` (4 keys): location, latitude, longitude, locationDesc
- `attendance.*` (7 keys): qrScan, scanStudentId, markPresent, scanned, scanSuccess, scanFailed, qrCode, scanForAttendance

## Files created (8)
- `src/lib/prayer-times.ts`
- `src/app/api/prayer-times/route.ts`
- `src/app/api/attendance/qr-scan/route.ts`
- `src/components/shell/prayer-time-widget.tsx`
- `src/modules/attendance/qr-scanner.tsx`
- (and updated `prisma/schema.prisma` for the Tenant lat/lng fields)

## Files modified (6)
- `prisma/schema.prisma` — added `latitude Float?` + `longitude Float?` to Tenant
- `src/app/api/settings/route.ts` — GET returns + PUT persists lat/lng
- `src/modules/settings/settings-info.tsx` — added Location card with lat/lng inputs
- `src/components/shell/app-header.tsx` — added `<PrayerTimeWidget />`
- `src/app/api/idcards/pdf/route.ts` — added QR code (56×56) + "Scan for attendance" label
- `src/modules/attendance/attendance-view.tsx` — added 3rd "QR Scan" tab
- `src/i18n/translations.ts` — +23 keys × 3 locales

## Verification
- `bun run lint` → clean (no errors)
- Dev server compiles all new routes (verified `GET /api/prayer-times` 401 + `POST /api/attendance/qr-scan` 401 in dev.log)
- Standalone bun test verified `adhan` correctly computes Dhaka prayer times (Fajr 03:44 AM, Dhuhr 12:01 PM, Maghrib 06:48 PM, etc.)
- Standalone bun test verified `qrcode.toBuffer` + `pdf-lib.embedPng` + `page.drawImage` produce a valid PDF

## Design notes
- Used the established emerald/teal Islamic design language (emerald pill, emerald borders, gradient buttons from emerald-600 to teal-600).
- Amber color used only for the "set location" CTA (not blue/indigo).
- Tooltip + RTL support for Arabic locale.
- All API queries filter by `session.tenantId`.
- No new sidebar items, no new top-level views — both features organically integrate into the existing app header, settings, ID cards, and attendance modules.
