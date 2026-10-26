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
- The current generator reads `docs/contracts/properties.openapi.yaml` and produces `src/lib/api/generated/properties.d.ts`. For a new API domain, coordinate its backend contract and extend snapshot/generator coverage explicitly; the existing command does not automatically generate every endpoint.
- Implement the feature spec's loading, empty, error, success, and permission states. Use the agreed request/response contract rather than inventing endpoints or exposing private fields.

## 4. UI choices

- Before creating a custom control, inspect `src/components/ui`. Use semantic HTML for ordinary page structure and native links for navigation.
- When the catalog cannot serve the current need, add only the appropriate official shadcn/ui Base Nova component and adapt it to `src/styles/tokens.css`.
- Use semantic tokens and existing component variants for consistent color, spacing, and typography. Follow the established maroon, ivory, and charcoal design direction.
- Use `FieldError` for field errors, `Alert`/`AlertDescription` for persistent form or action feedback, and shared `Button` variants for actions.
- Support responsive layouts, keyboard operation, visible focus, associated labels, and accessible feedback. Inspect the affected screens at desktop and mobile widths and exercise meaningful interactive states.

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
