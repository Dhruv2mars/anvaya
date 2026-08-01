# DESIGN.md

## Scene
Morning check-in after coffee — cool mist desk light, one warm crimson mark. Not temple gold, not purple SaaS, not cream editorial, not dark-by-default.

## Color (restrained)
- bg `#EAEFF3` / deep wash `#DCE4EB`
- surface `#FFFFFF`
- ink `#141B24`
- accent `#C43B2E` (≤10%), deep `#A93224`, soft `#F6E4E1`
- marks wash `#E3EBF1` / warm `#F3E8E5`
- sun `#D96A3E`, moon shade `#C7D2DC` (hero glyph only)

## Type
- Display / day marks / page titles: Fraunces (Today 52/56, pages 40/46, marks 26/32)
- UI: Manrope; eyebrows uppercase 11 bold, tracking 1.4
- Numerals in data contexts: tabular-nums

## Surfaces
- Radius 16–24, `borderCurve: 'continuous'`; elevation via CSS `boxShadow` (tokens: elevation.card/raised/float) — never legacy shadow props
- Cards only where they hold content or interaction; hairline separators for editorial lists (history rows, measure rows)
- Atmosphere: cool vertical wash + warm bloom top-right (alpha stops in-hue — never fade to "transparent" black)

## Motion & feel
- Pressables: spring-scale (snappy), feedback on touch-down, opacity 0.94; honors Reduce Motion
- Rating: spring fill + pop ring; light haptic on commit; day nav arrows: selection haptic
- Entrances: focus-driven soft rise (280ms ease-out) — not mount choreographed (native tabs pre-mount screens)
- Scroll: top scroll-edge fade dissolves content under status bar; no hard dividers
- No page-load choreography; 140–280ms total

## Touch
- All targets ≥44pt; disabled states ≥0.35 opacity + transparent fill

## Navigation
- Native tabs (`expo-router/unstable-native-tabs`): SF Symbols on iOS (liquid glass, minimize on scroll), Material Symbols + rose indicator on Android; accent tint `#C43B2E`
- Web keeps JS Tabs fallback (`_layout.web.tsx`)

## Layout
Today is the product. One column: brand, day nav (eyebrow date + Fraunces title + "Back to today" pill), day-marks hero (moon glyph, horizon rule, sunrise), ratings (segmented notch strips), note card. Tabs: Today · History · Measures · Settings.
