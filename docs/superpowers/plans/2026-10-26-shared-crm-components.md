# 🧩 Shared CRM components

> **Goal:** Implement the approved shared CRM component design without changing feature behavior.

**Status:** Verified on 2026-10-26.

---

## 🎯 Objective

Remove repeated application structure across Properties and Leads.

---

## 📦 Scope

**In scope** — page header, filter panel, typed table/mobile rendering, pagination and labelled text/select fields; existing skill updates.

**Out of scope** — backend changes, new libraries, new business features.

---

## ⚙️ Assumptions & Constraints

**Technical** — preserve server/client boundaries, existing UI primitives, native refs and field accessibility.

**Product / Business** — preserve permissions, filters, responsive content and all existing workflows.

**Dependencies** — existing installed dependencies only; [approved spec](../../../specs/shared-crm-components/spec.md).

---

## 🧩 Proposed Approach

Shared presentation under src/components; typed feature configuration remains in properties/crm and leads/crm. Existing API/data modules unchanged. See spec for exact interfaces and scope.

---

## 🚀 Execution Plan

1. **Shared application UI** — _(role: frontend)_ — add focused rendering tests first, confirm missing shared behavior, implement minimal components, migrate both features and verify existing unit tests. Worker owns components, feature consumers and its tests. No new feature barrels.
2. **Integration verification** — _(role: frontend)_ — review diff, run full frontend checks, isolated build, property/lead desktop/mobile browser tests and runtime inspection. Main owns verification tooling only.
3. **Guidance reconciliation** — _(role: documentation)_ — test existing skill retrieval, update existing skills with actual imports/examples, add AGENTS requirement and architecture/spec/index references. Reconcile final documentation after verified code; review docs diff.

---

## ✅ Acceptance Criteria

**Functional**

- [x] Both features use the shared components and preserve behavior.

**Non-functional**

- [x] Responsive, accessible, typed, server-compatible and free of domain dependencies.

---

## 🧪 Validation Plan

**Manual tests** — completed: live runtime inspection and responsive screenshots at 1440px, 390px and 320px.

**Automated tests** — completed: targeted rendering/accessibility tests, 128 frontend unit tests, lint, formatting, strict typecheck, API drift, isolated production build and 48 property/lead desktop/mobile browser checks.

**Rollback / mitigation** — remove only refactor changes; preserve original local lead work.

---

## ⚠️ Risks & Open Questions

**Risks** — ref loss, aria associations and serialization boundaries; covered by targeted checks.

**Open questions** — None blocking; approved scope from discussion.
