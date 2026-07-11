# Play Store — live status (11 Jul 2026)

## What is live now

| Item | Status |
|------|--------|
| Package | `com.anvaya.app` |
| Expo / EAS | `@dhruv2mars/anvaya` · projectId `fcb3ab25-e9a7-4d14-b8ed-c7ecc6aaf642` |
| Android AAB | version **6 (1.0.0)** uploaded & rolled out |
| Track | **Internal testing — Active** (available to internal testers) |
| Tester invite | https://play.google.com/apps/internaltest/4701354765818167743 |
| Tester email list | `Internal` → `dhruv.sharma10102005@gmail.com` |
| Play Console app | https://play.google.com/console/u/0/developers/6378211042817836535/app/4975853769936553499/app-dashboard |
| Privacy policy | https://gist.githubusercontent.com/Dhruv2mars/369f594ffb3ca163c0457395f1079cd0/raw/privacy.html |

Internal testing does **not** wait on full production review. Join via the invite link (Google account must match the tester list).

## Declarations completed

- Privacy policy URL
- Ads: no ads
- Sign-in / restricted access: none
- Content rating (IARC)
- Target audience: 18 and over
- Data safety: no required user data types collected/shared off-device (local-first v1)
- Government apps: no
- Financial features: none
- Health: Stress management / relaxation / mental acuity (daily mood ratings)
- Category: Health & Fitness
- Store contact: email + GitHub website
- Store listing: name, short/full description, app icon, feature graphic, phone screenshots (9:16 crops in `store/graphics/phone/shot-*-916.png`)

## Still waiting (human / Google only)

1. **Publishing overview → Send app for review** — may still show “complete required dashboard steps” until Play fully clears the draft checklist / listing validation. Re-open [Publishing overview](https://play.google.com/console/u/0/developers/6378211042817836535/app/4975853769936553499/publishing) and send when unlocked.
2. **Production** — personal developer accounts need a **closed test** with ≥12 opted-in testers for ≥14 days, then “Apply for production”. Internal testing is the usable track until then.
3. **Store listing polish** — keep ≥2 (prefer 4) phone screenshots at exact **1080×1920 (9:16)**. Non-9:16 captures are rejected by the asset library.

## Local release artifacts

- `dist/anvaya-1.0.0-v6.aab` — production AAB used for internal rollout
- `store/graphics/icon-512.png`
- `store/graphics/feature-graphic.png`
- `store/graphics/phone/shot-{a,b,c,d}-916.png`

## Rebuild / re-upload

```bash
bunx eas build --platform android --profile production
# then upload AAB on Internal testing → Create new release (bump versionCode)
```

## iOS later

`bundleIdentifier` is `com.anvaya.app`. Needs Apple Developer + `eas build --platform ios`. Config/icons are ready; no App Store submit without the account.
