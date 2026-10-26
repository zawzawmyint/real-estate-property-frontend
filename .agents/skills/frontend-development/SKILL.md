---
name: frontend-development
description: Use when implementing or changing this project's Next.js App Router pages, public or CRM UI, forms, or Express API integration.
---

# Frontend development

Deliver frontend changes using this repository's existing structure and patterns. Paths below are relative to the frontend repository root. AGENTS.md owns project rules; feature specs own requirements; this skill provides the implementation workflow.

## 1. Read first

- Read `AGENTS.md`, `spec.md`, and the affected feature spec. Before changing behavior, create or update `specs/<feature-name>/spec.md` using `specs/_template/spec.md` and resolve blocking acceptance or contract questions.
- Read the relevant guides under `node_modules/next/dist/docs/` before writing Next.js code. This installed version differs from older training data. Use Context7 for current library documentation as required by project guidance.
- Inspect `src/features/properties` and `src/features/auth` for established patterns, choosing examples relevant to the task rather than copying an entire feature. For forms, start with `src/features/properties/crm/property-form.tsx` and `src/features/auth/login-form.tsx`.
- Consult `ROADMAP.md` when selecting feature scope or recording delivery; an unchecked item is not implemented behavior.

## 2. Where code goes

- Keep route entries in `src/app` thin: public pages under `(public)`, staff CRM pages under `(staff)/crm`. Preserve the existing `/login` entry and established authentication boundaries.
- Put business UI and feature-specific components, hooks, schemas, and API functions in `src/features/<feature>`. Put reusable UI primitives in `src/components/ui` and layout building blocks in `src/components/layout`.
- When a feature grows distinct screens and data responsibilities, group existing files by those responsibilities. Properties uses `data/` for actions, transport, schemas and filter helpers; `public/` for cards/search/gallery; `crm/` for inventory and editing; `shared/` for currently reused images/loading components. Keep public and CRM screens separate while sharing actual common components. Small features can remain flat; avoid empty folders and barrel exports that mix client and server-only modules.
- Use focused components, explicit typed props, and readable composition. Extract shared code when it serves a current shared need or meaningfully simplifies complexity; avoid empty scaffolds and mandatory per-component folder structures.
- Follow existing server/client boundaries. Keep server reads and secrets on the server; introduce client boundaries where browser behavior or interactive state requires them.

## 3. Data boundary

- Server reads go through `src/lib/api/server.ts`; business mutations use feature-owned Server Actions that forward to Express. Browser reconciliation reads and native auth use same-origin `/api/v1`. Keep `API_URL` server-only.
- Express owns business rules, validation, authorization, persistence, and API contracts. UI visibility and the CRM shell do not grant access. Do not import backend source or database code.
- Consume generated contract types from `src/lib/api/generated`; never hand-edit them. After a backend OpenAPI change, refresh the affected frontend-local contract snapshot, then run `bun run api:generate` and `bun run api:check`.
- The current generator reads property and lead OpenAPI snapshots from `docs/contracts` and produces corresponding declarations in `src/lib/api/generated`. For a new API domain, coordinate its backend contract and extend snapshot/generator coverage explicitly.
- Implement the feature spec's loading, empty, error, success, and permission states. Use the agreed request/response contract rather than inventing endpoints or exposing private fields.

## 4. UI choices

- Before creating a custom control, inspect `src/components/ui`. Use semantic HTML for ordinary page structure and native links for navigation.
- When the catalog cannot serve the current need, add only the appropriate official shadcn/ui Base Nova component and adapt it to `src/styles/tokens.css`.
- Use semantic tokens and existing component variants for consistent color, spacing, and typography. Follow the established maroon, ivory, and charcoal design direction.
- Use `FieldError` for field errors, `Alert`/`AlertDescription` for persistent form or action feedback, and shared `Button` variants for actions.
- Support responsive layouts, keyboard operation, visible focus, associated labels, and accessible feedback. Inspect the affected screens at desktop and mobile widths and exercise meaningful interactive states.

## Shared CRM application components

Use application components before composing primitive markup for CRM lists and ordinary fields. Primitives under src/components/ui remain the foundation. Feature modules provide the content and business state; shared components own repeated presentation.

- Import PageHeader from @/components/layout/page-header. Props: title (string), description (ReactNode), actions (ReactNode), className. It owns the h1/description/action layout; pass permission-filtered links in actions.
- Import FilterPanel from @/components/layout/filter-panel. Props: children, disabled, busy, fieldsClassName, className, before and after. It owns the card and disabled fieldset/grid. Put feature navigation in before and extra controls in after. Wrap it in a feature-owned form for explicit submit; keep lead debounce/mobile draft logic in the feature. A disabled fieldset affects its children; before/after actions must receive their own disabled rules when needed.
- Import DataTable and type DataColumn<T> from @/components/crm/data-table. Props: rows, columns, getRowKey, label, empty, optional renderMobile. Each column has stable id, header, cell(row), optional className and headerClassName. rows and columns accept readonly arrays; getRowKey returns a React Key, cell/renderMobile return ReactNode. Supply role-allowed columns only. The component owns table tags, row iteration, mobile wrapping and empty rendering; do not repeat those structures in feature files.
- Import CollectionPagination from @/components/crm/collection-pagination. Props: page, pageSize, total, href(page), optional showTotal. The feature supplies URL construction; the shared component renders pagination.
- Import TextField, SelectField and TextareaField from @/components/forms/fields. Each accepts id, label, optional help, error, fieldClassName and native control props including ref. SelectField takes option children. Spread form.register(name) directly; keep schema/form state in the feature. id and label are required. Help and error use generated ids id-help and id-error; blank/absent messages produce no dangling references. Shared fields own label/control/help/error IDs and merge caller aria-describedby rather than replacing it. Use existing Field primitives for specialized controls such as checkboxes, uploads and search pickers.

DataTable has no use-client directive: server-owned columns/functions must be consumed within the server graph. It can also be imported by an existing client feature with client-owned columns. Never pass cell functions from a Server Component into a Client Component boundary. PageHeader/FilterPanel do not fetch or authorize.

Example of a server-compatible results component (contacts is an illustration, not a delivered feature):

```tsx
import { PageHeader } from "@/components/layout/page-header";
import { FilterPanel } from "@/components/layout/filter-panel";
import { TextField } from "@/components/forms/fields";
import { DataTable } from "@/components/crm/data-table";

type Contact = { id: string; name: string };
export function ContactResults({ rows }: { rows: Contact[] }) {
  return (
    <>
      <PageHeader title="Contacts" description="Your contacts" />
      <form action="/crm/contacts">
        <FilterPanel>
          <TextField id="contact-q" name="q" label="Search contacts" />
        </FilterPanel>
      </form>
      <DataTable
        rows={rows}
        getRowKey={(row) => row.id}
        label="Contacts"
        columns={[{ id: "name", header: "Name", cell: (row) => row.name }]}
        empty={<p>No contacts yet.</p>}
      />
    </>
  );
}
```

Real consumers: src/features/properties/crm/property-inventory.tsx and src/features/leads/crm/lead-list.tsx; filter and form-field siblings show controlled and registered fields. Read [shared component specification](../../../specs/shared-crm-components/spec.md) for scope and verification.

## Shared public application components

Public pages share ordinary labelled fields with CRM, while public headings and search panels retain their own visual hierarchy. Start with these existing components rather than copying sections or forcing public layouts into CRM PageHeader/FilterPanel/DataTable.

- Import PublicSectionHeader from @/components/layout/public-section-header. Props: required level (1 or 2) and title (ReactNode); optional id, description, eyebrow, actions and className. level selects the established public h1/h2 typography and spacing. Keep a section's aria-labelledby equal to its heading id. The homepage hero and property detail/gallery heading remain distinct compositions.
- Import PublicSearchPanel from @/components/layout/public-search-panel. Props: children, treatment (hero or listing), optional className. It owns the two existing public search card treatments, not forms, fieldsets, navigation or validation. PropertyFilters owns the listing panel; the homepage owns the hero panel around PropertyFilters home. Preserve these existing ownership boundaries and do not add a second panel around an already panelled surface.
- Import PropertyGrid from @/features/properties/public/property-grid. Props: properties (readonly PublicPropertySummary array), optional resultsQuery. It owns PropertyCard iteration and responsive grid classes. Pass resultsQuery on listing results to preserve return-to-results links; omit it on featured collections. Feature callers own empty/error/loading and demo disclosure content.
- PropertyCard from @/features/properties/public/property-card already owns property card rendering; props property and optional resultsQuery. PropertyFilters from @/features/properties/public/property-filters already shares SearchForm between homepage, desktop results and mobile Sheet; props query (default empty) and home (default false). PropertyPagination remains the feature-owned numbered navigation. Reuse these rather than rebuilding them.
- Use TextField, SelectField and TextareaField from @/components/forms/fields for ordinary public search/inquiry controls, just as in CRM. Pass register(name), error.message, native props and existing control ids. Let wrapper help use its generated id. Preserve external budget-note aria-describedby; wrapper errors merge with it. Keep radio purpose tabs and inline result sort specialized rather than adding unused generic variants.

Server headings and property grids remain server-compatible. PublicSearchPanel owns no domain imports or client state. The feature retains exact AED conversion, URL/query state, mobile Apply/close behavior and hydration readiness. InquiryCard retains native autofill synchronization, stable receipts, duplicate guards and explicit uncertain-save reconciliation. There is one inquiry form today; create no generic contact form or public table without another real consumer.

Example of composing an existing public collection (rows are already fetched by the feature):

```tsx
import { PublicSectionHeader } from "@/components/layout/public-section-header";
import { PropertyGrid } from "@/features/properties/public/property-grid";
import type { PublicPropertySummary } from "@/features/properties/data/types";

export function PublicCollection({
  properties,
  query,
}: {
  properties: PublicPropertySummary[];
  query: string;
}) {
  return (
    <section aria-labelledby="collection-heading">
      <PublicSectionHeader
        id="collection-heading"
        level={2}
        title="Explore our collection"
        description="Homes for your next chapter."
      />
      <PropertyGrid properties={properties} resultsQuery={query} />
    </section>
  );
}
```

Real consumers: src/app/(public)/page.tsx, src/app/(public)/properties/page.tsx, src/features/properties/public/property-results.tsx and property-filters.tsx, and src/features/leads/public/inquiry-card.tsx. See [shared public component specification](../../../specs/shared-public-components/spec.md).

## 5. Forms

For data/form work, also read [frontend-data-forms](../frontend-data-forms/SKILL.md). It records action boundaries, shared create/edit fields, the shared submit button and independently streamed results; use its concrete reference files rather than copying the old browser mutation flow.

- Use React Hook Form with a feature-local Zod schema; React Hook Form owns field state and validation. Express validates independently.
- For asynchronous submission Actions, `useTransition` can cover the Action including its awaited request. Combine transition pending state with form validation/submission state, and retain a synchronous duplicate-submit guard before asynchronous validation or submission can overlap.
- After an `await`, wrap navigation or state updates in a new transition when they should be transitions. Keep text-input updates out of transitions.
- Preserve autofill values, accessible errors, and existing authentication boundaries. Release duplicate guards when retry is safe; hold them through successful navigation or unresolved create outcomes. Follow the focused data/forms skill for reconciliation and pending-state handling.

## 6. Finish

- Run meaningful checks for the changed behavior, then `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test`, and `bun run build`. Run `bun run api:check` when contracts or API consumption change.
- For a flow that crosses the API, start the backend on port 4311 and run `bun run test:e2e`. Verify the actual affected flow and permissions; a passing unrelated smoke test is insufficient.
- After verification, update the feature spec with actual evidence and limitations. Mark acceptance criteria complete only when their behavior is verified; update `spec.md` when the verified project baseline changes.
- Reconcile affected operational docs. For shared documentation, edit the frontend source first and synchronize the backend copy under the existing policy. Preserve roadmap IDs and leave partial items unchecked. Follow AGENTS.md's final documentation reconciliation requirement.
