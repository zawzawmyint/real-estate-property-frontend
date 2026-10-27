# Public contact and agent pages

Status: Verified — demo delivery accepted 2026-10-27; real-business publication remains gated.

## Goal

Complete the public discovery journey with a trustworthy agency contact page, an agents directory and individual public profiles, using a consistent Avenor design. Visitors can send a property enquiry without selecting a listing and staff can follow it up through the existing CRM. This specifies roadmap P1-17; it does not complete P1-14 or the wider P1-18 mobile scope.

## Scope

Included:

- `/contact`, `/agents` and `/agents/[slug]`, with public header, mobile-menu and footer navigation.
- Agency phone, public email, office address, published opening hours and an optional external map link, when configured.
- A working property-enquiry form on Contact. The user confirmed on 2026-10-27 that submissions must become CRM leads.
- A small, curated directory of up to 24 published profiles, individual biographies, languages, specialties and approved public contact channels.
- Professional responsive composition, real content hierarchy, image fallbacks, keyboard operation, loading/empty/error/success states and page metadata.
- Explicit fictional demo disclosure until approved real content is supplied.

Excluded: CRM profile/contact-content editors; staff-account changes; automatic agent assignment; agent-to-property relationships or agent-specific listing counts; appointments; a new email/WhatsApp delivery service; automatic replies; customer accounts; ratings/testimonials; multilingual UI; new dependencies; a redesigned homepage. Phone/email links open the visitor's own application and do not claim a CRM submission.

## User flow

1. Find **Our agents** and **Contact** beside Buy/Rent in the public header and mobile drawer; footer links provide the same destinations. Agent detail keeps Our agents active. Preserve Buy/Rent selection and existing menu dismissal/focus behavior.
2. `/agents` introduces the team and displays published profiles alphabetically. Each card opens its own profile. A genuine empty directory shows an explanatory empty state and a Contact link; a failed read shows a distinct retry state.
3. `/agents/[slug]` displays a portrait, name, public job title, biography, specialties and languages. Configured public phone/email links contact that person directly; otherwise show an explicitly labelled agency contact fallback. **Send a property enquiry** links to `/contact` and makes no promise of assignment to that agent. **Browse properties** links to the existing public collection.
4. `/contact` pairs useful contact information with the form. A visitor supplies a name, Buy/Rent intent, at least one contact method and a message. On a committed save, replace the form with a clear receipt: **Your enquiry has been received. Our team will follow up using the details you provided.** Offer a deliberate **Send another enquiry** action.
5. Admin/Manager see the new unassigned Website/New lead with the submitted purpose/message and no property. They assign it using existing controls; only the assigned Agent can then access it. No viewing or automatic communication is created.

The form must preserve entered values on errors, prevent overlapping submissions and retain one submission ID for an uncertain outcome. An uncertain save offers an explicit retry of the unchanged submission; no background mutation retry or success message is permitted. A changed submission is a deliberate new attempt, with the possibility of a second lead explained before proceeding. A 429 shows Retry-After feedback and keeps the values.

## Contracts and access

The repository-local [contract snapshot](../../docs/contracts/public-contact-and-agents.md) mirrors the backend-owned `backend/specs/public-contact-and-agents/contract.md`. The endpoints below are implemented:

- `GET /api/v1/public/agency`: public agency identity, contact channels, hours and demo flag.
- `GET /api/v1/public/agents`: bounded published profile summaries.
- `GET /api/v1/public/agents/:slug`: published public profile or 404.
- `POST /api/v1/public/inquiries`: property-independent enquiry, returning only `{ received: true }` after commit or identical replay.

The form sends `{ submissionId, name, purpose, phone?, email?, message }`. Display Buy/Rent while sending the existing `sale`/`rent` values. Name is 1–120 characters; message is required, 1–2000; phone/email use existing lead-validation rules and at least one is required. No public property picker, budget, source, stage, assignee or staff identifier is accepted in this slice.

Initial reads use server-only transport through the existing API boundary. The form calls the feature-owned `sendAgencyInquiry` Server Action in Leads, using trusted inquiry-relay headers, safe mutation results and receipt conventions. Browser reconciliation/explicit retry stays within the existing same-origin boundaries. Express validates and authorizes independently. Backend OpenAPI, frontend snapshots and generated declarations are synchronized; the delivered property-inquiry API remains unchanged.

Public profiles are an independent, backend-owned editorial catalog, not projections of Better Auth users. Never publish login email/image, internal role, User ID, owner contacts, lead data or private notes. The catalog explicitly approves public contact fields and publication. A source change plus deployment publishes/withdraws content; this delivery has no live content editor or automatic synchronization with staff lifecycle.

Curated portraits are public website assets under `public/images/agents/`, referenced by allowlisted local paths in the contract. This is not an upload workflow or private-document storage. Keep backend content and frontend portrait assets coordinated without cross-repository imports.

## Design

### Shared direction

Extend the existing maroon `#701F35`, ivory `#FAF8F5`, charcoal `#252329` and semantic tokens. Use Lora for public display headlines and Poppins for body/UI text. Reuse `.public-container` (1264px maximum; 16px mobile and 32px wider gutters), `PublicSectionHeader`, Brand, Button/link variants, labelled fields, Alert, Skeleton and the existing navigation drawer. Avoid a second component system, decorative dashboards, carousels and unnecessary animation.

Use generous but purposeful spacing: approximately 48–80px between desktop sections and 32–48px on mobile; 16–24px card gaps; restrained 1px borders and existing rounded corners. Display headings scale roughly 36–56px, body text remains 16px with comfortable line height, and supporting text remains readable at 14px. Reflow rather than truncate meaningful names or biographies.

### Contact composition

- Intro: a small **CONTACT AVENOR** eyebrow, a clear editorial headline, and one short sentence describing buying/renting enquiries. No fabricated response-time guarantee.
- Desktop: a roughly 5:7 two-column composition. Left: agency contact methods, address and hours grouped by purpose; right: a white enquiry card with a clear heading and concise supporting text. Both align at the top. Below, an office panel offers the actual address and **Open map** link if available. Do not embed a third-party map or display an invented location.
- Mobile: one column, with concise contact links followed immediately by the form; put detailed hours/office information afterwards so the form is reachable without excessive scrolling. No fixed bottom bar obscuring inputs.
- Collapse absent contact rows and omit an unavailable office panel. If no direct contact channels are configured, let the enquiry card use the main content width with clear demo/missing-information copy instead of leaving an empty column.
- Form: Full name, **I'm looking to** (Buy/Rent), phone, email and message. Phone/email can share a row on wider screens; all controls stack at narrow widths. When agency mode is known, explain **Enter a phone number or email so we can reply.** When mode is unknown, use **Enter a phone number or email to submit your enquiry.** Include approved privacy/usage wording and the explicit **Send enquiry** submit label. Show **Sending enquiry…** with existing pending feedback. Required fields and field errors have associated labels/descriptions; submission feedback uses Alert and a focusable summary/receipt.
- A successful form is a receipt state, not a cleared unexplained form or a transient toast. Failure and uncertain states retain values and explain the next action. Direct phone/email actions are visually secondary to the form.

### Agents directory

- A quiet editorial intro: **Meet the people behind your next move.** Follow with short agency-approved copy and a clear Contact action.
- Three-column cards at large widths, two at tablet widths and one on mobile. Use consistent 4:5 portrait crops, preferably at least 600×750 source pixels, a calm background and a coordinated photographic treatment. Reserve image dimensions to prevent layout shifts.
- Each card has name, public job title, up to two specialty highlights and **View profile**. The name and action use the same destination without nested interactive controls. Avoid inventing years of experience, sales totals, verified badges or ratings. No filter bar is needed for the initial small team.
- Missing/failed portraits show a static initials/silhouette fallback with the person's name retained in text. Portrait alt text is descriptive and concise; decorative duplicates use empty alt text. Loading cards preserve the final proportions.

### Agent profile

- **Our agents / Name** breadcrumb and a two-column hero: a substantial 4:5 portrait on the left and name, title, brief introduction and contact actions on the right. On mobile, retain name/role before the portrait and place actions in normal flow.
- Below: **About [first name]**, specialties and spoken languages, using text and restrained chips. Use a compact agency-support contact panel for the next action; no fake sales statistics or testimonials.
- Do not display **[Agent]'s properties** or **View listings by this agent**: the current Property model has no agent relationship. **Browse properties** leads to the agency collection and is labelled accordingly.
- Unknown/unpublished slug gets a real not-found response with links to Our agents and Contact. A backend outage offers retry and is never represented as an unknown person.

### Responsive, accessible and resilient states

Verify 320, 390, 768 and 1440px, 200% text enlargement, visible focus, sufficient token-based contrast, 44px touch targets, logical heading order and keyboard-only navigation. Respect reduced motion. Empty results, unavailable content, portrait failure and form failures have distinct designs. Keep page introductions/navigation outside independently loading regions where practical. Phone/email/map actions appear only for configured usable values; missing contact information is never replaced with an actionable fake number/address.

Use unique page titles/descriptions. Public real-content profiles may be indexed; when the catalog is marked demo, all three new page types use noindex. Canonicals depend on an operator-provided site origin; do not invent production domains or publish structured business facts that are not supplied.

## Acceptance criteria

- [x] Contact, directory and profile routes are reachable from desktop/mobile navigation and footer, with correct active state and preserved menu focus/dismissal.
- [x] Contact shows configured information and a working property-independent form; required intent/contact/message validation, duplicate prevention, 429 feedback, uncertain retries and success receipts work.
- [x] A committed submission creates exactly one Website/New/unassigned CRM lead, a created activity and a receipt atomically; submitted purpose/message are retained and property is null.
- [x] Admin/Manager can assign the enquiry through the existing workflow; Agent access remains limited to current own leads. Existing property enquiries and staff lead flows regress cleanly.
- [x] Only explicitly published public catalog fields appear in directory, profile, metadata and responses; unknown/unpublished slugs return 404 without exposing staff/private data.
- [x] Directory/profile content, portrait fallbacks, empty/loading/error states, public contact actions and demo labels match the compositions above.
- [x] New pages pass the four viewport checks, text enlargement, image layout stability and reduced-motion review. Targeted desktop/mobile form states verify keyboard/focus behavior and accessible names; no manual screen-reader session is claimed.
- [x] Both repositories' quality gates, contract generation/drift checks and cross-repository browser tests pass before P1-17 is marked verified.

## Real-business publication readiness

- [ ] Approved real contact details, address/hours, public profile/portrait approval and live inquiry usage wording are required before replacing the explicitly fictional demo catalog. This is an operational publication gate, not part of the verified demo delivery.

## Review remediation — 2026-10-27

The approved review fixes normalize all JavaScript whitespace in phone strings to ordinary spaces before trimming and validating the existing 3–40 character, phone-character and digit rules. Apply the same policy to browser form schemas, Server Action inputs, Express inputs and public catalog phones; preserve normalized receipt hashing and stored contact values. This remediation adds no dependencies, environment variables or migrations.

When catalog loading fails, preserve unknown demo/live mode and the writable form, while clearly stating that agency details and mode cannot be confirmed, suggesting retry before providing personal contact details, and asking visitors testing a demonstration to use fictional details. Unknown-mode usage/receipt copy must not promise follow-up or pretend the agency is definitely a demo.

- [x] Normal and Unicode-spaced phone submissions normalize identically through the frontend and backend, including safe replay.
- [x] Unknown-mode caution and neutral usage/receipt wording are verified without regressing known demo/live wording.
- [x] Phone controls preserve the full pasted value; length validation applies after canonicalization, with no raw maxlength truncation.
- [x] Agency-details recovery preserves entered values, uncertain submission identity and saved receipt state until an explicit new-enquiry action.
- [x] Public phone contracts and generated snapshots match runtime validation; root delivery status is consistent.
- [x] Review fixes pass affected quality gates and cross-repository browser checks.

## Validation

Backend integration: allowlisted public projection; published/unpublished/invalid slug; bounded stable directory; valid Buy/Rent enquiries; missing/invalid contact/message; client-assignee/source/property injection; same-key replay; changed-payload/cross-operation receipt conflict; concurrent duplicate requests; one atomic activity/receipt; shared public inquiry rate budget and safe errors.

Frontend/browser: complete desktop/mobile navigation; directory → profile → Contact; portrait failure; empty/outage/404 distinctions; visible labels; keyboard/focus and reduced motion; submit → manager inbox → assignment → Agent visibility; held request/double submit; 429; failed/lost response and explicit retry without duplicate lead; invalid input preserved; all four widths and enlarged text. Inspect real screenshots of all three page types and key form states.

Run each affected repository's required lint, formatting, typecheck, unit/integration tests and build, plus API generation/drift and the full desktop/mobile regression. Add tests that exercise behavior rather than merely assert source markup. Reconcile specs and shared docs after evidence is available.

## Rollout and risks

**Recommended approach:** backend-owned curated public content plus existing lead persistence. This gives an independently reviewable public feature without adding a content-management UI or staff-to-property relationship. Database-backed profile editing was considered but adds permissions, persistence, upload and editing workflows outside P1-17; frontend-only hardcoded profiles were considered but duplicate business content outside the existing backend ownership boundary.

The new inquiry route is additive; existing property-inquiry payloads and responses stay compatible. No database migration was needed because Lead already supports null property, required sale/rent purpose and originalMessage, and receipt operation is stored as text. Removing the new routes/navigation can roll back the public UI while retaining any already-created leads.

No new dependency, third-party map script, email provider or environment variable was introduced. Keep existing inquiry-relay deployment requirements and single-process limiter limitations visible. Catalog changes require coordinated deployment of any new portrait assets. Supply actual approved content before claiming real agency details; do not fill missing facts with invented credentials or live contact channels.

## Implementation evidence

Verified demo evidence: backend `bun run check` passed with 90 tests in 22 files and a production build; frontend API drift, lint, formatting, typecheck and 166 unit tests in 31 files passed; an isolated frontend production Webpack build passed. The final isolated sequential browser suite passed 161 tests with 7 intentional project-specific skips (168 total). A focused desktop/mobile Contact receipt and validation-summary focus fixture passed 4/4 after the final focus adjustment. Browser coverage includes enquiry creation through Manager assignment and Agent visibility, retry/deduplication, held writes, edit-as-new confirmation, cooldown feedback, routes, 404/503 distinction, portrait fallbacks, accessible names/focus, keyboard navigation, 320/390/768/1440 layouts, 200% text and reduced motion. Desktop and mobile screenshots of all three pages were visually reviewed with the delivered portraits loaded. Runtime inspection of the active profile page reported no configuration or session errors. Real-business publication inputs remain unapproved.

Review-remediation evidence: frontend API drift, lint, formatting, typecheck, 199 unit tests in 34 files and an isolated production Webpack build passed. The focused regression cases that previously exposed pasted-phone truncation and loss of a saved receipt after recovery now pass (3 passed; one intentional mobile/global-fault skip); unknown-mode copy regressions pass (3). Backend `bun run check` passed with 94 tests in 23 files, including lint, formatting, TypeScript and production build checks; 60 auth-body transport stress executions passed with no failures. The full browser run reported 163 passed, 8 intentional skips and one pointer-cancel test synchronization failure. After correcting the test to wait for settled drop-animation geometry and verify an active drag before Escape, that case passed three consecutive isolated reruns. All 164 applicable browser cases are covered across these runs; a single clean full-suite rerun is not claimed.
