# Anvaya

Local-first mobile app for tracking life through the Hindu Panchang.

Open → see today’s Tithi, Vaar, Paksha → rate personal metrics 1–5 → optional one-line note → leave. Autosave. No account.

## Run

```bash
bun install
bun start          # Expo dev server
bun run web        # web preview
bun run ios        # iOS simulator (macOS)
bun run android    # Android emulator / device
```

## Quality

```bash
bun test
bun run typecheck
bun run lint
```

## Release (Android)

See [PLAY_STORE.md](./PLAY_STORE.md). Privacy: [PRIVACY.md](./PRIVACY.md).

```bash
bunx eas build --platform android --profile production
```

## Stack

- Expo Router (SDK 57) · TypeScript · SQLite (`expo-sqlite`)
- Panchang: `@ishubhamx/panchangam-js` (astronomy-engine / Swiss Ephemeris–class; Udaya/sunrise day)
- Location: `expo-location` (optional; Delhi fallback)

## Product decisions

- **Hindu day** = sunrise → next sunrise for the resolved location.
- Metrics are user-owned; archive preserves historical ratings.
- Intelligence in v1 = deterministic averages / streaks only.
- No cloud, auth, backup, or AI in v1.
