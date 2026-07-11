# Play Store — live status (11 Jul 2026)

## What is live now

| Item | Status |
|------|--------|
| Package | `com.anvaya.app` |
| Expo / EAS | `@dhruv2mars/anvaya` · projectId `fcb3ab25-e9a7-4d14-b8ed-c7ecc6aaf642` |
| Android AAB | version **6 (1.0.0)** |
| Internal testing | **Active** — available to internal testers |
| Closed testing (Alpha) | **In review** — release 6 (1.0.0) submitted with India + United States; testers = email list `Internal` (1 email) |
| Publishing overview | **Changes in review** — store listing, declarations, closed-track release, and related items sent 11 Jul 2026 |
| Tester invite (internal) | https://play.google.com/apps/internaltest/4701354765818167743 |
| Tester email list | `Internal` → `dhruv.sharma10102005@gmail.com` |
| Play Console app | https://play.google.com/console/u/0/developers/6378211042817836535/app/4975853769936553499/app-dashboard |
| Privacy policy | https://gist.githubusercontent.com/Dhruv2mars/369f594ffb3ca163c0457395f1079cd0/raw/privacy.html |

Internal testing does **not** wait on production review. Join via the invite link (Google account must match the tester list).

## Declarations completed (submitted for review)

- Privacy policy URL
- Ads: no ads
- Advertising ID: app does **not** use advertising ID
- Sign-in / restricted access: none
- Content rating (IARC)
- Target audience: 18 and over
- Data safety
- Government apps: no
- Financial features: none
- Health apps declaration
- Category: Health & Fitness
- Store contact: email + GitHub website
- Store listing: name, short/full description, app icon, feature graphic, **4** phone screenshots (1080×1920) in `store/graphics/phone/shot-*-916.png`

## Still waiting (Google / human policy only)

1. **Google review** of the submitted changes (typically within ~7 days; can take longer). Watch [Publishing overview](https://play.google.com/console/u/0/developers/6378211042817836535/app/4975853769936553499/publishing).
2. **Production access** — personal developer accounts need a **closed test** with **≥12 opted-in testers for ≥14 consecutive days**, then “Apply for production”. Current closed-track list has **1** real tester email; do **not** invent fake testers. After review approves the closed release, share the closed-test join link and enroll ≥12 real Google accounts, then wait 14 days.
3. Nothing else agent-actionable remains for Send for review (already submitted).

## Local release artifacts

- `dist/anvaya-1.0.0-v6.aab` — AAB used for internal + closed release
- `store/graphics/icon-512.png`
- `store/graphics/feature-graphic.png`
- `store/graphics/phone/shot-{a,b,c,d}-916.png`

## Rebuild / re-upload

```bash
bunx eas build --platform android --profile production
# then upload AAB on Internal or Closed testing → Create new release (bump versionCode)
```

## iOS

`bundleIdentifier` is `com.anvaya.app`. Dogfood on Expo Go (iOS sim) verified 11 Jul 2026 after Metro fixes (skip kundli/`fs` barrel; force CJS `astronomy-engine`; sunrise formatted at observer longitude). App Store submit still needs Apple Developer + `eas build --platform ios`.
