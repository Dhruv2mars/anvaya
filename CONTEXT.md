# Anvaya

A local-first daily check-in beside sunrise-based lunar and solar day marks.

## Language

**DaySession**:
The live engagement with one selected Hindu day — which day is open, its day marks, ratings, and note — plus coordination with the shell’s notion of “today.”
_Avoid_: AppSession, CheckIn

**ObservedDay**:
Secular day marks for one Hindu day at an observer location — the shared shape for Today, History, and DaySession UI (not the live loop itself).
_Avoid_: PanchangSnapshot (engine), DayRecord marks fields (persistence), day-marks blob

**Hindu day**:
A day keyed by sunrise at the observer’s longitude, not midnight on the device clock.
_Avoid_: calendar day, civil day (use only when contrasting with Hindu day)

**Day marks**:
The secular fields shown for a Hindu day (lunar day + waxing/waning, weekday, sunrise). Traditional engine names stay behind the ObservedDay seam.
_Avoid_: horoscope, kundli, tithi/vaar/paksha (implementation vocabulary)

**Measure**:
A named 1–5 rating dimension the person tracks across days. Domain TypeScript uses Measure / measureId; SQLite still stores the legacy `metrics` / `metric_id` names behind the repository adapter.
_Avoid_: metric (except in SQL storage), habit, goal

**Visible measures (for a day)**:
The measures shown when rating a Hindu day — all active measures, plus archived ones that already have a rating on that day.
_Avoid_: recomputing archive+rated filters in screens

**Activity history**:
The past Hindu days that have a note or ratings, plus quiet patterns over recent ratings — one seam for the History screen.
_Avoid_: repository reads from screens, history blob, stats feed

**Quiet patterns**:
Per-measure averages, last-7 averages, and streaks computed from recent ratings for the History screen.
_Avoid_: duplicating day-key shift logic, paksha analytics without a product need

**App settings**:
Typed preferences persisted on device (onboarding complete, cached location) — callers use the settings store, not raw KV keys or encodings.
_Avoid_: getSetting/setSetting string keys, "1" flags, location_cache JSON in feature code

**Persistence use-cases**:
SQLite access is grouped by use-case — measures, days, ratings, and settings KV — not one wide repository bag.
_Avoid_: a monolithic repository.ts, pass-through re-export barrels
