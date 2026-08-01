/**
 * Anvaya visual system — cool mist desk, crimson accent.
 * Scene: morning check-in after coffee; cool stone light, one warm mark.
 * Restrained: tinted cool neutrals + accent ≤10%.
 */
export const colors = {
  bg: "#EAEFF3",
  bgDeep: "#DCE4EB",
  surface: "#FFFFFF",
  surfaceMuted: "#DFE6EC",
  ink: "#141B24",
  inkSecondary: "#3A4654",
  inkTertiary: "#6B7885",
  accent: "#C43B2E",
  accentDeep: "#A93224",
  accentSoft: "#F6E4E1",
  accentPressed: "#A32F24",
  accentOn: "#FFFFFF",
  border: "#C8D2DB",
  borderSubtle: "#D8E0E7",
  ratingEmpty: "#C8D2DB",
  ratingFilled: "#C43B2E",
  danger: "#B83A3A",
  success: "#1F6B45",
  overlay: "rgba(20, 27, 36, 0.42)",
  marksWash: "#E3EBF1",
  marksWashWarm: "#F3E8E5",
  /** Warm sunrise bloom (kept inside the accent family) */
  sun: "#D96A3E",
  sunSoft: "#F5E0D2",
  /** Unlit moon disc on day-mark heroes */
  moonShade: "#C7D2DC",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const type = {
  /** Hero day title — largest Fraunces display */
  displayXL: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -0.6,
  },
  display: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.35,
  },
  title: {
    fontFamily: "Manrope_700Bold",
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  /** Section page titles (History / Measures / Settings) */
  pageTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.45,
  },
  headline: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.12,
  },
  caption: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    lineHeight: 16,
  },
  /** Uppercase eyebrow kickers above sections */
  eyebrow: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },
  marks: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.15,
  },
  /** Large Fraunces line for day-mark heroes */
  marksLarge: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.25,
  },
  brand: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
} as const;

export const motion = {
  fast: 140,
  normal: 200,
  slow: 280,
  /** Strong ease-out for press / enter feedback */
  easeOut: [0.23, 1, 0.32, 1] as const,
} as const;

/** Reanimated spring presets (damping / stiffness) — Apple-style response. */
export const springs = {
  /** Default UI spring: critically damped feel, ~0.35s response */
  gentle: { damping: 22, stiffness: 220, mass: 0.9 },
  /** Touch feedback: fast settle, minimal overshoot */
  snappy: { damping: 18, stiffness: 380, mass: 0.6 },
  /** Momentum moments (rating pop): slight lively bounce */
  bouncy: { damping: 13, stiffness: 320, mass: 0.7 },
} as const;

/** Elevation via CSS boxShadow (New Architecture). */
export const elevation = {
  card: "0 1px 2px rgba(20, 27, 36, 0.05), 0 10px 30px rgba(20, 27, 36, 0.06)",
  raised: "0 2px 4px rgba(20, 27, 36, 0.06), 0 18px 44px rgba(20, 27, 36, 0.10)",
  float: "0 24px 60px rgba(20, 27, 36, 0.16)",
} as const;
