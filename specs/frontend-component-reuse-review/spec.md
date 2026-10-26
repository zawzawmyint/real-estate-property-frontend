# Frontend component reuse and readability review

Status: Approved and verified on 2026-10-22.

## Goal

Use appropriate existing shadcn/ui primitives and keep the current frontend straightforward for humans to read without changing authentication behavior or expanding product scope.

## Scope and exclusions

- Review all current frontend routes, layout/UI components, auth feature, server transports and tests for duplicated standard UI, unnecessary abstractions, dead code and unclear responsibilities.
- Adopt official Base Nova `Empty` composition for the existing reusable agency empty-state layout and `Card`/`CardContent` for the staff login panel. Keep only the used registry exports and adapt the existing semantic palette.
- Apply concrete, independently reviewed readability fixes where they simplify current code. Preserve security-related guards, explicit validation and password-manager behavior.
- Define the frontend staff role tuple/type once in a pure auth contract module; derive session-role validation, Better Auth client field typing, display-label exhaustiveness and the browser role matrix from it. Keep the backend-owned three-role contract unchanged. Browser navigation helpers use Playwright's configured base URL rather than a hardcoded origin.
- Keep semantic native headings, links, landmarks, status announcements and simple navigation when a larger component offers no current benefit. No speculative sidebar/dialog/toast framework, new icon dependency, public-homepage redesign or agency rename.
- No backend, database, native auth protocol, permission or session-policy changes.

## Behavior and contracts

- Public `/`, staff `/login` and protected `/crm` retain their current content, navigation, heading hierarchy, desktop/mobile behavior and maroon/ivory/charcoal design.
- The login panel remains a named accessible region containing the existing h1 and form.
- The agency empty-state layout remains the single shared composition for homepage and CRM placeholders; its h2 and decorative media remain accessible and visually consistent.
- Field errors, persistent alerts and actions keep using the existing `FieldError`, `Alert` and `Button` primitives. RHF/Zod, async transitions, autofill, hydration readiness and duplicate-submit protection remain unchanged.
- There are no API/data-contract or dependency additions.

## Acceptance criteria

- [x] The current frontend has been reviewed for appropriate component reuse and human readability; concrete findings are resolved or explicitly documented.
- [x] The login panel and shared empty-state compose official registry-derived Card/Empty primitives without duplicated container styling or unused catalog scaffolding.
- [x] Existing native semantics, auth safeguards and public/protected navigation remain intact.
- [x] Frontend lint, formatting, type checks, unit tests, build and real desktop/mobile browser checks pass; screenshots are inspected for regressions.
- [x] Project guidance/specification evidence reflects the verified review without claiming new business features.

## Validation

Use the existing meaningful auth unit/browser tests to verify behavior-preserving UI changes; do not add tests that merely mirror component markup. Run `bun run check` and the isolated backend fixture browser suite. Inspect desktop/mobile homepage, login and CRM screenshots. Review concrete clean-code findings independently and verify local Markdown links after documentation reconciliation.

## Risks and rollout

Registry defaults can change spacing and heading semantics. Keep current layout classes, explicitly preserve h1/h2 and the named login region, and inspect rendered screenshots. Existing business features remain pending. No migration or deployment is required; preserve local development configuration and restore the running frontend after browser/build verification.

## Implementation evidence

- The review covered current routes, layouts, shared UI, auth client/server transport, role presentation and browser/unit tests. The UI review found Card/Empty reuse opportunities. An independent clean-code review found duplicated role definitions and a hardcoded browser origin; those findings were resolved, and a final independent audit found no remaining actionable issues.
- `src/components/ui/card.tsx` retains only `Card` and `CardContent` from the official Base Nova Card registry source. The login page composes them while retaining its named region, h1 and existing form.
- `src/components/ui/empty.tsx` retains only the official Base Nova Empty composition used by `src/components/layout/empty-state.tsx`. The wrapper remains the one shared by the homepage and CRM, with an h2 and decorative media hidden from assistive technology.
- `src/lib/auth/roles.ts` is the frontend source for the three existing staff roles. Session validation, Better Auth client typing, role-label exhaustiveness and browser role coverage derive from it; the backend-owned role contract remains Admin, Manager and Agent.
- Browser helpers navigate with Playwright's configured base URL, including manually created browser contexts. No auth handler, API, database, dependency, permission or session-policy change was made.
- Frontend lint, Prettier, Next type generation/TypeScript, 39 unit tests, the production build, and 28 desktop/mobile browser checks passed. Six homepage, login and CRM screenshots were inspected for layout and overflow regressions.
