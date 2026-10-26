# Inquiry capture and lead management

Status: Verified — delivered and reconciled, 2026-10-26.

## Goal

Connect public property interest to accountable staff follow-up: a visitor submits an inquiry, Admin/Manager distribute the resulting unassigned lead, and its agent records progress and notes.

## Scope

Included: property inquiry form; role-scoped CRM leads inbox/list; manual create and edit; lead details; assignment/reassignment/unassignment; stage changes; notes and call logs; paginated activity history; responsive and accessible states. Website inquiries always start New and Unassigned. Agents create manual leads assigned to themselves; Admin/Manager may select an active agent or leave them unassigned.

Roadmap coverage: P1-03 through P1-09, P1-20 through P1-22 and P1-16 are verified. This scope does not complete P1-10 or the wider mobile-layout P1-18 item.

Excluded: Kanban/drag-and-drop, automatic routing, notifications, auto-replies, duplicate-person detection/merging, viewings/calendar, tasks/reminders, reporting, CSV, attachments, client accounts, full audit log, marketing consent/subscriptions, lead deletion and bulk actions. A manually selected Viewing Scheduled stage does not create a calendar booking. Public contact/agent pages remain separate.

## User flow

### Public inquiry

Entry: existing `/properties/[id]`, for a currently published and available property. Form: name, phone, email, optional message; require name and at least one contact method. Render a compact property summary and “Your details will be used to respond to this property inquiry.” Do not imply marketing enrollment or invent a privacy-policy destination.

Submit label: “Send inquiry”; pending: “Sending inquiry…”. Keep inputs stable while pending and block duplicate clicks. Success replaces the form with “Thank you. Our team will contact you about this property.” Do not promise a response time or expose a lead ID, staff names, CRM links or the submitted contact details in the URL.

Validation errors stay next to fields with an error summary focused after submission. Rate limiting gives a clear retry time. A property that becomes unavailable gives “This property is no longer accepting inquiries” with a listings link; preserve entered text. For a timeout or lost response retain the same submission key and offer an explicit retry, never an automatic write retry. A confirmed success persists through local rerenders; a deliberate new inquiry requires a fresh submission key.

### CRM list and inbox

Delivered routes: `/crm/leads`, `/crm/leads/new`, `/crm/leads/[id]`, `/crm/leads/[id]/edit`. Leads uses the existing workspace navigation and public route structure. Localization remains later work.

Admin/Manager default to Unassigned; adjacent All leads view. Agents have My leads only. Query state belongs in the URL: `view=unassigned|all|mine`, `q`, `stage`, `source`, `agentId`, `sort`, `page`. Page size is 20. Switching search/filter/view/sort resets page to 1; preserve query state on back navigation. Debounce hydrated search by 300ms. Before hydration, filters are inert. Invalid controls receive a safe reset option rather than a blank crash screen.

Header: “Leads”, short role-appropriate description, primary “New lead” action. Manager view includes a restrained unassigned count, refreshed on navigation or explicit refresh; no real-time badge/polling promise. The count includes all unassigned leads, including Won/Lost, and is independent of active list filters. Badge absent for agents. Filters: search name/phone/email/property snapshot title, stage, source, and agent for Admin/Manager in All leads. Unassigned view fixes assignment=null; Agent view fixes assignment=current user on the server. Default order newest first, with oldest first and recently updated options.

Desktop columns: Lead (name and contact summary), Property/Preference, Source, Stage, Assigned agent (manager views), Received, and labelled Assign action where allowed. Name is the detail link; avoid a clickable row containing competing nested links. Show “No property selected”, “No budget specified”, and “Unassigned” explicitly. Count and pagination reflect the authorized, filtered dataset. Empty inbox: “All inquiries have been assigned.” Empty agent view: “No leads assigned to you yet.” Filtered empty state offers “Clear filters”.

### Details, follow-up and edit

Header: breadcrumb back to the previous list, lead name, source/stage badges, received date, and Edit details action. Two columns at >=1024px: main approximately 2/3, sidebar 1/3; collapse to one column below this. Main: original website message, note/call composer, then activity timeline newest first with Load more (20/page). Sidebar: contact links, preferred purpose/budget, property context, stage control and assignment card. Lead information comes before the composer on narrow screens.

Composer has Note/Call log kind, labelled multiline content and “Add note” or “Save call log”. Notes are plain text, append-only in this slice; no hidden edit/delete menus. Timeline distinguishes inquiry received, manual lead created, note added, call logged, assignment changed, stage changed and details updated. Show author and localized timestamp; dates use Asia/Dubai display with accessible full timestamp and UTC transport. Assignment history retains previous agent names even after account removal.

Stage selector: New, Contacted, Viewing Scheduled, Offer, Won, Lost. All transitions are allowed, including reopening; each actual change records an event. Saving a terminal stage asks for confirmation inline: “Mark this lead as Won?” or Lost, without adding an outcome reason requirement. Show explicit Save stage; do not mutate on select change. Assignment controls are Admin/Manager only. Agents can edit their assigned lead's contact/preferences/property, change stage and add entries, but cannot change source, assignment or original inquiry message.

Create/edit is a dedicated page with a comfortable max width of 880px. Group sections: Contact details; Requirements (Buy/Rent mapped to sale/rent, optional budget in AED); Property (optional searchable staff property picker); Source (Call/Walk-in on create only); Assignment (manager create only). Website source is server-set and never selectable for manual creation. Manual leads start New. Edit leaves source immutable. Reuse create/edit fields and SubmitButton. Property picker includes available draft/published properties for staff; retains a previously linked unavailable property visibly on edit without requiring relinking. Choosing a property sets matching purpose; refuse inconsistent purpose/property pairs. Stage and assignment have their own controls on details, not duplicate edit controls.

Dirty form navigation requires a discard confirmation where app navigation is interceptable and the browser unload warning where supported. Submission failure retains fields. Success navigates to details and announces confirmation. On 409, preserve the draft, fetch the latest lead, and require review before a new explicit save. On loss of assignment, remove stale private content, show “This lead is no longer available to your account” and link to My leads. Do not render stale cached lead information following a denied refresh.

## Contracts and access

Express owns persistence, ownership, validation, idempotency, atomic history and safe DTOs. The authoritative backend contract is represented locally by `docs/contracts/leads.md` and `docs/contracts/leads.openapi.yaml`; generated lead types are checked alongside property types. No sibling source imports.

Implementation must add approved routes to backend OpenAPI and a frontend-local OpenAPI snapshot, and extend `scripts/generate-api.mjs` to generate/check leads alongside existing property types without breaking property generation. Server reads and validated business Server Actions use the existing private API transport, with live session checks and allowlisted cookie/Origin forwarding. Browser reconciliation reads use `/api/v1`. Public submission uses a feature-owned Server Action that forwards the per-submission UUID and trusted Origin; the browser cannot choose source, stage, assignment or actor. Rate limiting must identify the real client through the deployment's explicitly trusted proxy chain rather than treating every Server Action as the same client.

Access: Admin/Manager see all leads and distribute them; agents see/mutate only currently assigned leads. Public clients get confirmation only. No public lead read endpoint. Out-of-scope valid lead IDs return 404; logged-out staff get 401. Hide denied controls, and independently enforce permissions in Express. No private owner fields, staff email addresses, session data or IP addresses in lead DTOs or history. No PII in analytics, URLs, application logs, static caches or public responses.

## Design

### Visual system and hierarchy

Use existing semantic tokens: maroon primary `#701F35`, ivory background `#FAF8F5`, charcoal text `#252329`, white cards and current border/muted tokens. Poppins for CRM and form controls; Lora only for public display headings. Reuse existing radius, focus ring, button height and spacing conventions. Use an 8px layout rhythm: 16px compact gaps, 24px card padding/gaps, 32px section separation. No new font, icon package, toast system or dashboard metrics.

Public inquiry desktop placement: a ~360px card beside detail information, sticky below the actual header where space allows; never overlay the gallery, footer or keyboard. Below 1024px place it after essential property information in normal document flow; no fixed bottom CTA in this slice. Heading “Enquire about this property”, short supporting text, name full-width, phone/email stacked, message multiline and full-width primary action.

Inbox >=1024px: header, text-link view switcher with current-state semantics and count badge, filter toolbar, bordered white table, pagination. At 768–1023px wrap filters and reduce secondary metadata. Below 768px show a labelled Filters button opening the existing Sheet, followed by white lead cards with name, stage, property, received date and visible Assign action. Filter sheet drafts apply together via Apply filters; Cancel discards changes. Show applied-filter count and Clear filters. Avoid horizontal page scrolling at 320px.

Detail cards use understated separators rather than many competing shadows. Stage badges combine text with restrained neutral/primary styling; Won/Lost remain readable without relying on green/red. A small vertical timeline line and event icons support scanning; message content remains selectable plain text. Phone/email links use their appropriate protocols without intercepting the browser's native behavior.

### Assignment dialog design

Use existing Dialog, not a new modal framework. Max width 480px with 24px padding, title Assign agent/Reassign agent, short explanation, lead name and current assignee, searchable active-agent picker and an explicit Unassigned option. Only current active `agent` users are selectable; Admin/Manager distribute rather than receive leads in this slice. Include a visible label and a no-results state. Disabled or removed current assignees appear as unavailable context, never selectable options. Offer reassignment directly; do not silently unassign on disable.

Footer: Cancel (secondary) and Assign agent/Save assignment (primary). Disable save until selection changes. Pending text “Saving assignment…”; freeze controls and prevent double submission. Keep the dialog open on validation/network/conflict errors with an inline Alert. On conflict, retain selection, reload current ownership/version and require reconfirmation. On success close, refresh row/count/detail and announce “Lead assigned to [name]” or “Lead moved to Unassigned”. Same assignee is a backend no-op without a duplicate event. At 320px dialog stays inside viewport with an internally scrollable body; picker options never escape usable focus bounds.

### Interaction, accessibility and state requirements

Reuse `Button`, `SubmitButton`, `Field`, `FieldError`, `Input`, `Textarea`, `NativeSelect`, `Dialog`, `Sheet`, `Table`, `Badge`, `Pagination`, `Alert` and shared empty/loading primitives. Add only the feature-specific searchable picker needed for agents/properties using an accessible established component if no local primitive suffices. Do not build a custom listbox casually.

Visible labels and field instructions, sensible autocomplete (name/tel/email), touch targets >=44px, visible keyboard focus, WCAG AA contrast and reduced-motion support. Dialog traps focus, supports Escape when idle and returns focus to its trigger. Announce async errors/success through appropriate live regions without repeatedly reading the timeline. Do not move focus while typing or refreshing filters. Avoid color-only states.

Headings/filters render outside query-keyed Suspense results. Use one existing collection loading indicator and reserved card shapes, existing spinner/text on writes, and preserve photo placeholder conventions. Loading must not imply zero leads. Failed reads show retry with a preserved query. Login expiry follows existing session recovery. Uncertain creates/notes use the same submission UUID for explicit reconciliation retries; edits require a fresh authorized read before retry. Never blindly repeat a write. Pending controls remain inert until hydration readiness.

## Acceptance criteria

- [x] A visitor can submit on an eligible property with name and either contact method; exactly one unassigned New website lead and creation event persist for a repeated identical submission key.
- [x] Invalid, unavailable, over-limit and lost-response cases show the specified recoverable UI without leaking lead data.
- [x] Admin/Manager can list/search/filter/sort all or unassigned leads, create manually, assign/reassign/unassign and edit; agents can create self-owned leads and only read/mutate currently owned leads.
- [x] Concurrent assignment/edit/stage changes return reviewable conflicts; an agent cannot retain access after reassignment, including through a direct URL or a stale mutation.
- [x] Detail shows contact/preferences, retained property context, immutable original message, stage, assignment and paginated notes/calls/activity with authors and timestamps.
- [x] Disabled/removed assignees are visibly unavailable and can be redistributed; property deletion preserves lead context without exposing owner information.
- [x] All screens and the assignment dialog work at 320, 390, 768 and 1440px, by keyboard and with reduced motion; no layout overflow or hidden submit controls.
- [x] Empty, filtered-empty, loading, validation, denied, not-found, outage, conflict and uncertain-save states are verified.
- [x] Backend contract, frontend snapshots/generated types, both roadmaps and root specifications agree after implementation; only fully verified roadmap items are checked.

## Validation

Unit checks: input/contact/budget rules, URL filters, accessible field wiring and Server Action session/Origin/error/reconciliation boundaries. Real backend/browser checks: anonymous inquiry to inbox to assignment to agent note/stage, two agents' isolation, direct URL denial, reassignment race, duplicated submission, lost response, stale edits, account disable/removal, property deletion and unavailable-public submission. Manual review: full keyboard flow, dialog focus restoration, touch/mobile form completion, long names/messages and empty/error states at specified widths.

Implementation verification: frontend `bun run check`, backend `bun run check` and `bun run db:check`, then frontend `bun run test:e2e` with backend fixture on port 4311. Inspect the correct checkout's frontend on port 3100 with configured Next runtime tooling while a browser page is open. Record actual runtime evidence separately from specification updates.

## Rollout and risks

Additive SQLite migration and API routes; retain existing auth/property contracts. Back up SQLite before migration; stop lead writes before rollback and preserve new records rather than dropping their tables. No notifications/auto-routing implies operational responsibility: Admin/Manager must monitor the inbox. Retention policy and any linked privacy-policy wording need deployment-owner review before collecting real customer data; do not invent a retention duration.

Delivered decisions: explicit inbox distribution; only active agents receive assignments; either contact method is required; rental budget is annual AED; notes/calls are append-only; all defined stage transitions are supported; lead deletion is excluded. See [implementation plan](../../docs/superpowers/plans/2026-10-26-lead-management.md).

## Implementation evidence

Verified 2026-10-26: frontend complete unit suite passed (122 tests in 21 files), production build passed, and browser coverage passed (96 tests with 4 existing conditional viewport skips; final focused lead flow 18/18). Runtime inspection on port 3100 reported no configuration or session errors. Backend `bun run check` passed (78 tests in 20 files); SQLite migration and `bun run db:check` passed. The backend-owned contract, local Markdown/OpenAPI snapshots and generated lead types were checked for drift. Production collection remains blocked pending deployment-owner privacy/retention review and trusted ingress configuration.
