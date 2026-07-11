# Play Store — remaining human steps

Anvaya is configured for Android release (`com.anvaya.app`, version `1.0.0` / `versionCode` 1). Complete these steps in a Google account you control:

## 1. EAS / Expo project

```bash
bunx eas login
bunx eas init   # replace placeholder projectId in app.json
bunx eas build --platform android --profile production
```

Production profile builds an **AAB** (Play App Bundle).

## 2. Signing

EAS manages a upload key by default. Download credentials backup from Expo dashboard and store offline. For Play App Signing, accept Google’s signing when creating the app.

## 3. Google Play Console

1. Create app **Anvaya** (category: Lifestyle or Productivity).
2. Upload AAB from EAS.
3. Complete store listing:
   - Short description (~80 chars)
   - Full description (see `store/listing.md`)
   - Screenshots: phone (min 2), optionally 7" / 10" tablet
   - Feature graphic 1024×500
   - App icon 512×512 (export from `assets/images/icon.png`)
4. Privacy policy URL — host `PRIVACY.md` (GitHub Pages, Notion public page, etc.) and paste URL.
5. Data safety form:
   - Location: collected, not shared, app functionality, optional
   - Personal info: none required / no account
   - Data encrypted in transit: N/A for local-only core; if you later add sync, update this
6. Content rating questionnaire (IARC).
7. Target audience / news apps declarations as applicable.
8. Submit to internal testing → closed → production.

## 4. Optional iOS later

`bundleIdentifier` is `com.anvaya.app`. Apple Developer account + `eas build --platform ios` when ready.
