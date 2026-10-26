# Separate CRM property details and editing

Status: Verified on 2026-10-23.

## Goal

Give staff an unambiguous CRM View details destination, separate from editing and the public listing.

## Scope

- Add `/crm/properties/[id]` as the authenticated read-only detail page for all staff roles.
- Inventory title and View details links open this route. Admin/Manager also receive an explicit Edit link to `/crm/properties/[id]/edit`.
- Public links are labelled View public listing and remain available only for published, available listings.
- Agent visits to the former `/edit` detail destination redirect to the canonical CRM detail route. Admin/Manager retain the existing editor and save/navigation behavior.
- Reuse the current CRM read-only presentation, with an Agent-only read-only notice and Admin/Manager-only owner details. No public page redesign, API change, permission expansion, schema change or mutation refactor.

## User flow

Staff open inventory, select a property title or View details, and remain in the CRM shell. The detail page shows saved facts, lifecycle state, description and photos without form inputs. Authorized staff can choose Edit property and return with Back to details. View public listing explicitly leaves the CRM for `/properties/[id]`. Draft/archived/unavailable properties remain viewable internally without a public-link promise.

## Contracts and access

Use the existing live staff session guard and staff detail API. Express remains authoritative for role-specific DTOs and mutations. Agent HTML/props must omit owner data; Admin/Manager detail may display existing permitted owner fields. Anonymous access redirects to login and expired API sessions redirect to login. A missing staff property returns 404 from the API and the CRM route renders the standard not-found UI through `notFound()`; because the CRM page is streamed, do not depend on its document response status being 404. Public detail remains unchanged and excludes owner data.

## Design

Reuse CRM cards, semantic tokens, existing buttons/links, the read-only presentation and responsive photo grid. Use distinct labels View details, Edit, Edit property and View public listing. Detail is a read-only screen for every role; only authorized staff receive editor navigation.

## Acceptance criteria

- [x] Inventory titles and View details lead to `/crm/properties/[id]` on desktop/mobile for all staff.
- [x] Admin/Manager can navigate between details and edit; Agent sees no editor link and old edit URLs redirect to details.
- [x] CRM details preserve saved facts and states, omit mutation controls and respect owner-field permissions.
- [x] Public links are explicitly labelled and eligibility-gated; public layout and routes remain unchanged.
- [x] Anonymous access redirects to login; a missing staff-property API read returns 404 and the CRM route shows the standard not-found UI. Quality checks and real desktop/mobile navigation/permission regressions pass.
- [x] Relevant feature specs and architecture references reflect the route distinction without changing roadmap completion status.

## Validation

Unit regressions cover inventory destinations, the explicit public-link eligibility gate and owner-safe read-only rendering. Browser coverage against the disposable backend covers canonical Agent details/redirects, Admin/Manager detail/edit/public navigation, anonymous access and missing-resource behavior. The global warmup compiles the canonical detail route before parallel browser work. The full browser suite passed before the identical static-wrapper extraction; afterward, the frontend quality gate and targeted desktop/mobile browser regressions passed. Desktop and mobile screenshots were inspected.

## Rollout and risks

Existing editor URLs remain valid for editors; Agent bookmarks redirect compatibly. Frontend links do not grant API permission. Verify no private owner content appears for Agent/public responses. No backend migration or API deployment needed. Restore the prior frontend route/link changes to roll back.

## Implementation evidence

On 2026-10-23, `bun run check` passed after the static-wrapper extraction: API drift, lint, formatting, typecheck, 82 unit tests in 13 files and the production build. Before that identical wrapper move, the fresh disposable-backend Playwright suite passed all 50 desktop/mobile checks in about 1.7 minutes. After the extraction, the targeted desktop/mobile browser set passed all 10 checks in 44.6 seconds. Together, that coverage verifies that Admin and Manager can use separate details, edit and public-listing pages; that Agents receive an owner-safe staff API DTO, are redirected from `/edit` to canonical details and cannot mutate; and that an anonymous detail request redirects to login while a missing staff-property API read returns 404 and the route renders not-found UI. Desktop and mobile CRM-detail screenshots were inspected. Runtime project identity was verified and earlier edit-session diagnostics were clean; no clean DevTools capture was recorded for the active canonical detail runtime session.
