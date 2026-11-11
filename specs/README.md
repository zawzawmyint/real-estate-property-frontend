# Feature specifications

## Software design diagrams

- [Sales pipeline](sales-pipeline/spec.md#software-design-at-a-glance) shows stage changes, confirmation and conflict recovery.
- [Property chatbot UI](public-property-chatbot/spec.md#software-design-at-a-glance) shows question submission and reply rendering.

The companion backend repository's `specs/README.md` indexes the diagrams for staff access, property management, public agency pages, leads, viewings, tasks, dashboard and chatbot routing. Start with the [system design](../docs/shared/system-design.md) for the shared architecture.

## Verified Phase 2 CRM enhancements

- [CRM notifications](crm-notifications/spec.md): verified P2-02 assignment/reassignment notifications with a persistent inbox, unread/read state and SSE. Verified supplemental viewing, task-reminder and staff-inquiry alerts share the inbox. Email/WhatsApp delivery, Redis fanout and deployed-ingress verification remain follow-up work.
- [CRM property matching](property-matching/spec.md): verified P2-03 lead-detail matching panel for explicit Buy/Rent, maximum AED, area, type and exact-bedroom criteria. It uses the backend-owned read-only route through a same-origin handler and the generated leads snapshot, returns only shareable public listing summaries, and preserves local filters for retry and pagination. No extraction, provider, migration or deployment is included.

## Verified public property chatbot

- [Public property chatbot](public-property-chatbot/spec.md): verified P2-08 opt-in public FAQ retrieval and live public-listing handoff. The generated local [OpenAPI snapshot](../docs/contracts/public-chat.openapi.yaml) follows the backend-owned contract. Real-business publication remains gated on approved FAQ and visitor-data wording.

## Phase 1 review remediation — implemented; final acceptance pending

- [November review remediation](phase-one-review-remediation/spec.md): verified gallery/inquiry recovery fixes, production relay enforcement, shared backend staff validation, shortcut-test reliability and documentation reconciliation. [Implementation plan](../docs/superpowers/plans/2026-11-05-phase-one-review-remediation.md). Repository checks, clean serial browser, exact-data dashboard and guarded normal runtime pass; Git-delivery acceptance remains pending. P1-14/P1-18 remain unchecked.

## Compact CRM account popover — delivered with a formatter limitation

- [Staff account popover](crm-account-popover/spec.md): replaces CRM account drawers and inline sign-out with a shared non-modal Base UI popover, retaining the existing provider, Better Auth behavior and mobile navigation drawer. Browser, unit, lint, type, production-build and normal-runtime evidence is recorded. The repository-wide formatter retains inherited CRLF-only differences.

## Compact CRM overview — delivered with a formatter limitation

- [Overview header and metric cards](crm-overview-compact/spec.md): applies the shared compact header and reduced metric-card geometry to `/crm` without changing metrics, graphs, refresh behavior, role scope, sidebar, public pages or backend contracts. Browser, unit, lint, type, build and runtime evidence is recorded; the repository-wide formatter retains inherited CRLF-only differences.

## Sales pipeline workspace header and toolbar — delivered with a formatter limitation

- [Pipeline workspace chrome](crm-pipeline-toolbar/spec.md): applies shared CRM header, toolbar and chips to `/crm/leads/pipeline` while leaving the board, drag/drop, sidebar, public pages and backend contract unchanged. Browser, unit, lint, API-drift, type, production-build and normal-runtime evidence is recorded. The repository-wide formatter still has inherited CRLF-only differences.

## Shared CRM workspace presentation — delivered with verification limitations

- [Shared Properties, Leads, Tasks and Viewings presentation](crm-workspace-presentation/spec.md): reusable compact headers/toolbars, table/status/pagination styling and calendar presentation, with feature-owned behavior and unchanged sidebar/public pages. Includes four saved mockup references and an [implementation plan](../docs/superpowers/plans/2026-11-03-crm-workspace-presentation.md). Native 200% browser zoom and the inherited repository-wide formatter baseline remain unverified.

Before implementation, create `specs/<feature-name>/spec.md` from [_template/spec.md](_template/spec.md). Resolve blocking questions, define contracts with the backend, and agree acceptance criteria before code. Keep the spec beside the feature throughout delivery. Mark acceptance verified only with evidence.

The standalone [project foundation](project-foundation/spec.md) covers this repository's setup. Do not add future feature skeletons until their requirements exist.

The root [project specification](../spec.md) summarizes project-wide scope and the verified baseline. Keep detailed requirements and acceptance evidence in the feature specs; keep checklist progress in [the roadmap](../ROADMAP.md).

## Compact CRM inventory toolbar — delivered with verification limitations

- [Property inventory header and filters](crm-property-inventory-toolbar/spec.md): delivered compact heading with description, search toolbar, advanced-filter disclosure and applied chips. [Implementation plan](../docs/superpowers/plans/2026-11-03-crm-property-inventory-toolbar.md). Frontend-only; existing sidebar and table remain outside the redesign scope. Native 200% browser zoom is unverified, and the full format check does not pass because of pre-existing CRLF-only differences.

## Public agency pages redesign — delivered with a verification limitation

- [Agent directory, profile and Contact redesign](public-agency-pages-redesign/spec.md): selected images 1/5/9, including directory enquiries, editorial profile and split Contact layout. [Implementation plan](../docs/superpowers/plans/2026-11-02-public-agency-pages-redesign.md). The backend-owned additive directory-languages projection is delivered; native 200% browser zoom remains unverified, and P1-14/P1-18 remain unchecked.

## Shared action hierarchy — delivered

- [Shared primary and secondary buttons](button-consistency/spec.md): verified frontend-only action hierarchy for public pages, authentication and CRM. Shared `Button`/`buttonVariants` controls now provide solid primary and outlined secondary actions, plus inverse treatment for dark surfaces. The implementation preserves specialized controls and existing backend contracts; it does not change roadmap completion.

## Public property pages redesign — delivered with a verification limitation

- [Public listings and details redesign](public-property-pages-redesign/spec.md): delivered horizontal listing cards, architectural heading art, outlined actions and the selected photo-first detail layout. Existing backend contracts remain unchanged; summary-description previews and unsupported detail facts remain excluded. [Implementation plan](../docs/superpowers/plans/2026-11-02-public-property-pages-redesign.md). Recorded quality/runtime/visual evidence passed, but canonical native-browser 200% zoom remains blocked; broader P1-14/P1-18 status is unchanged.

## Phase 1 public completion in progress

- [Public homepage redesign — cinematic maroon](public-homepage-redesign/spec.md): verified frontend presentation for the selected latest refinement option 3, with [visual QA](public-homepage-redesign/design-qa.md) and a 102-pass/20-intentional-skip browser result. [Implementation plan](../docs/superpowers/plans/2026-10-30-public-homepage-redesign.md). It supersedes the earlier homepage composition only; broader public-completion acceptance remains pending.

- [Phase 1 public website completion](phase-one-public-completion/spec.md): P1-14 homepage completion and P1-18 public mobile code changes are under verification. [Implementation plan](../docs/superpowers/plans/2026-10-30-phase-one-public-completion.md). Both roadmap items remain unchecked until full acceptance is verified.

## Verified dashboard

- [Agency dashboard](agency-dashboard/spec.md): verified P1-28–P1-30 endpoint and CRM dashboard, including full checks, final 16/16 desktop/mobile browser coverage and visual QA. All active legacy cases passed across two non-clean parallel runs; that limitation is recorded in the feature specification.

## Verified follow-up tasks

- [Follow-up tasks](follow-up-tasks/spec.md): verified P1-26–P1-27 behavior for lead-linked dated tasks and overdue highlighting. [Implementation plan](../docs/superpowers/plans/2026-10-29-follow-up-tasks.md); backend/frontend quality gates, task reruns and the final legacy regression passed.

## Current and verified maintenance

- [CRM route guard and scoped loading](crm-route-guard-loading/spec.md): verified frontend maintenance for the cookie-only CRM Proxy gate and independently loading account, permission controls and list results. It retains Express-owned Better Auth and live authorization; production HTTPS cookie topology remains unverified.

- [Shared public application components](shared-public-components/spec.md): verified public heading/search-panel/property-grid reuse and shared labelled fields across public search, inquiry and CRM, preserving existing visual hierarchy and behavior.

- [Shared CRM application components](shared-crm-components/spec.md): verified frontend-only reuse of PageHeader, FilterPanel, DataTable<T>, CollectionPagination, and labelled ordinary fields across Properties and Leads. It preserves feature behavior, API contracts, permissions and roadmap completion.

- [Loading and control clarity](loading-and-control-clarity/spec.md): verified frontend presentation maintenance for motion-safe spinner feedback, skyline-only large collection loading, quiet photo states, visible key controls and native SVG select chevrons. Lint, formatting, typecheck, 95 unit tests, the isolated production build and focused desktop/mobile browser checks passed.
- [Consistent loading feedback](consistent-loading/spec.md): historical verified baseline for shared primary-color building feedback across public discovery and the CRM. Its superseding loading/control presentation is recorded in the current specification above; it does not change API, dependency, permission or roadmap contracts.
- [Staff account and property image polish](account-and-image-polish/spec.md): verified compact CRM identity/sign-out presentation and shared animated/static property-image placeholders. It does not change roadmap checklist completion.
- [Public header and CRM navigation polish](header-sidebar-polish/spec.md): verified icon-only public header/menu discovery controls, a muted public-footer Staff sign-in entry, responsive CRM sidebar/drawers, preserved staff-account feedback and inventory action presentation. It does not change roadmap checklist completion.
- [Poppins and Lora typography](typography/spec.md): verified two-family self-hosted typography for public display/wordmark and application UI.
- [Documentation organization](documentation-organization/spec.md): verified repository-contained shared documentation, local navigation and frontend-first synchronization.
- [Frontend implementation skill and entry](frontend-implementation-skill/spec.md): verified frontend workflow entry and discoverable implementation guidance.
- [Frontend data fetching and form submission refactor](frontend-data-and-form-refactor/spec.md): verified property API/action boundary, shared form and submit controls, hydration readiness and streamed CRM inventory results. It does not add a business feature or change roadmap delivery status.
- [Property feature organization](property-feature-organization/spec.md): verified behavior-preserving grouping of property data/actions, public UI, CRM UI and reused presentation/loading modules. It does not add a business feature or change roadmap delivery status.
- [Frontend code grouping](frontend-code-grouping/spec.md): verified whitespace-only grouping of authored frontend code for scanability. It does not add a business feature or change roadmap delivery status.

## Verified features

- [Inquiry capture and lead management](lead-management/spec.md): verified public inquiry card, manager-distributed inbox, role-scoped leads, assignment dialog, stage changes and notes/call activity. [Implementation plan](../docs/superpowers/plans/2026-10-26-lead-management.md); [local contract snapshot](../docs/contracts/leads.md).

- [Staff authentication and roles](staff-authentication-and-roles/spec.md): verified staff login/logout, SQLite-backed database sessions and Admin/Manager/Agent identities. Lead ownership is verified in [lead management](lead-management/spec.md).
- [Local demo staff login](demo-staff-login/spec.md): verified development-only one-click native sign-in for pre-provisioned Admin, Manager and Agent demo accounts. It is configured locally, omitted from production and test rendering, and does not create accounts or change permissions.
- [Agency branding](agency-branding/spec.md): Avenor Properties name and architectural A logo assets are integrated across the shared public, login and CRM layouts, with an editable horizontal logo and file-based favicon. It does not change roadmap delivery status.

## Verified maintenance reviews

- [Project review remediation](project-review-remediation/spec.md): verified retry/UUID handling, shared photo/filter/upload definitions, hydration guards, and complete desktop/mobile browser regression checks.

- [Frontend component reuse and readability review](frontend-component-reuse-review/spec.md): code-quality maintenance covering the current component catalog and role wiring. It does not add a business feature or change roadmap delivery status.
- [Next.js agent runtime tooling](agent-tooling/spec.md): project-scoped runtime inspection for the frontend, verified with the existing Webpack workflow and browser tooling. It does not add a business feature or change roadmap delivery status.

## Verified current delivery

- [Separate CRM property details and editing](crm-property-details/spec.md): verified authenticated read-only CRM details for every staff role, distinct editor and public-listing destinations, role-safe owner presentation and Agent redirects from edit URLs. It does not change roadmap completion status.
- [Property management and public discovery](property-management/spec.md): verified CRM property lifecycle/photos and public search/list/detail using the agreed Avenor design. [Implementation plan](../docs/plans/property-management.md).
- [Demo property presentation](demo-property-data/spec.md): verified presentation of explicitly seeded fictional sample listings and generated illustrative images.

## Verified sales pipeline

- [Sales pipeline](sales-pipeline/spec.md): verified P1-10 responsive Kanban, accessible stage movement and recovery using existing lead contracts.

## Verified public contact and agent pages

- [Public contact and agent pages](public-contact-and-agents/spec.md): verified P1-17 Contact, directory and profile design, enquiry-to-CRM flow and a separate public content catalog. [Brief implementation plan](../docs/superpowers/plans/2026-10-27-public-contact-and-agents.md). The fictional demo delivery is verified; real-business publication remains gated.

- [2026-10-27 review remediation](public-contact-and-agents/spec.md#review-remediation--2026-10-27): focused maintenance of canonical phone handling, unknown-mode Contact resilience and receipt recovery; related pipeline announcement evidence is in the [sales pipeline specification](sales-pipeline/spec.md#review-remediation--2026-10-27). It introduces no new roadmap feature or completion count; The full browser run reported 163 passed, 8 intentional skips and one pointer-cancel test synchronization failure. After correcting the test to wait for settled drop-animation geometry and verify an active drag before Escape, that case passed three consecutive isolated reruns. All 164 applicable browser cases are covered across these runs; a single clean full-suite rerun is not claimed.

## Verified naming maintenance

- [Shared-code naming and ownership](shared-code-naming/spec.md): verified shared-helper locations, updated direct imports and property-specific enquiry naming; no new feature or API contract.

- [Pull request branch naming](branch-naming/spec.md): locally verified source-branch validation for PRs into main; hosted execution and required-check activation remain pending.

## Verified viewing management

- [Viewing management](viewing-management/spec.md): verified P1-23–P1-25 scheduling, calendar and feedback. [Implementation plan](../docs/superpowers/plans/2026-10-28-viewing-management.md); [local contract](../docs/contracts/viewings.md).
