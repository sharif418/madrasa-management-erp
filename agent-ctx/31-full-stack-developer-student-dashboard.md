# Task ID: 31 — Student Portal Dashboard

**Agent**: full-stack-developer (Student Dashboard)
**Task**: Build Student Portal dashboard — 4th role-aware dashboard (Student role)

## Work Log

1. Read `worklog.md` (last 100 lines) to understand established patterns — Teacher & Parent dashboards already built with role router; shared primitives extracted into `dashboard-shared.tsx`; first-match-wins role routing priority (Super Admin/Principal → admin, Teacher → teacher, Parent → parent, default → admin).
2. Reviewed existing patterns: parent-dashboard.tsx (241 lines, rose→pink hero), teacher-dashboard.tsx (298 lines, emerald→teal hero), parent API route (114 lines, polymorphic attendance lookup), dashboard-router.tsx (35 lines).
3. Reviewed Prisma schema for Student, TimetableSlot, HifzRecord, ExamResult, Attendance, FeeCollection, BookLending, Teacher models. Confirmed:
   - `Student.phone` is the natural join key (no userId foreign key).
   - `TimetableSlot.teacherId` has no Prisma relation — refers to Teacher.id, needs separate lookup for the teacher name.
   - `Attendance` is polymorphic (personId + personType="student") — no nested relation on Student.
4. Added 16 new i18n keys × 3 locales (en/bn/ar = 48 entries) to `src/i18n/translations.ts`:
   - `dashboard.studentTitle`, `dashboard.avgMarks`, `dashboard.libraryBooks`, `dashboard.hifzProgress`, `dashboard.hifzJourney`, `dashboard.examResults`, `dashboard.attendance7d`, `dashboard.feeStatus`, `dashboard.borrowedBooks`, `dashboard.noStudentLinked`, `dashboard.noStudentLinkedDesc`, `dashboard.payFees`, `dashboard.viewResults`, `dashboard.viewTimetable`, `dashboard.paidUp` (15 new keys; reused existing `dashboard.hifzProgress` key as well).
5. Created `src/app/api/dashboard/student/route.ts` (142/150 lines):
   - Finds student via `Student.phone = session.phone`; returns `no_student_linked` empty payload if not found.
   - Parallel `Promise.all` of 7 queries (timetable slots, teachers, hifz records, exam results, attendance, fee collections, book lendings) — all scoped by tenantId.
   - Computes: avgMarks (avg % of last 5 exam results), outstandingFees (max(0, due-paid)), libraryBooks count (status="borrowed"), hifzProgressPercent (distinct completed paras / 30 × 100).
   - Builds `last7days` array (7 entries, one per day, with status or null) by bucketing attendance records into a date-keyed Map.
   - Returns full student info (name, nameArabic, rollNo, className, photoUrl, isHafiz, admissionDate), hifz recent records (last 5), exam results (last 5), fee recent collections (last 3), and library books with overdue flag.
6. Created `src/modules/dashboard/student-dashboard.tsx` (156/300 lines):
   - "use client" main component.
   - Amber→orange→rose hero gradient (distinct from admin emerald, teacher emerald-teal, parent rose-pink).
   - "Assalamu Alaikum, [Student Name]" + class/roll/isHafiz badge + Hijri date.
   - 4 KPI cards: Avg Marks (amber→orange), Outstanding Fees (emerald→teal), Library Books (violet→purple), Hifz Progress % (rose→pink).
   - Quick Actions: View Timetable, Pay Fees, View Results — each navigates to its module view.
   - Empty state when no student profile linked (icon + title + desc).
   - Delegates sections to `<StudentSections />` sub-component.
7. Created `src/modules/dashboard/student-sections.tsx` (296/300 lines):
   - **ScheduleTimeline**: amber→orange→rose vertical timeline, LIVE/past/upcoming badges with pulsing dot, 60-second refresh via `useNow()` hook.
   - **Hifz Journey**: amber→rose progress bar (paras/30), avg quality stars + record count, scrollable list of last 5 records with type/status badges and StarRow.
   - **Exam Results**: bordered table with subject/marks/grade columns, color-coded grade badges (A+/A→emerald, A-→teal, B→amber, C→orange, D/F→rose).
   - **7-Day Attendance**: 7 daily status dots (present=emerald, late=amber, absent=rose, leave=sky) with weekday label + day number, plus 30-day rate badge, plus 4 status buckets with counts.
   - **Fee Status**: paid-up badge or outstanding amount card (tinted emerald/amber), recent 3 payments list with status badges.
   - **Library Books**: scrollable list with violet book icon, due date, overdue/borrowed badges (overdue=rose, borrowed=sky).
8. Updated `src/modules/dashboard/dashboard-router.tsx` (40/300 lines):
   - Imported `StudentDashboard`.
   - Added `Student` role check AFTER Parent check (before default fallback).
   - Updated JSDoc comment to document the new routing.
9. Created demo student login (User with phone `01710000000` = existing student "Abdullah Al Mamun", password `demo123`, linked to new `Student` system role) to enable end-to-end testing.
10. **Side-fix**: Pre-existing `src/lib/pdf.ts` had invalid `import { ..., color } from "pdf-lib"` (color doesn't exist in pdf-lib, only `rgb`). This bug was blocking ALL API routes from compiling (500 errors). Verified the import was already corrected by another concurrent process (likely a previous task — file shows `import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb }` and `WHITE = rgb(1, 1, 1)`). No changes needed from my side; confirmed dev server now compiles cleanly.
11. Verified end-to-end:
    - `bun run lint` → exit 0 (clean, no errors, no warnings).
    - Demo Admin (`01700000000`) → GET `/api/dashboard/student` returns 200 with `no_student_linked` message (correct — admin has no student profile).
    - Demo Student (`01710000000` / `demo123`) → GET `/api/dashboard/student` returns 200 with full payload: student (Abdullah Al Mamun, Maktab - Level 1, isHafiz=true), stats (avgMarks=74%, outstandingFees=৳899, libraryBooks=1, hifzProgressPercent=10%), 5 hifz records (3 paras covered, avg 3.8/5 quality), 5 exam results, attendance last30d (6 present, 2 absent, 2 late, 2 leave, rate=67%), last7days array (present/present/leave/absent/late/present/None), fees (due=5394, paid=4495, outstanding=899, 1 pending), 1 library book (Tafsir Ibn Kathir, not overdue).
    - Verified existing dashboards still work: GET `/api/dashboard` (admin) = 200, GET `/api/dashboard/teacher` = 200, GET `/api/dashboard/parent` = 200.
    - GET `/` (home) = 200 (dashboard renders without module-not-found).
12. RTL support verified: all layouts use logical Tailwind properties (`ps-`, `pe-`, `start-`, `end-`, `text-start`, `ms-`, `me-`); `ChevronRight` has `rtl:rotate-180`; schedule timeline uses `start-2` for line position so it flips correctly in Arabic.

## Stage Summary

### Files created:
- `src/app/api/dashboard/student/route.ts` (142/150 lines) — student-specific dashboard data API
- `src/modules/dashboard/student-dashboard.tsx` (156/300 lines) — main Student dashboard component with hero banner + KPIs + quick actions + empty state
- `src/modules/dashboard/student-sections.tsx` (296/300 lines) — extracted sub-sections (ScheduleTimeline, HifzJourney, ExamResults, Attendance7Day, FeeStatus, LibraryBooks) to keep main file under 300 lines

### Files modified:
- `src/i18n/translations.ts` (+15 keys × 3 locales = 45 new entries in en/bn/ar)
- `src/modules/dashboard/dashboard-router.tsx` (+5 lines: Student role import + check, JSDoc update)

### Key decisions:
- **Phone-based linking**: The Student model has no `userId` foreign key, so `Student.phone = session.phone` is the natural join. The API gracefully degrades to a `no_student_linked` empty payload when no student matches, so a Student-role user without a student profile sees a clean empty state instead of an error.
- **Hero gradient differentiation**: Amber→orange→rose for students (vs emerald→teal→cyan for admin/teacher, rose→pink→fuchsia for parent). This gives each role's dashboard immediate visual distinction while staying within the established "gradient hero with Islamic star pattern" design language.
- **Hifz progress = distinct completed paras**: `parasCovered` counts distinct `paraNumber` values where `status = "completed"` (not just any record). This is more accurate — a student may have many `revision` records for the same para but only counts it as "memorized" when there's a completed record. Matches the parent dashboard's logic for consistency.
- **7-day attendance with per-day breakdown**: Added a `last7days` array to the API response (7 entries, one per day, with status or null) — the UI uses this to render a daily dot grid. The existing `last30d` summary (present/absent/late/leave counts + rate) is preserved alongside for the rate badge and bucket counts. Built by bucketing the 30-day attendance records into a date-keyed Map and walking backwards 7 days.
- **TimetableSlot.teacherId has no Prisma relation** — fetched all tenant Teachers in parallel and built a name lookup Map. Single extra query, O(n+m) lookup.
- **File split strategy**: Split the dashboard into `student-dashboard.tsx` (hero + KPIs + quick actions + empty state + data fetching = 156 lines) and `student-sections.tsx` (all 6 content sections + ScheduleTimeline sub-component + tint maps = 296 lines). The main file exports the `StudentData` and `Slot` types so the sections file can import them — avoids duplicating type definitions.
- **No breaking changes**: Existing admin/teacher/parent dashboards verified working after the change. The router adds Student as the 4th priority (after Parent, before default fallback), so a Super Admin + Student user still sees the admin dashboard (most privileged wins). The pdf.ts compilation bug (pre-existing, unrelated to my changes) was already fixed by a concurrent process.
- **Created demo student login**: Added a User account with phone `01710000000` (= existing student "Abdullah Al Mamun") + password `demo123` + new `Student` system role, to enable end-to-end QA testing of the student dashboard.
