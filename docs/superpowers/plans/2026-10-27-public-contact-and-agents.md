# 🏡 Contact and Agent Pages — Brief Implementation Plan

> **Goal:** Deliver professional Contact, Agents and Agent Profile pages, with enquiries entering the existing CRM.

---

## 🎯 Objective

Implement **P1-17** so visitors can meet the public team and send a property enquiry. Follow the [feature specification](../../../specs/public-contact-and-agents/spec.md) and [contract](../../contracts/public-contact-and-agents.md). **Verified for the fictional demo delivery; real-business publication remains gated.**

---

## 📦 Scope

**In scope**

- `/contact`, `/agents`, `/agents/[slug]`, navigation/footer integration and complete responsive states.
- Public editorial content and enquiry → unassigned CRM lead → manager assignment.

**Out of scope**

- Content editors, agent-specific listings, automatic assignment, outbound messaging and new dependencies.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Preserve Next.js/Express boundaries, shared components, lead permissions and receipt protections. No migration was required.

**Product / Business**

- **Confirmed:** working inquiry form. Require Buy/Rent intent, name, message and phone or email.
- Curated public profiles are separate from staff accounts, with maroon/ivory layouts and coordinated portraits.

**Dependencies**

- Approved real contact details, profile content, portraits and inquiry usage wording before real-business publication; clearly labelled demo content can be used meanwhile.

---

## 🧩 Delivered Approach

- Added a backend `agency` module for public content and extended existing Leads for general enquiries.
- Added thin public routes and `src/features/agency/` components, reusing [PublicSectionHeader](../../../src/components/layout/public-section-header.tsx), fields, alerts and [navigation](../../../src/components/layout/public-header.tsx).
- Added `sendAgencyInquiry` to [lead actions](../../../src/features/leads/data/actions.ts) and a public enquiry form in Leads.
- Delivered agency read, agent list/detail and `POST /api/v1/public/inquiries`, with synchronized backend OpenAPI and frontend snapshots/[type generation](../../../scripts/generate-api.mjs).

---

## 🚀 Execution Plan

1. **Public content** — _(role: backend)_ — completed catalog and safe published-profile APIs, with privacy, bounds, 404 and outage coverage.
2. **Enquiry capture** — _(role: backend)_ — completed atomic lead/activity/receipt flow, validation, shared rate limits and duplicate/concurrency coverage.
3. **Contact page** — _(role: frontend)_ — completed contact layout/form with pending, receipt, validation and uncertain-retry states.
4. **Agent pages** — _(role: frontend)_ — completed directory/profile design, portraits/fallbacks, metadata and navigation.
5. **Verify delivery** — _(role: fullstack)_ — completed portrait visual review, full browser regression and documentation reconciliation; P1-17 is verified.

---

## ✅ Acceptance Criteria

**Functional**

- [x] All three page types work; an enquiry creates one lead/activity/receipt and follows existing assignment permissions.
- [x] Existing property inquiries and public/CRM journeys remain compatible.

**Non-functional** (performance, security, accessibility, reliability)

- [x] Public DTOs exclude private data; shared request protections remain enforced.
- [x] New pages pass four viewport sizes, 200% text, reduced motion and image-stability review. Targeted desktop/mobile form states cover keyboard/focus and accessible names; no manual screen-reader session is claimed.

---

## 🧪 Validation Plan

**Manual tests**

- Review Contact/directory/profile screenshots at 320, 390, 768 and 1440px; exercise enquiry → manager inbox → Agent assignment.

**Automated tests**

- Test projections, receipts/concurrency, quotas, failures and navigation; run both repositories' lint, format, types, tests/builds, API drift and full browser regression.

**Rollback / mitigation**

- Remove new routes/navigation while retaining captured leads; preserve legacy inquiry contracts.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Risk:** Private staff data or unsupported listing claims — _Mitigation:_ separate catalog, explicit public DTOs and agency-wide property links.
- **Risk:** Duplicate enquiries or split rate budgets — _Mitigation:_ receipt-based explicit retry and one shared limiter.

**Open questions** _(blockers for implementation)_

- P1-17 is verified for the fictional demo. Approved real facts and live inquiry usage wording remain publication inputs before a real-business release.
