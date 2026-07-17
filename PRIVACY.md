# Anvaya — Privacy Policy

**Last updated:** 17 July 2026

Anvaya (“the App”) is a local-first personal calendar and daily ratings app.

## Data we store

All core data is stored in a local SQLite database in the App’s private storage on your device:

- Personal measure names you create
- Daily ratings (1–5) and optional one-line notes
- Cached day-mark fields for days you open
- Coordinates used for day marks (see Location)

We do **not** require an account. We do **not** operate a cloud backend for core features in this version. We do **not** sell personal data. There is no sync or analytics network call in v1.

## Location

If you grant location permission, the App may use **precise** coordinates (when the platform provides them) to compute local sunrise and lunar/solar day marks. Coordinates may be:

1. Cached in settings (`location_cache`) for reuse, and
2. Stored on each day record you open (`latitude` / `longitude` on that day’s row) so historical day marks can be reproduced.

You may deny permission; the App falls back to a default location (Delhi) with reduced local accuracy. Location is used only for astronomy calculations — not for advertising or sharing.

## Backup

Android Auto Backup is **disabled** for Anvaya so ratings, notes, and location history are not copied to a Google account backup by default. Clearing app storage or uninstalling removes local data.

## Children

The App is not directed at children under 13.

## Contact

For privacy questions about this build, contact the publisher listed on the store listing.

## Changes

We may update this policy when features change (for example if optional backup/sync is added later). Material changes will be noted by updating the date above.
