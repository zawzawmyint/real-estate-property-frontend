# 🧭 Shared CRM Workspace Presentation Plan

> **Goal:** Apply the agreed CRM designs through shared presentation while preserving feature behavior, icon actions, the sidebar and public pages.

---

## 🎯 Objective

Delivered the collection/calendar presentation for Properties, Leads, Tasks and Viewings, using [the feature specification](../../../specs/crm-workspace-presentation/spec.md) as authority. Native 200% browser zoom and the repository-wide formatter baseline remain explicit validation limitations.

---

## 📦 Scope

**In scope**

- Reusable compact headers/toolbars/chips, table/badge presentation and opt-in collection pagination.
- Properties table and Leads/Tasks/Viewings presentation, with responsive/recovery states and regression evidence.

**Out of scope**

- Sidebar, public pages, dashboard, detail/create/edit forms and pipeline board redesign.
- Backend/API/permission changes, new business functions, dependencies and deployment.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Continue on the existing feature branch after recording/reviewing its prior uncommitted toolbar work; do not discard or silently replace it.
- Reuse existing components with opt-in variants. Shared presentation receives feature-supplied content/actions; it never fetches, authorizes or constructs domain queries.
- Preserve local tokens, dependencies, mobile renderers and query-keyed loading boundaries. No source imports across repositories.

**Product / Business**

- Properties actions remain visible eye/pencil/external-link icons under existing permissions.
- Leads keeps 300ms debounce and immediate desktop filtering; Tasks and Viewings keep explicit Apply. No identical-control requirement across pages.
- All rendered totals/dates/contacts come from application data. Mockup examples and sidebar-icon substitutions are illustrative.

**Dependencies**

- Four saved visual references and existing frontend feature specs/contracts.
- Disposable backend fixture/proxy for integration tests only; no backend implementation.

---

## 🧩 Proposed Approach

- Extend [PageHeader](../../../src/components/layout/page-header.tsx) with `variant?: "default" | "workspace"`; default unchanged. Opt in only the four list/calendar routes.
- Add CRM-owned `collection-toolbar.tsx`, `filter-chip.tsx` and `status-badge.tsx` under `src/components/crm/` with the small slot/handler/tone interfaces defined in the spec. Migrate Properties and Leads as the first confirmed shared consumers; Tasks/Viewings supply their own compact controls.
- Extend [DataTable](../../../src/components/crm/data-table.tsx) and [CollectionPagination](../../../src/components/crm/collection-pagination.tsx) with opt-in workspace variants. Retain typed columns, feature mobile cards and caller-owned page links; bound numbered navigation and handle zero/last/out-of-range data safely.
- Adapt feature presentation in `src/features/properties/crm/`, `src/features/leads/crm/`, `src/features/tasks/crm/` and `src/features/viewings/crm/`. Keep filters, data transport, permissions and domain state in those modules.
- API and data contracts remain unchanged. Shared lead filter/presentation callers in Pipeline and embedded task/viewing panels remain compatible.

---

## 🚀 Execution Plan

1. **Shared foundation and Properties** — _(role: frontend)_ — pin current toolbar behavior with its existing tests; add pagination-boundary tests before new range logic. Implement opt-in shared header/table/pager plus small toolbar/chip/status presentation. Migrate Properties' local visual classes and table columns, retaining all icon actions and media fallbacks. Output: Properties matches its reference and the shared pieces have immediate real consumers.
2. **Leads migration** — _(role: frontend)_ — migrate the list header, navigation, compact search/advanced filters/chips, table and footer. Update `lead-filters.tsx`, `lead-list.tsx`, `lead-presentation.tsx`, `lead-loading.tsx` and list route as needed. Preserve the mounted debounced search input, typing during navigation, manager/Agent scopes, mobile Sheet drafts and assignment. Output: second shared table/toolbar consumer without changing pipeline behavior.
3. **Tasks migration** — _(role: frontend)_ — update `task-toolbar.tsx`, `task-list.tsx`, `presentation.tsx`, collection route and scoped result/loading presentation. Retain status/due-only controls, earliest-due order, Dubai timestamps and refresh guards. Keep embedded lead-task defaults unchanged unless explicitly opted in. Output: consistent task list without invented search, priority or inline completion.
4. **Viewings migration** — _(role: frontend)_ — update `calendar.tsx`, collection route and scoped result/loading presentation. Use the shared header/toolbar/badge styling while preserving feature-owned week navigation, date/status Apply, appointment links, overnight labels, mobile selected-day navigation and load-more. Output: visually consistent day-grouped calendar with existing scheduling entry.
5. **Cross-page validation** — _(role: frontend)_ — run quality gates and existing feature/recovery suites plus `crm-workspace-presentation.spec.ts`. Compare matching-state captures to all four references at desktop/mobile sizes; verify keyboard/native zoom and unaffected public/sidebar/dashboard/pipeline routes. Output: recorded passing evidence or explicit unchecked limitations, with scoped review fixes verified.
6. **Documentation reconciliation** — _(role: frontend)_ — update feature evidence, root/index and frontend-owned roadmap after verification, synchronizing shared backend documentation. Delegate final reconciliation to `spec-updater` when available, then review its diff. Output: accurate delivered status without checking broader release items or unverified criteria.

---

## ✅ Acceptance Criteria

**Functional**

- [x] Four target views match their selected design direction and retain existing controls, navigation, data and permissions.
- [x] Properties icon actions retain accessible names, conditional visibility and at least 44px targets.
- [x] Lead debounce/mobile drafts, task freshness and Dubai viewing-week/load-more behavior remain intact.
- [x] Shared components have real consumers; page-specific fields/handlers remain local.

**Non-functional** (performance, security, accessibility, reliability)

- [x] No extra data fetches, dependencies, domain abstraction or authorization weakening.
- [ ] Desktop, narrow layouts, keyboard/focus and native 200% zoom have evidence. Desktop/narrow checks and visual review are recorded; native 200% zoom remains unverified because the available Windows browser controls could not set and prove it.
- [ ] Sidebar/public/default component consumers are unaffected; targeted smoke/regression evidence is recorded, while the aggregate remains open for the native-zoom and inherited formatter limitations.

---

## 🧪 Validation Plan

**Manual tests**

- Compare actual screens with saved reference images in matching applied-filter states; verify each primary action, icon, status, long title/contact, real count and empty/error state.
- Inspect 1440/768/390/320px, real browser zoom, keyboard order/focus, sidebar collapsed/expanded and active Next.js runtime diagnostics.
- Smoke public routes, dashboard, pipeline and embedded lead panels for shared-style regressions.

**Automated tests**

- `bun run api:check`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test`, `bun run build` in frontend, with an owned dev server stopped or an isolated build snapshot.
- Against documented disposable fixtures: `bun run test:e2e -- tests/e2e/crm-workspace-presentation.spec.ts tests/e2e/crm-property-inventory-toolbar.spec.ts tests/e2e/properties.spec.ts tests/e2e/leads.spec.ts tests/e2e/tasks.spec.ts tests/e2e/task-recovery.spec.ts tests/e2e/viewings.spec.ts tests/e2e/viewing-recovery.spec.ts --workers=1`.
- Add targeted pipeline/navigation smoke checks. Do not remove failing business assertions to fit generated sample data. Keep prior 85-CRLF and native-zoom limitations separate from fresh results; report unresolved gates honestly.

**Rollback / mitigation**

- Roll back one feature migration by removing its workspace opt-in; retain defaults until every affected caller is verified. No database or backend rollback.

**Delivered evidence**

- Frontend API drift, ESLint and TypeScript checks, 297 unit tests in 47 files, and an isolated Webpack production build passed. The full formatter has 79 inherited CRLF-only differences; normalized contents pass Prettier and changed files are formatted.
- Browser evidence is split rather than claimed as one clean full run: final targeted coverage passed 34 cases with three intentional mobile drag skips and one Fast Refresh-affected debounce observation; the frozen mobile debounce rerun passed; the full mobile Viewings suite passed 10/10. All new workspace cases, corrected thumbnail cases and targeted pipeline/legacy regressions passed across those runs.
- Visual review used saved 1440px, 390px and 320px captures; 768px was browser-tested without a saved capture. Restored normal-runtime inspection confirmed the expected frontend checkout at port 3100, backend health at port 4311, an authenticated `/crm/properties` view with 15 demo records and enabled controls, restored sidebar state, and no configuration or session errors. See `outputs/crm-workspace/properties-final.png`.
- Native 200% browser zoom remains unverified because bundled Chromium could not spawn and Edge did not expose `#zoomLevel`.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Risk:** Shared classes unintentionally change unconverted pages — _Mitigation:_ opt-in variants and public/sidebar/pipeline smoke checks.
- **Risk:** Extraction resets typing, drafts or focus — _Mitigation:_ keep feature state/input identity and pin navigation/debounce/Sheet cases.
- **Risk:** Generic badges conceal business distinctions — _Mitigation:_ feature-owned mapping and visible state text.
- **Risk:** Mockup samples imply new features or inconsistent counts — _Mitigation:_ actual API contracts and data override illustrative content.
- **Risk:** Existing Windows formatter/native-browser limitations prevent clean full gates — _Mitigation:_ isolate evidence, retry supported tooling and leave affected acceptance unchecked.

**Open questions** _(blockers for implementation)_

- Native 200% browser zoom needs a browser-control path that can set and prove the zoom level. Other screens require a separate scope decision.
