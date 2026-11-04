# 🧭 Compact Property Inventory Plan

> **Goal:** Replace the oversized inventory search panel with a compact header and toolbar while preserving the description, sidebar and existing contracts.

---

## 🎯 Objective

Make inventory visible sooner and keep routine search concise. This plan was implemented as the [feature specification](../../../specs/crm-property-inventory-toolbar/spec.md) records; the remaining native-zoom and repository-wide-format limitations are not represented as passed.

---

## 📦 Scope

**In scope**

- Inventory header, compact toolbar, advanced-filter disclosure and applied chips on `/crm/properties`.
- Responsive, keyboard, URL-state and permission regression verification.

**Out of scope**

- Sidebar, table redesign, property detail/create/edit, other CRM/public pages and backend changes.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Existing frontend dependencies and query contracts suffice; no installs or global style changes.
- Keep `PropertyFilters` and its parser/serializer; retain query-keyed result Suspense and current session checks.
- Use one form, keep closed filter values, and reset page on Apply/chip removal. Clear all restores the existing bare-route defaults.

**Product / Business**

- Preserve “Manage your agency’s property inventory.” and existing role-aware actions.
- Keep count in authorized results rather than introducing a streamed header count. Reference data and table styling are illustrative.

**Dependencies**

- Existing disposable backend fixture is needed for integration validation only; no backend source changes.
- Selected [reference](../../../specs/crm-property-inventory-toolbar/reference.png).

---

## 🧩 Proposed Approach

- Keep the server page heading/actions outside query-keyed results. Apply local `PageHeader` spacing overrides; preserve default behavior for every other caller.
- Refactor [property-inventory-filters.tsx](../../../src/features/properties/crm/property-inventory-filters.tsx), keeping its `({filters}: {filters: PropertyFilters})` interface. Draft controls live in one form; applied chips/count derive from `filters`. A native inline disclosure exposes the four advanced fields with explicit button semantics.
- Update [inventory page](../../../src/app/%28staff%29/crm/properties/page.tsx) spacing only. Reuse [PageHeader](../../../src/components/layout/page-header.tsx), [FilterPanel](../../../src/components/layout/filter-panel.tsx) customization props and shared labelled fields/buttons. Do not change shared defaults or create unused generic infrastructure.
- Preserve [filter contracts](../../../src/features/properties/data/filters.ts), [authorized results](../../../src/features/properties/crm/property-inventory-results.tsx) and [inventory table](../../../src/features/properties/crm/property-inventory.tsx).
- Add [toolbar integration coverage](../../../tests/e2e/crm-property-inventory-toolbar.spec.ts) and adjust [existing property coverage](../../../tests/e2e/properties.spec.ts) for the new control names. No API/data-contract changes.

---

## 🚀 Execution Plan

1. **Pin toolbar behavior** — _(role: frontend)_ — completed focused browser coverage for collapsed defaults, retained drafts, Enter/Apply, combined filters and page reset.
2. **Implement compact controls** — _(role: frontend)_ — completed local filter component and page-spacing update; sidebar/table and shared defaults remain unchanged.
3. **Complete applied-state navigation** — _(role: frontend)_ — completed chips, count, removal, Clear all, history and focus coverage.
4. **Verify integration and presentation** — _(role: frontend)_ — completed desktop/320px/390px, keyboard, role, recovery and unaffected-route checks. Native 200% browser zoom remains unchecked.
5. **Reconcile delivery evidence** — _(role: frontend)_ — completed feature/root/index/roadmap reconciliation without changing broader roadmap completion.

---

## ✅ Acceptance Criteria

**Functional**

- [x] Title, description and permitted Add property remain; toolbar and disclosure match the selected direction.
- [x] Apply, chips, Clear all, history and pagination preserve the specified URL semantics.
- [x] Inventory/table/sidebar and existing permission boundaries remain intact.

**Non-functional** (performance, security, accessibility, reliability)

- [x] No extra API request, dependency or global styling change.
- [x] Desktop compactness, narrow layouts and keyboard/focus are verified.
- [ ] Native 200% zoom is verified with a full Chrome/Chromium executable.
- [x] API drift, lint, typecheck, unit/build, targeted integration and unaffected-surface smoke checks pass.
- [ ] Repository-wide formatting passes without the existing CRLF-only differences.

---

## 🧪 Validation Plan

**Manual tests**

- Compare reference and desktop/mobile captures. Confirm description, unchanged sidebar, reachable advanced controls, stable focus and real browser zoom.
- Inspect runtime diagnostics with configured tooling when available; document any access limitation.
- Visual-correction follow-up: reviewed live and collapsed/applied-filter captures confirm the retained warm background and corrected toolbar, including the selected reference state.

**Automated tests**

- `bun run api:check`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test`, `bun run build`.
- With the documented disposable backend/proxy: `bun run test:e2e -- tests/e2e/crm-property-inventory-toolbar.spec.ts tests/e2e/properties.spec.ts --workers=1`.
- Add meaningful assertions for draft/applied-state differences, history, invalid queries, slow/error/empty responses, hydration and Agent actions. Do not mutate the normal demo database for testing.
- Follow-up evidence: targeted ESLint/TypeScript checks, 288 unit tests in 46 files and an isolated snapshot production Webpack build passed. No new full disposable-fixture browser run was performed, so the earlier 40-pass/2-native-zoom-skip result remains historical baseline evidence.

**Rollback / mitigation**

- Revert frontend presentation changes; no backend deployment, migration or data rollback required. Keep shared component defaults unchanged to limit regressions.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Risk:** Collapsing fields drops submitted values — _Mitigation:_ one persistent form and a collapse/reopen/Apply regression.
- **Risk:** Chips show draft state or preserve stale edits — _Mitigation:_ derive chips from applied URL filters, navigate from applied state and verify Back/Forward.
- **Risk:** Compactness harms keyboard/mobile use — _Mitigation:_ preserve labels/focus, wrap controls and verify native zoom.
- **Risk:** Shared changes restyle other screens — _Mitigation:_ local overrides, unchanged defaults and smoke checks.

**Open questions** _(blockers for implementation)_

- None. The spec chooses an inline disclosure for advanced fields and retains count in the authorized results section.
