# Shared public application components

Status: Verified frontend presentation maintenance — 2026-10-26.

## Goal

Reuse public application UI and the existing cross-surface labelled fields so repeated presentation is maintained once without forcing public screens into CRM layouts.

## Scope

Homepage featured collection, public property listings/search and the property inquiry form. Reuse TextField, SelectField and TextareaField from components/forms/fields. Extract PublicSectionHeader, PublicSearchPanel and PropertyGrid for their confirmed existing consumers. Extend existing frontend skills and guidance after verification. No public table, contact page/form abstraction, new dependency, API, schema or business feature.

Audit: PropertyCard, PropertyImage, PropertyFilters/SearchForm and PropertyPagination already provide feature-level reuse and must remain authoritative. Homepage hero, gallery/detail title, purpose radio tabs and inline result-sort control are distinct compositions; retain them rather than adding generic switches for every public section.

## User flow

Preserve homepage featured request sharing/streaming, public filter validation/exact AED conversion, URLs/query reset, Buy/Rent radios, mobile Sheet close/apply behavior, sorting, numbered pagination, return-to-results links and property cards. Inquiry retains autofill synchronization, validation/ref focus, summary links, pending/uncertain/retry/rate-limit/unavailable/success states and stable receipt IDs. Keep responsive public visual hierarchy and existing copy.

## Contracts and access

Frontend-only presentation adoption; existing public property projection and backend-owned [lead](../../docs/contracts/leads.md) and [property](../../docs/contracts/properties.md) contracts remain unchanged. No staff/private fields or client credentials exposed. Shared layout components import no domain/API/auth modules. PropertyGrid remains in the property feature and consumes public summary DTOs. Feature code retains fetching, validation, navigation and writes.

## Design

- PublicSectionHeader in components/layout owns public heading/optional description/eyebrow/action arrangement for listing h1 and featured h2. Accept semantic level, title, optional id, description, eyebrow, actions, className. Retain display font, heading sizes, existing spacing and section aria-labelledby. Do not substitute CRM PageHeader.
- PublicSearchPanel in components/layout owns shared public card styling with the two existing hero/listing treatments. It wraps children; SearchForm retains form/fieldset/hydration/pending/URL logic. Hero placement and listing desktop visibility remain the caller's responsibility unless an explicit existing treatment owns them; preserve rendered appearance.
- PropertyGrid in features/properties/public owns grid classes and PropertyCard iteration for homepage and results. Props public property summaries and optional resultsQuery. Forward results context only for result cards; keep existing PropertyCard/media/demos unchanged.
- Use existing labelled fields for all ordinary SearchForm text/select inputs and inquiry text/textarea controls. Preserve control IDs, registration refs, native props/constraints, external budget-note references, disabled rules and field errors. Wrapper-owned help uses its canonical generated id; update its references together so contact/budget hints and errors remain associated without duplicate or dangling descriptions. Purpose radios and inline PropertySort retain specialized markup; no new field variant just for one layout.
- No new client boundaries on shared headings/grid or loss of server streaming/metadata. Existing public container/header/footer remain unchanged.

## Acceptance criteria

- [x] Listing and featured headings use PublicSectionHeader with correct semantic levels and labelled sections.
- [x] Homepage/listing search panels share PublicSearchPanel; both featured/results grids use PropertyGrid with existing cards.
- [x] Public search and inquiry use existing labelled fields; refs, errors, budget/contact hints and constraints remain associated.
- [x] Filtering, sorting, paging, streaming, mobile controls, inquiry recovery and public/private projections remain unchanged.
- [x] Responsive public presentation, keyboard access and hydration readiness pass browser verification.
- [x] Existing skills/AGENTS, spec index and architecture document real APIs and why unique public sections remain feature-owned; no roadmap completion change.

## Validation

Targeted component rendering checks for semantic heading/id/actions and grid/context/empty input. Existing shared field tests plus real public filter/inquiry browser validation verify registration and descriptions. Run frontend unit suite, lint, formatting, typecheck, API drift and isolated production build; real desktop/mobile homepage/property/lead tests and correct checkout runtime diagnostics, responsive screenshots. Verify guidance examples against actual exports; reconcile docs after verification.

## Rollout and risks

Incremental frontend-only adoption on current checkout; preserve earlier local deliveries. No new configuration or migration. Risks: changed grid return-query links, heading labels, mobile filter behavior, budget/contact hint IDs and inquiry receipts. Keep domain coordination unchanged and cover real flows; revert only this refactor if necessary.

## Implementation evidence

Verified 2026-10-26: all 131 frontend unit tests in 24 files passed, plus full lint, strict typecheck, formatting, explicit skill formatting and API drift checks. The isolated production Webpack build passed without disturbing the running development checkout.

The affected desktop/mobile browser suite passed 71 cases with 3 existing viewport-conditional skips out of 74. All four new public budget/contact-description cases passed; invalid inquiry validation sent no write request. Existing tests verified search, mobile filters, native selects, streaming, gallery/navigation, access rules and inquiry retry. The initial browser warmup exceeded its default timeout during concurrent compilation; an unchanged rerun after the build passed. No source or timeout change was needed.

Live runtime inspection confirmed the correct checkout on port 3100 and no configuration, session or browser errors. Homepage, listing and detail screenshots at 1440, 768, 390 and 320px showed no horizontal overflow; desktop/mobile presentation was reviewed. Independent source review passed without actionable findings. Existing skill guidance was tested before/after for component discovery and composition; the spec index, architecture and root specification now agree with actual component ownership. Roadmap checklist states remain unchanged.

[Related shared CRM component spec](../shared-crm-components/spec.md).
