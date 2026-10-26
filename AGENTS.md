# Frontend conventions

Use [SKILL.md](SKILL.md) as the frontend workflow entry point; it links the relevant implementation skills and project references.

Start with the [project specification](spec.md) for scope, boundaries and current status, then read the relevant feature spec before implementation. Keep the root spec synchronized after verified feature delivery.

Read the feature spec before code. New work starts at `specs/<feature-name>/spec.md`; copy `specs/_template/spec.md` and agree acceptance before implementation. Update verified specs and docs after tests settle.

Use strict TypeScript. Keep App Router entries thin, reusable primitives in `src/components/ui`, layout building blocks in `src/components/layout`, and business UI in `src/features/<feature>` when it exists. Avoid empty feature scaffolding and speculative helpers.

Express owns business rules, permissions, persistence and files. Never import database code. Read server API config through `src/lib/api/server.ts`; browser reconciliation reads and native auth use `/api/v1`. Business mutations use feature-owned Server Actions with live session checks, runtime input validation, allowlisted cookie/Origin forwarding and serializable safe results. Express independently validates and authorizes every operation. Do not expose `API_URL` as public configuration. Never treat `/crm` shell or robots directives as authorization.

Use semantic tokens from `src/styles/tokens.css`, accessible HTML, visible focus, and logical spacing. Local primitives follow shadcn/ui's Base UI approach; use native links for navigation.

Use blank lines to group related code without spacing every statement. In components, keep directives and imports first, then hooks and setup, derived state, handlers, and the returned JSX; preserve React hook order. In Server Actions, group authentication, validation, request coordination and result handling. In tests, group setup, the action under test and assertions. Keep short dependent operations together.

For CRM list pages and ordinary form fields, reuse the application-level PageHeader, FilterPanel, DataTable, CollectionPagination and labelled fields documented in [frontend-development](.agents/skills/frontend-development/SKILL.md). Keep feature-specific columns, filters, validation, permissions and data orchestration in the feature. Do not recreate shared table/label/error structure in each feature.

For public pages, reuse the public application components and the same labelled fields documented in [frontend-development](.agents/skills/frontend-development/SKILL.md). PropertyGrid/PropertyCard/PropertyFilters own repeated property presentation; PublicSectionHeader and PublicSearchPanel preserve public styling. Extract only confirmed repeated sections; keep hero/gallery, specialized controls and feature coordination local.

Reuse UI components before writing custom markup: inspect `src/components/ui` first, then adopt the appropriate official shadcn/ui Base Nova component when missing. Use `FieldError` for field validation, `Alert`/`AlertDescription` for persistent form or action feedback, and shared `Button` variants for actions. Add new custom primitives only when the existing catalog cannot serve the current need; do not install an entire catalog or introduce a toast system without a suitable user flow.

Interactive forms use React Hook Form, Zod schemas and locally owned shadcn/ui field/input primitives. React Hook Form owns field state and validation; Express still validates independently. For async submission Actions, `useTransition` can cover the awaited request; combine its pending state with form validation/submission state and a synchronous duplicate guard. Do not transition text-input updates. After an `await`, wrap navigation/state updates that should be transitions in a new `startTransition` call. Preserve autofill values, accessible errors and existing authentication boundaries.

Use the [frontend data/forms skill](.agents/skills/frontend-data-forms/SKILL.md) for business forms and data flows. Share create/edit field components and the existing SubmitButton; keep lifecycle presentation separate from request coordination. Keep read functions separate from server-only mutations. Place independently loading result components inside query-keyed Suspense while headings/filters render outside; keep URL filters and controls inert until hydration. Preserve uncertain-save reconciliation and avoid automatic write retries. Better Auth retains its native client contract.

Within `src/features/properties`, place API inputs, filters, types, transport, queries and Server Actions in `data/`; public listing and gallery UI in `public/`; staff inventory and form UI in `crm/`; and only actually reused property presentation/loading UI in `shared/`. Use concrete module imports; do not add barrels or compatibility forwarding files. `PropertyImage` is reused by public homepage, cards and gallery views, while `property-loading.tsx` exports both public and CRM loading fallbacks.

Before completion run `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test`, and `bun run build`. For integration, start the backend on port 4311, then run `bun run test:e2e`. Document meaningful limitations. No credentials, generated artifacts, or local environment files in Git.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Next.js runtime verification

Use the project-configured `next-devtools` MCP connector for frontend runtime inspection; see [agent tooling](docs/agent-tooling.md). Run `nextjs_index`, select port 3100, and confirm `get_project_metadata` identifies this checkout before calling its tools. Open the affected page in the existing browser tooling or Playwright, then inspect `get_errors` and `get_page_metadata` while the page is open. An absent browser session is not a clean runtime result. Inspect routes/logs when useful and exercise the changed behavior in the browser.

Keep `--webpack`: the upstream `next-dev-loop` skill and MCP `get_compilation_issues`/`compile_route` require Turbopack and are not part of this setup. Runtime inspection supplements the required quality checks. Do not delete/move `.next` while dev is running; stop an owned dev server before a production build. Reuse an existing server only after checking its project identity; never stop an unrelated process.

## Shared documentation maintenance

- Follow [workspace guidance](docs/shared/workspace-guidance.md). Track feature progress in [ROADMAP.md](ROADMAP.md) and tool adoption in [TECH_STACK.md](TECH_STACK.md).
- Edit shared documents in the frontend first, then synchronize the backend copies in the same delivery. Preserve repository-local links; do not create dependencies on a sibling checkout. Shared files are ROADMAP.md, TECH_STACK.md, docs/shared/* and docs/design/homepage-maroon-ivory-charcoal.png.
- Keep each repository's own feature specs authoritative. The homepage mockup records a design direction, not delivered behavior.
