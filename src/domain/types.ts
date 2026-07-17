export type DayKey = string; // YYYY-MM-DD — sunrise-based day key at observer longitude

export type Metric = {
  id: string;
  name: string;
  sortOrder: number;
  archivedAt: number | null;
  createdAt: number;
};

export type Rating = {
  id: string;
  dayKey: DayKey;
  metricId: string;
  value: number; // 1–5
  updatedAt: number;
};

export type DayRecord = {
  dayKey: DayKey;
  note: string;
  noteUpdatedAt: number | null;
  tithi: string | null;
  vaar: string | null;
  paksha: string | null;
  nakshatra: string | null;
  masa: string | null;
  sunriseIso: string | null;
  latitude: number | null;
  longitude: number | null;
  updatedAt: number;
};

export type PanchangSnapshot = {
  dayKey: DayKey;
  tithi: string;
  tithiIndex: number;
  vaar: string;
  paksha: "Shukla" | "Krishna";
  nakshatra: string;
  masa: string;
  sunrise: Date;
  sunset: Date;
  latitude: number;
  longitude: number;
};

export type LocationFix = {
  latitude: number;
  longitude: number;
  altitude: number;
  source: "gps" | "cached" | "default";
};

export type AppSettings = {
  onboardingComplete: boolean;
  locationPermissionAsked: boolean;
  defaultLatitude: number;
  defaultLongitude: number;
  timezone: string;
};

export const DEFAULT_LOCATION: LocationFix = {
  // Delhi — used only until user grants location; labeled in UI
  latitude: 28.6139,
  longitude: 77.209,
  altitude: 0,
  source: "default",
};
