# 🧭 CRM Property Matching Implementation Plan

> **Goal:** Let staff find shareable listings from a CRM lead using a saved budget and preferences they confirm.

---

## 🎯 Objective

Give staff a way to find alternatives to a property inquiry and respond to general inquiries that have no property attached. This is Phase 2 item **P2-03**.

---

## 📦 Scope

**In scope**

- A lead detail search with saved Buy/Rent and budget as defaults, plus agent-entered area, type and exact bedrooms.
- Available public listings with prices and links that staff can share.

**Out of scope**

- Automatic extraction from inquiry text, saving additional preferences, and automated outreach.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Express owns authorization and matching. Use existing property search and public listing projections. No migration or provider.
- Apply every filter before stable pagination. The response uses `PublicPropertyList` with a fixed page size of 10.

**Product / Business**

- Staff can search any lead they can already open. Rent budgets are annual. Changing Buy/Rent clears the budget.

**Dependencies**

- [Frontend feature spec](../../../specs/property-matching/spec.md). The backend-owned spec is at `backend/specs/property-matching/spec.md` in the companion repository.

---

## 🧩 Proposed Approach

- Add `GET /api/v1/staff/leads/{id}/property-matches` in the backend lead routes, controller and service. Check current access before calling the property service with explicit filters and no staff inventory projection. Reuse the existing public filters, including the internal exact-bedroom query.
- Add the operation to backend `docs/api/openapi.yaml` and update the frontend leads snapshot and generated types. Call it using the existing staff server transport.
- Add **Find matching properties** next to the budget and original property in [lead-detail.tsx](../../../src/features/leads/crm/lead-detail.tsx). Keep the form and results together in a lead-owned component. Display listing links, applied filters and pagination.

---

## 🚀 Execution Plan

1. **Add authorized matching** — _(role: backend)_ — Cover a general inquiry, another agent's lead, and mixed inventory in `tests/leads.test.ts`. Add the proposed route and operation schema. Verify studio versus unspecified bedrooms, an exact budget boundary, unavailable listings and malformed input.
2. **Connect the lead detail search** — _(role: frontend)_ — Update `docs/contracts/leads.openapi.yaml`, regenerate types, and build the form and results panel. Verify blank and saved budgets, changing purpose, empty results, pagination, retry and access loss in `tests/e2e/leads.spec.ts`.
3. **Verify and record delivery** — _(role: fullstack)_ — Run both repositories' checks and focused browser acceptance with disposable data. Reconcile both specs and roadmaps, and mark **P2-03** complete only when verified.

---

## ✅ Acceptance Criteria

**Functional**

- [ ] General and property-linked leads can both search. Saved purpose and budget prefill and the agent can refine the query.
- [ ] Published, available matches apply all filters before pagination. Rental results show annual pricing and public links.

**Non-functional**

- [ ] Lead access is enforced server-side. The read is uncached and changes no records.
- [ ] Keyboard and narrow-width use work. Stale responses cannot replace a newer search or reopen inaccessible lead context.

---

## 🧪 Validation Plan

**Manual tests**

- Start with a general rental inquiry, filter by area and bedrooms, then open a public link. Repeat with a linked-property inquiry. Check empty and error states at mobile width.

**Automated tests**

- Run `bun run check` in both repositories, then the focused lead Playwright suite against the disposable backend fixture. Assert permission boundaries, exact filters, no writes, stable pagination and unchanged input on retry.

**Rollback / mitigation**

- Deploy the additive backend route first. Revert the frontend entry point before reverting the route. No data migration is required.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Budget unit confusion** — _Mitigation:_ Label rental budgets as annual and clear the budget when changing purpose.
- **Private inventory disclosure** — _Mitigation:_ Return only the existing public listing projection after lead authorization.

**Open questions** _(blockers for implementation)_

- _N/A for this draft. Automatic suggestions from inquiry text are a separate follow-up._
