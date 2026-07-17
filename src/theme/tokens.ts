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
  pill: 999,
} as const;

export const type = {
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
  marks: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.15,
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
