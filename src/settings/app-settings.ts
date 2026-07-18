import * as settingsKv from "@/src/db/settings-kv";
import { createSettingsStore, type SettingsKv } from "@/src/settings/settings";

/** Production KV adapter over the SQLite settings table. */
export const sqliteSettingsKv: SettingsKv = {
  get: (key) => settingsKv.getSetting(key),
  set: (key, value) => settingsKv.setSetting(key, value),
};

/** App-wide typed settings — SQLite-backed. */
export const appSettings = createSettingsStore(sqliteSettingsKv);
