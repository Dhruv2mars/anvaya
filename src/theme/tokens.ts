/**
 * Anvaya visual system — cool daylight desk, cobalt accent.
 * Scene: quiet morning light, personal ritual without temple drama.
 * Restrained strategy: tinted neutrals + one accent ≤10%.
 */
export const colors = {
  bg: "#EEF3F8",
  surface: "#FFFFFF",
  surfaceMuted: "#E2EAF2",
  ink: "#15202B",
  inkSecondary: "#3D4F61",
  inkTertiary: "#6B7C8D",
  accent: "#2A63D8",
  accentSoft: "#D9E6FF",
  accentPressed: "#1E4FB0",
  border: "#C9D5E3",
  borderSubtle: "#DCE5EE",
  ratingEmpty: "#C9D5E3",
  ratingFilled: "#2A63D8",
  danger: "#B83A3A",
  success: "#247A48",
  overlay: "rgba(21, 32, 43, 0.4)",
  panchangWash: "#E6EEF8",
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
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: "Manrope_700Bold",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.25,
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
    letterSpacing: 0.15,
  },
  caption: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    lineHeight: 16,
  },
  panchang: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
} as const;

export const motion = {
  fast: 150,
  normal: 200,
  slow: 280,
} as const;
