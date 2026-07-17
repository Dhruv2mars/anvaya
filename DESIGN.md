# DESIGN.md

## Scene
Morning check-in after coffee — cool mist desk light, one warm crimson mark. Not temple gold, not purple SaaS, not cream editorial, not dark-by-default.

## Color (restrained)
- bg `#EAEFF3` / deep wash `#DCE4EB`
- surface `#FFFFFF`
- ink `#141B24`
- accent `#C43B2E` (≤10%)
- marks wash `#E3EBF1`

## Type
- Display / day marks: Fraunces
- UI: Manrope

## Motion
140–200ms ease-out on presses; light FadeInDown on screen sections (honors Reduce Motion). No page-load choreography.

## Layout
Today is the product. One column: brand, day nav, day marks, ratings, note. Tabs: Today · History · Measures · Settings. Atmospheric gradient behind content; cards only where they hold interaction (history rows, settings blocks, measure rows).
