# Shared CRM application components

Status: Verified frontend presentation maintenance.

## Goal

Write common CRM page, filter, table and labelled-field structure once so Properties and Leads remain consistent and maintainable.

## Scope

Create reusable application components above the existing UI primitives: PageHeader, FilterPanel, DataTable<T>, collection pagination and TextField/SelectField (plus TextareaField if needed to share the same field wiring). Adopt in both CRM list pages, filter controls and property/lead create/edit fields. Extend the existing frontend skills and AGENTS guidance after verification. No new dependency, endpoint, database change or new roadmap business feature. Keep public forms, custom property photos/checkboxes and lead pickers scoped to their existing controls.

Public adoption of the same labelled fields and dedicated public layouts is verified separately in [shared public components](../shared-public-components/spec.md). The original CRM acceptance scope remains unchanged.

## User flow

Properties and Leads retain their current routes, columns, filters, empty states, paging, desktop tables/mobile cards and create/edit behavior. Property filters submit explicitly; lead search remains debounced with mobile draft Apply/Cancel. Keep URL state, hydration guards, focus, pending states and query-keyed streaming boundaries.

## Contracts and access

Frontend-only presentation refactor. Existing property and lead contracts, generated types, Server Actions, schemas, private field projections, roles and access checks remain authoritative. Shared components have no domain API/auth imports. Feature modules supply typed rows, stable row keys, column headers/cell renderers, optional mobile rendering, pagination links, labels, values, handlers and permissions.

## Design

- PageHeader takes title, description and optional actions; owns heading/action layout. Use it in both CRM list pages.
- FilterPanel owns common panel styling, a disabled/busy fieldset and grid layout with explicit slots for feature controls/actions. It must serve both controlled and uncontrolled filters without owning URL/navigation or debounce rules.
- DataTable<T> takes rows, typed columns (stable id, header, cell renderer and optional class names), getRowKey, accessible name, empty content and optional mobile card renderer. Own table tags, row iteration, desktop/mobile wrappers and empty rendering. Features contain no duplicate TableHeader/TableBody/TableRow/TableCell assembly. Preserve custom cells, manager-only columns and assignment callback state. No speculative client sorting, selection, bulk actions or table engine.
- CollectionPagination owns Previous/Next and page presentation; features supply page/size/total and href builder. Preserve current visible paging treatment where materially different.
- TextField/SelectField own label/control/help/error markup and aria associations. Preserve native input/select props, registration refs, caller descriptions, ids, controlled/uncontrolled values, disabled/readOnly and invalid state. Textarea may use the same field shell. Field IDs supplied explicitly; no domain validation or hidden form state in shared components.
- Reuse existing tokens and primitives; keep server-compatible layout/table composition so server-owned property cells are not passed as functions into a client boundary. Keep interactive state within existing client features.

## Acceptance criteria

- [x] Properties and Leads use shared PageHeader and FilterPanel.
- [x] Both lists use DataTable<T> with feature-owned typed columns and mobile cells, with no duplicated table structure.
- [x] Both lists use shared pagination; filters and both create/edit field sets use shared labelled fields for ordinary text/select controls.
- [x] Names, labels, help/error associations, refs, keyboard focus, pending controls, mobile widths and all existing permission/action behavior are preserved.
- [x] Shared components import no feature/API/auth modules and introduce no dependencies or generic business framework.
- [x] Existing frontend skills document real component APIs and examples, AGENTS links their use, specs/index/architecture track the verified refactor without completing new business roadmap items.

## Validation

Targeted real-render tests cover column ordering/custom cells, empty/mobile rendering, pagination boundaries and labelled-field description/error IDs/native props. Run frontend API drift, lint, formatting, strict typecheck, all unit tests and isolated production build while preserving the existing dev server. Run real property/lead browser regression desktop/mobile, inspect live port3100 errors/page metadata and compare responsive screenshots. Skill reference retrieval/application scenario before/after the guidance update. Backend source is unchanged.

## Rollout and risks

Incremental presentation-only adoption on the current feature branch, preserving existing uncommitted lead work. No migration/configuration changes. Risks: lost native refs/aria IDs, serialized cell functions crossing server/client boundaries, changed selector/focus/URL behavior. Verify these directly; revert only this refactor if necessary, preserving lead delivery.

## Implementation evidence

- Shared components are implemented under src/components/layout, src/components/crm and src/components/forms; both Properties and Leads provide feature-owned columns, filters, mobile renderers, URL behavior and permissions.
- Focused rendering/accessibility coverage, the full frontend unit suite (128 tests across 23 files), lint, formatting, strict typecheck and API drift checks passed.
- An isolated production Webpack build passed. The 48-case desktop/mobile Properties and Leads browser regression suite passed, and live-checkout runtime inspection reported no browser or Next runtime errors. Responsive screenshots at 1440px, 390px and 320px showed no horizontal overflow.
- The existing frontend implementation skills and AGENTS guidance were evaluated before and after the change. They now document the shared imports, contracts, composition example and server/client boundary. The refactor adds no dependency, API, permission, backend or roadmap business-feature change.
