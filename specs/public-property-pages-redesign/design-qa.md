# Public property pages design QA

Date: 2026-11-02

final result: passed

## Scope and reference

- Listings source: [latest architectural-linework refinement](listings-reference.png).
- Details source: right-hand page only of [original option 1](detail-reference-pair.png).
- Reviewed implemented listings at 1440px and 320px and details at 1440px and 390px, with automated geometry sweeps covering intermediate widths. Visual approval is distinct from functional regression and native browser zoom evidence recorded in the feature spec.

## Evidence and comparison method

Workspace captures are retained under `outputs/property-pages-redesign/` at the workspace root: `listings-desktop.png`, `listings-mobile.png`, `details-desktop.png`, `details-mobile.png`, `listings-comparison.png`, `details-comparison.png`, `detail-refinement-desktop.png`, and `detail-refinement-mobile.png`.

Both comparison images were opened and reviewed together with their source targets. Each comparison places source on the left and implementation on the right, normalized to 720px width per page. The detail source is cropped to the selected right-hand page before normalization. Listings implementation comes from the isolated integration preview at 1440px; detail captures come from the identified normal development checkout at 1440px/390px. They are full-page captures, not viewport-height matches or pixel-identical inventory comparisons.

The sources contain illustrative inventory and generated controls. The implementation deliberately uses actual API demo records, accurate disclosures and existing component typography. Photo counts/content, description lengths and document heights differ. No claim of identical listing data, photography or page length is made.

## Findings

- No unresolved P0/P1/P2 visual findings in the reviewed scope.
- Listings retains the horizontal photo/content arrangement, separate maroon price/title rows, outlined navigation and quiet architectural heading without a photo banner or circles.
- Search uses explicit labels, independent numeric AED bounds and one results-toolbar sort. Extra generated sort/preset controls and unsupported listing paragraphs are omitted as specified.
- Detail retains a dominant cover and actual supporting images, with the sale/rent badge on the cover and a dark camera-labelled photo action. It has a strong title/price hierarchy, icon-led summary facts, supported two-column property details and a desktop inquiry card. Mobile flows the gallery, content and inquiry form without overlap, clipped submission controls or an internal inquiry-card scrollbar.
- Existing header/footer remain consistent with the delivered homepage. The larger existing closing footer and demo notices are intentional differences from the generated mockups.
- Supporting gallery layouts use only available photos; one-to-five-photo geometry and dialog/focus behavior are covered by the dedicated browser suite. Full inventory and inquiry acceptance is recorded separately in the feature specification.

## Iterations and limits

The task review corrected listing link accessible names to include the visible words “View property”; the follow-up focused browser suite passed. No visual P0/P1/P2 repair was required after the combined source/implementation comparisons. Low-priority future visual changes should be treated as a new iteration, not evidence that optional unsupported mockup features exist.

### Browser annotation refinement

The reviewed follow-up uses the separately generated decorative facade asset as a large, intentionally cropped backdrop; it is not a cropped mockup or inventory image. The full-width blush banner reaches the public header, fades to the page background at its base, and keeps text container-aligned. The 70%-wide desktop artwork fills the banner height and uses reduced opacity plus intersecting left/bottom masks, so it has no floating baseline or hard clipped bottom; it is closer to the approved cropped reference than the superseded complete-facade treatment. The visually redundant Budget (AED) heading is hidden while its accessible group name and both visible price labels remain. The reviewed overwritten `refined-header.png`, `refined-hover.png`, and `sliding-hover.png` captures confirm the corrected backdrop, no abrupt banner edge, scope fit and legibility. The superseded background-position treatment is replaced by a clipped gradient layer that visibly translates in from the left over 360ms on hover/focus for public-primary and otherwise-unfilled outline actions; both retain white text over the dark diagonal `#4e1625` to `#701f35` gradient. Reduced motion has no transition. No P0/P1/P2 finding resulted; this visual approval does not establish native 200% browser zoom.

Normal development captures include the Next development indicator. It is disabled by the existing test-run configuration and is not production UI. Native browser zoom is a separate verification item, not inferred from screenshots or CSS zoom.

### Detail refinement

The final detail refinement removes the card's repeated property title/location and uses the page's normal scroll flow to reach the complete inquiry form. It adds only API-supported Property details: property type, location, bedrooms, bathrooms and property size. Furnishing and previous/next-property navigation remain intentionally absent.

The review opened `detail-refinement-desktop.png` and `detail-refinement-mobile.png` against the selected right-hand reference. The visual result preserves the dominant gallery and inquiry hierarchy while making the facts section and camera action clearer. Automated coverage additionally verified sale and rent overlays, one-to-five-photo gallery geometry, keyboard focus restoration after the Base UI focus guard settles, long content, error feedback, inquiry receipt recovery and narrow layouts. No new visual P0/P1/P2 finding resulted. The native 200% browser-zoom limitation remains outside this approval.
