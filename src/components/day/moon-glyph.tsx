import { StyleSheet, View } from "react-native";
import { colors } from "@/src/theme/tokens";

type Props = {
  /** 1–15 day within the lunar half-cycle */
  lunarDay: number;
  phase: "Waxing" | "Waning";
  size?: number;
};

const LIT = "#FFF7EA";

/**
 * Moon phase glyph drawn with clipped layers — no SVG, no assets.
 * Lit side leads for waxing (right), trails for waning (left).
 */
export function MoonGlyph({ lunarDay, phase, size = 44 }: Props) {
  const day = Math.min(15, Math.max(1, lunarDay));
  const fraction =
    phase === "Waxing" ? day / 15 : 1 - day / 15;
  // Ellipse squish factor |cos(p)| where fraction = (1 - cos(p)) / 2
  const squish = Math.abs(2 * fraction - 1);
  const gibbous = fraction > 0.5;
  const r = size / 2;
  const litRight = phase === "Waxing";

  return (
    <View
      accessible
      accessibilityLabel={`Moon, ${phase.toLowerCase()} lunar day ${day}`}
      style={[
        styles.disc,
        {
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: colors.moonShade,
        },
      ]}
    >
      {/* Lit half */}
      <View
        style={[
          styles.half,
          { backgroundColor: LIT, width: r, height: size },
          litRight ? { right: 0 } : { left: 0 },
        ]}
      />
      {/* Terminator ellipse — dark reveals crescent, lit reveals gibbous */}
      {fraction > 0 && fraction < 1 ? (
        <View
          style={[
            styles.ellipse,
            {
              width: size,
              height: size,
              borderRadius: r,
              backgroundColor: gibbous ? LIT : colors.moonShade,
              transform: [{ scaleX: squish }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

/** Parse "Lunar day 11 · Waxing" into glyph inputs. */
export function parsePrimaryForMoon(primary: string | null): {
  lunarDay: number;
  phase: "Waxing" | "Waning";
} | null {
  if (!primary) return null;
  const dayMatch = primary.match(/(\d+)/);
  if (!dayMatch) return null;
  const lunarDay = Number(dayMatch[1]);
  if (!Number.isFinite(lunarDay)) return null;
  const phase = primary.includes("Waning") ? "Waning" : "Waxing";
  return { lunarDay, phase };
}

const styles = StyleSheet.create({
  disc: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(20, 27, 36, 0.08)",
  },
  half: {
    position: "absolute",
    top: 0,
  },
  ellipse: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
