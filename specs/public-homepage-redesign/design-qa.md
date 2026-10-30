# Cinematic maroon homepage visual QA

Date: 2026-10-30. Visual result: passed after the annotation follow-up below. Broader integration evidence is recorded separately in the feature specification.

## Evidence and normalization

- Source: [selected reference](reference.png), latest refinement option 3, 819 × 1920 pixels.
- Implementation: desktop 1440 × 900 CSS viewport, full page 1440 × 3345 capture; mobile 390px full page and 320px viewport matrix; original running homepage also inspected in the in-app browser, including the mobile drawer.
- Browser-test images live in workspace `.delivery-work/homepage-redesign/results/`; comparison and normal-preview images live in `outputs/homepage-redesign/`. They are verification artifacts, not product assets.
- Compared source and implementation at equal normalized widths with aspect ratios preserved. No device frame or browser chrome in the comparison. Differences in page height are expected from real listing titles, required demo disclosures, visible labels and both budget bounds.

## Required fidelity surfaces

- **Typography:** existing Lora display and Poppins body fonts preserve the reference identity; header, hero, section headings and property titles have distinct readable hierarchy. Real titles wrap without clipping. Required labels replace the mockup's abbreviated controls.
- **Spacing and layout:** maroon overlay hero and inset light search dock, one-large/two-stacked property composition, quiet four-type row, three rectangular community tiles, light image/copy guidance and expanded charcoal footer follow the selected order and rhythm. Buy/Rent occupies its own dock row; the desktop inputs/action share a 48px baseline. Supporting-card titles/prices stack, and the three-record lead photo grows with the paired cards rather than forcing a fixed height. On mobile the copy, photo and search stack in normal flow. The initial desktop search fits within 1440 × 900.
- **Colors:** brand maroon/ivory/charcoal are preserved. Solid-surface measured contrast ratios: ivory/maroon 10.23:1, ivory/charcoal 14.66:1, muted body/ivory 5.65:1. Hero and community image text sit over darkened image areas; mobile hero text uses a solid dark surface. Focus and mobile drawer were inspected in the browser. This is targeted evidence, not a full WCAG certification.
- **Image quality:** five individually generated/optimized photographs are placed in the intended hero/community/guidance slots; correct intrinsic dimensions and eager-hero/lazy-below-fold loading are explicit. Live listing images remain backend-owned. Test-created color-block property photos are fixture content, not missing decorative assets.
- **Copy and content:** working public destinations replace unsupported mockup links. Budget keeps independently labelled min/max fields and sale/annual-rent units. Existing demo disclosures, Contact guidance path and Staff sign-in remain. No fabricated business metrics, contact details or social links were introduced.

## Resolved findings

- Desktop featured loading now reserves the asymmetric grid geometry and shares its heading with the resolved state.
- Mobile hero now stacks in flow rather than keeping the desktop overlay composition.
- Budget bounds now have a visible, accessible Budget (AED) group.
- Decorative image dimensions and provenance are documented correctly.

## Annotation follow-up

The earlier review missed a 21.25px search-control baseline difference and an unbalanced featured-card detail edge. The correction keeps the visible Budget (AED) group while preserving accessible independent bounds, moves Buy/Rent to its own row, uses uniform 48px desktop controls and separates supporting-card title/price rows. With three records, the lead card now derives its photo growth from the paired cards; one- and two-record states use explicit rows, and the loading lead retains its flex-column geometry.

At normal-browser 1480 × 808, all five dock controls have identical y-position and 48px height; the lead and third-card content bottoms agree within 0.001px. `outputs/homepage-alignment/search-repaired.png` and `outputs/homepage-alignment/repaired-sections.png` record the repair. The focused 38-case suite passed 26 cases with 12 intentional skips and no failures; after the final one/two-row refinement, all seven dedicated desktop alignment/state cases passed. Those cases cover 1480/1196/1024 geometry, the loading skeleton, 0/1/2/3-record states across the width matrix, and failure retry. Constituent quality gates, 271 unit tests and the isolated production build passed. Normal port 3100 in-app-browser inspection independently confirmed the measured alignment, with empty runtime configuration/session errors and homepage page metadata present.

## Accepted adaptations and remaining polish

- Individual photographs and live property details differ from the generated composition; this preserves honest inventory and independent assets.
- Search is taller than the mockup because labels and both price bounds remain visible. The desktop initial-viewport criterion still passes.
- Guidance retains the existing Contact link alongside Meet our agents. Footer retains Staff sign-in. Both are required existing journeys.
- No unresolved P0/P1/P2 visual findings after the annotation repair. Future photography/copy substitutions are ordinary editorial refinements, not blockers.

## Implementation checklist

- [x] Full-page and focused hero/search/mobile-menu evidence inspected.
- [x] Source and implementation compared together with width normalization.
- [x] Typography, spacing, color, image quality and content checked.
- [x] Review's mobile, Budget, loading geometry and provenance findings resolved.
- [x] Mobile stacking and desktop initial search geometry verified by browser assertions.

final result: passed
