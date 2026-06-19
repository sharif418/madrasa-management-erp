# FIX-4 — Fix Teachers translation typo (designationUstdh -> designationUstadh)

## Task
Teachers page was rendering raw translation keys (`teachers.designationUstadh`)
instead of localized text, because `translations.ts` defined the key with a typo
`designationUstdh` (missing the second "a") while `teachers-grid.tsx` line 163
looks up `designationUstadh` (with "a") via dynamic `cap()` construction.

## Files Modified
- `src/i18n/translations.ts` (ONLY this file)
  - Renamed JSON key `"teachers.designationUstdh"` -> `"teachers.designationUstadh"`
    in all 3 locale blocks (en line 215, bn line 714, ar line 1213) using
    `replace_all: true`.
  - Values preserved: en "Ustadh", bn "উস্তাদ", ar "أستاذ".
  - No other keys touched.

## Verification
- All 8 sibling keys already existed in all 3 locales (designationMudarris,
  designationShaykh, designationStaff, specHifz, specFiqh, specTafsir,
  specArabic, specGeneral) — no additions needed.
- Grep post-fix: 3× `designationUstadh`, 0× `designationUstdh`.
- `bun run lint` -> exit 0, clean.
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` -> 200.
- dev.log: successful Turbopack recompile, no errors.

## Root Cause
JSON key typo: `designationUstdh` vs the code's dynamically-built
`designationUstadh` (since `cap("ustadh") === "Ustadh"`). The custom `t()`
fallback returns the raw key string when missing, hence the leaked key on the
teacher cards.
