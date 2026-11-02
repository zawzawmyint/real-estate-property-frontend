# Shared primary and secondary buttons

Status: Delivered — verified on 2026-11-02.

## Goal

Give public pages, authentication and CRM one consistent action hierarchy: solid maroon primary buttons and maroon outlined secondary buttons, both with the selected sliding dark-gradient hover/focus effect.

## Scope

- Centralize the existing listing/public hover treatment in the root stylesheet and shared Button/buttonVariants primitives.
- Apply secondary outline styling to ordinary cancel, retry, refresh, clear-filter and row actions that currently use ad-hoc or ghost styling. Preserve their handlers, accessible names and URLs.
- Support inverse contrast on existing maroon/charcoal surfaces. Preserve navigation links, tabs, calendar cells, image-gallery tiles, password visibility, drag handles and close-icon controls in their existing specialized roles.
- Keep destructive actions explicitly marked as destructive. No new package, endpoint, schema, backend, configuration or business workflow.

## User flow

Visitors and staff recognize the main action as solid maroon and supporting actions as outlines. Hover or keyboard focus slides a gradient layer in from the left, using primary darkened 30% (`#4e1625`) at the bottom-left and primary (`#701f35`), with white active text. Disabled actions remain inert; reduced motion uses immediate state changes. Submission spinners, dialog triggers and navigation feedback stay visible and reachable.

## Contracts and access

- Existing authorization, form state, pending guards, navigation and Server Actions remain unchanged. Backend contracts are unaffected.
- `buttonVariants` retains existing `default`, `outline`, `ghost`, `destructive` and size values. The optional `tone: "inverse"` is available for dark-surface callers; ordinary callers need no API change. Button consumes tone as styling, never forwards it as an HTML attribute.
- Native links continue to use `buttonVariants` for navigation. Do not replace links with mutation buttons or add nested interactive controls.
- Navigation feedback rendered from styled links must remain viewport-level; use a client body portal if the isolated/clipped button layer would trap it.

## Design

- Shared primary and secondary hooks own the sliding layer; remove duplicate public/listing selectors. Preserve the default solid primary fill and outlined transparent secondary rest state.
- Use a clipped decorative gradient pseudo-element, `translateX(-101%)` to `0` in 360ms. Keep it behind label/icon/spinner content and non-interactive. Preserve visible focus outside button boundaries.
- Secondary border/text use primary. Inverse tone uses a visible light border/text on dark surfaces, with the same dark-gradient active treatment. No dark-on-maroon outline labels.
- Preserve gallery View all photos absolute placement and opaque readability over imagery; image tiles receive no action-gradient overlay.
- Preserve selected states, action sizes, responsive wrapping and 44px targets. Avoid per-feature copies of shared action markup.

## Acceptance criteria

- [x] Public and CRM primary actions share solid primary styling and visible left-to-right gradient hover/focus.
- [x] Secondary actions share primary-colored outlines and the same active fill, including migrated ordinary supporting actions.
- [x] Inverse dark-surface actions remain readable; destructive/navigation/specialized controls retain their roles.
- [x] Disabled, reduced-motion, pending spinner and navigation-feedback states remain correct; gallery controls retain positioning.
- [x] Forms, dialogs, link navigation and relevant public/CRM workflows pass targeted regression, and required quality/build checks are recorded.

## Validation

Use real public routes and an isolated authenticated CRM fixture to inspect native links, buttons, inverse actions, dialogs and pending navigation. Verify intermediate sliding frames, keyboard focus, disabled state, reduced motion and narrow widths. Run API drift, lint, formatting, TypeScript, unit checks and an isolated production build. Preserve the existing public-property-pages native browser zoom limitation rather than claiming that unrelated check passed here.

## Rollout and risks

Frontend-only presentation maintenance on the existing feature branch. Shared styles can affect dark surfaces, absolutely positioned gallery triggers and portalled feedback; these risks were covered by focused browser checks. Reverting the scoped button changes restores the earlier styling. No roadmap business-feature completion count changes.

## Implementation evidence

The shared `Button` and `buttonVariants` implementations now provide solid primary and transparent primary-outline secondary actions across public, authentication and CRM callers. Ordinary retry, clear/reset, refresh, cancel, row and inventory actions were migrated from ad-hoc or ghost presentation. Inverse primary is light-solid and inverse secondary is light-outline; both receive a light visible focus ring. Deliberately specialized navigation, tabs, calendar cells, gallery tiles, password visibility, drag handles and close controls remain specialized, while delete actions remain destructive.

The shared `::before` layer slides from `translateX(-101%)` to `0` over 360ms using `#4e1625` to primary; reduced motion disables the transition. `NavigationPending` renders through a body portal so the clipped action layer cannot trap viewport feedback. The gallery's absolutely positioned View all control remains positioned over the image.

API drift, lint, formatting, type generation plus TypeScript, 271 unit tests in 46 files and an isolated production build passed. The isolated browser run covering button consistency, property-page redesign and loading behavior passed 10 cases with 8 intentional viewport skips and no failures. It verified intermediate movement, public/CRM primary and secondary controls, inverse focus contrast, reduced motion, gallery positioning/dialog behavior, CRM navigation and portalled pending feedback. The existing native-browser 200% zoom limitation for public property pages remains unverified and is not resolved by this maintenance.
