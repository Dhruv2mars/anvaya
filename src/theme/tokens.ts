/**
 * Anvaya visual system — restrained cool daylight.
 * Scene: quiet morning desk, soft sky light, personal ritual without temple drama.
 */
export const colors = {
  bg: "#F4F7FA",
  surface: "#FFFFFF",
  surfaceMuted: "#E8EEF4",
  ink: "#1A2430",
  inkSecondary: "#4A5A6A",
  inkTertiary: "#7A8A9A",
  accent: "#2F6FED",
  accentSoft: "#D6E4FF",
  accentPressed: "#2458C4",
  border: "#D5DEE8",
  borderSubtle: "#E6ECF2",
  ratingEmpty: "#D5DEE8",
  ratingFilled: "#2F6FED",
  danger: "#C23B3B",
  success: "#2A7A4B",
  overlay: "rgba(26, 36, 48, 0.4)",
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
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: "Manrope_700Bold",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
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
    letterSpacing: 0.2,
  },
  caption: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    lineHeight: 16,
  },
  panchang: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 15,
    lineHeight: 22,
  },
} as const;

export const motion = {
  fast: 150,
  normal: 220,
  slow: 320,
} as const;
