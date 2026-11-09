# CRM property matching (P2-03)

Status: Verified 2026-11-09

## Goal

Help staff find available listings for a lead while following up, whether the lead came from a general inquiry, a property inquiry, or manual entry.

## Scope

- Search from the existing CRM lead detail page using Buy/Rent, maximum budget, area, property type, and exact bedroom count.
- Prefill Buy/Rent and maximum budget from the lead. Staff enter any criteria that only appear in the inquiry message. Filter edits are local to the search.
- Automatic extraction from inquiry text, saved extra preferences, ranking by AI, shortlists, and automated outreach are follow-ups outside this draft.

## User flow

1. From a lead they can access, staff select **Find matching properties** alongside the budget and original property context. An inline panel opens with the saved purpose and any saved budget. Missing budget, area, type and bedrooms are optional.
2. Staff adjust filters and select **Search**. Label the cap **Maximum price (AED)** for buying and **Maximum annual rent (AED)** for renting. If staff change Buy/Rent, clear the budget input and previous results so a sale price is never carried over as annual rent or vice versa.
3. Show up to 10 available, published matches per page. Include price with its period, location, bedroom count when known, and a public listing link. Provide pagination for more results. Staff can open or copy a link to share it themselves.
4. Keep inputs on empty results or a retryable error. If lead access is lost, use the existing lead-unavailable behavior and clear the matching panel and its results.

## Contracts and access

The companion backend spec at `backend/specs/property-matching/spec.md` owns the delivered `GET /api/v1/staff/leads/{id}/property-matches` contract. The panel uses the existing staff server transport through a same-origin, no-store Next route handler and the generated leads snapshot. It sends only the lead ID and explicit filter fields. The backend checks the live session and current lead access before returning public property summaries.

## Design

Keep the form and results on the lead detail page. Reuse labelled fields, button and collection pagination patterns. Stack fields and results at narrow widths. Announce loading and result counts, associate validation with its fields, and prevent stale responses from replacing the latest search. Filters and results are temporary and are cleared when switching leads.

## Acceptance criteria

- [x] A general inquiry with no linked property can return matches. A lead with a linked property can search for alternatives.
- [x] Saved purpose and budget prefill correctly, an absent budget stays blank, and changing purpose clears the budget and old results.
- [x] An exact bedroom search distinguishes studios from unspecified bedroom counts. Rental cards show annual prices and open the matching public listing.
- [x] Empty results, failed requests and page changes preserve the submitted filters. Loss of lead access clears private lead context using the existing flow.
- [x] The feature works with keyboard navigation and a narrow mobile viewport, and searching does not change the lead or contact the customer.

## Validation

Use focused browser coverage for a general inquiry and a property-linked lead. Check a purpose change, a no-match/retry case, access loss, mobile and keyboard use. Run the frontend quality checks and the focused cross-repository browser suite.

## Rollout and risks

Deploy the additive backend route before exposing the frontend panel. The feature needs no new setting, provider or migration. Reverting the frontend entry point removes access from the UI; the backend addition can be reverted separately afterward. It is verified locally but not deployed, so it does not complete the initial Phase 2 release.

## Implementation evidence

Delivered and verified on 2026-11-09. The compact lead-detail panel pre-fills Buy/Rent and a saved maximum AED budget, keeps staff-entered area, type and exact-bedroom criteria local, and requires an explicit search. It shows available published public-listing summaries with shareable listing links, result pagination, preserved retry state and no write path.

Frontend `bun run check` passed API validation, lint, formatting, typecheck, 301 tests in 48 files and the production build. Six targeted Playwright desktop/mobile cases passed, including 320px no-overflow, general Contact and manually linked leads, annual rental pricing, explicit fields, retry without writes, public-listing navigation, purpose changes and ownership loss; desktop and mobile captures were inspected. The matching OpenAPI operation parsed with exact parity to the local generated snapshot apart from local references. An isolated authenticated browser run on port 3100 opened a fictional lead and returned the Business Bay studio with no page errors; while it was open, Next DevTools identified this frontend checkout and the active `/crm/leads/[id]` session, with empty configuration and session error lists. A restored regular local preview also returned health, the chatbot-enabled homepage and a 401 for a matching request without a staff session.
