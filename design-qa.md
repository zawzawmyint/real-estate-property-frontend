# Agency dashboard design QA

Date: 2026-10-29. Final result: **passed**.

## Findings

No remaining P0, P1 or P2 findings. The approved three-card mockup was intentionally adapted to four cards at the user's request by adding Total leads. Existing navigation, brand assets and application components remain authoritative.

Resolved during visual review: metric numerals increased to 48px; pipeline tick labels increased to 12px; category spacing produces readable bars; stage count labels reserve two lines so their values align.

Optional P3: the compact Refresh button could use slightly more icon-to-text spacing in a future polish pass. It remains readable, keyboard accessible and consistent with the current button primitive.

## Evidence and comparison

- Compared the approved Avenor mockup with the actual 1440×1024 desktop capture with expanded 240px sidebar, plus the 390px mobile full-page capture. Captures are saved in the local workspace output folder, `outputs/dashboard/desktop.png` and `outputs/dashboard/mobile.png`; they are verification artifacts, not application dependencies.
- Desktop and mobile capture tests in [dashboard.spec.ts](tests/e2e/dashboard.spec.ts) assert exact real-backend totals and no browser console/page errors. The final dashboard run passed all 16 desktop/mobile cases with no skips or failures.
- The 360px keyboard/reduced-motion case verifies no horizontal document overflow. Error/retry tests wait for hydration before keyboard focus, preserving the intended initially disabled control behavior.
- Actual fixture values are 10 total, 3 weekly, 2 Won and 20.0% conversion; different mockup sample numbers are intentional. Source/stage totals agree with the metrics. Timestamp and containing week are displayed in Dubai time.

## Required fidelity surfaces

- **Fonts and typography:** existing Poppins application typography and Avenor brand treatment are retained. Metric figures have clear emphasis, labels remain readable, and long stage names wrap without truncation. Desktop and mobile images were inspected at full-view and chart/metric detail level.
- **Spacing and layout rhythm:** four equal desktop cards, two chart columns and a stacked narrow layout preserve the approved hierarchy. Shared PageHeader/Card spacing and restrained rounded borders avoid nested decoration. Count values align even where stage labels wrap.
- **Colors and tokens:** warm ivory `#FAF8F5`, charcoal `#252329`, maroon `#701F35`, white cards and the existing border token match the chosen direction. Counts and labels provide meaning independently of color.
- **Image quality and assets:** the existing vector brand and application icons are reused. Charts are actual Recharts visualizations of authenticated aggregate data. No flattened mockup, imitation image asset or decorative placeholder is used in the product.
- **Copy and content:** metric periods, current-stage conversion definition, role scope, empty states and generated timestamp are explicit. Agents receive My overview and their current assignments; privileged staff receive Agency overview. The extra Total leads card provides context for the ratio.

## Interaction and reliability

Refresh/retry, loading, zero counts, source/stage text alternatives, current ownership changes and expired sessions are covered by the passing dashboard browser cases. Backend aggregation and frontend runtime DTO validation keep private records and malformed data out of the chart boundary.

The broader legacy parallel runs had development rebuild/navigation timing and account sign-in-budget failures; all 234 active legacy cases have passing evidence across those runs, and the corrected actual-session-revocation case passed six focused repetitions. A single clean full legacy run is not claimed. These limitations are separate from the final clean 16-case dashboard acceptance run.

## Implementation checklist

- [x] Approved visual hierarchy adapted to four cards.
- [x] Desktop/mobile captures inspected, including chart labels and count alignment.
- [x] Semantic tokens, existing assets and accessible text alternatives retained.
- [x] Loading, empty, failure, keyboard retry and expired-session behavior verified.
- [x] Final dashboard browser run passed; wider regression evidence and limitations recorded.

# Public homepage redesign — 2026-10-30

The cinematic-maroon homepage has its own [visual QA report](specs/public-homepage-redesign/design-qa.md). Its visual result is passed; detailed integration evidence and any remaining release limits belong in the feature specification. The preceding dashboard report is preserved as historical evidence.
