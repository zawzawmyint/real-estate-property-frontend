# Feature specifications

Before implementation, create `specs/<feature-name>/spec.md` from [_template/spec.md](_template/spec.md). Resolve blocking questions, define contracts with the backend, and agree acceptance criteria before code. Keep the spec beside the feature throughout delivery. Mark acceptance verified only with evidence.

The standalone [project foundation](project-foundation/spec.md) covers this repository's setup. Do not add future feature skeletons until their requirements exist.

The root [project specification](../spec.md) summarizes project-wide scope and the verified baseline. Keep detailed requirements and acceptance evidence in the feature specs; keep checklist progress in [the roadmap](../ROADMAP.md).

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
