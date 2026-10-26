# 🧭 Inquiry Capture and Lead Management Implementation Plan

> **Goal:** Deliver property inquiry capture, manager distribution and secure agent follow-up using the lead-management specifications.

---

## 🎯 Objective

Connect existing property discovery to a complete CRM follow-up workflow. **Status: delivered and verified on 2026-10-26.**

---

## 📦 Scope

**In scope**

- Inquiry card, unassigned inbox, manual create/edit, details, assignment dialog, stage changes, notes/call logs and activity.
- Data migration, backend permissions/contracts, client integration and end-to-end validation.

**Out of scope**

- Kanban, automatic assignment, notifications, viewings/tasks, analytics, lead merging/deletion and private attachments.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Preserve independent repositories, existing SQLite, native Better Auth and property API. No new dependency without a present feature need.
- Express owns rules/persistence; server reads and feature Server Actions use the existing private transport.
- Keep frontend Poppins/public Lora and existing maroon/ivory/charcoal tokens. Support 320px through desktop, keyboard and reduced motion.

**Product / Business**

- Website leads start New/Unassigned; only Admin/Manager distribute. Agents create self-owned manual leads and access current own records only.
- Either phone or email required. AED budget; rent annual. Notes/call logs append-only. All defined stage transitions allowed.

**Dependencies**

- [Frontend design/spec](../../../specs/lead-management/spec.md); companion backend `backend/specs/lead-management/spec.md` and authoritative `backend/specs/lead-management/contract.md`.
- Operational review of retention/privacy and trusted client-identity forwarding before real-customer collection.

---

## 🧩 Delivered Approach

- Add feature-owned leads module following existing backend routes/controller/service/repository layering. Store Lead, LeadNote, LeadActivity and LeadSubmissionReceipt; retain history when property/staff references disappear.
- Add thin CRM routes and `src/features/leads/{data,crm,public}` only as used. Reuse UI primitives/forms/transport; render list results in query-keyed Suspense and assignment in the existing Dialog.
- Backend API is additive: public property inquiry POST; staff lead list/detail/create/edit, assignment/stage PATCH, note POST, activity GET and assignment-candidate GET. Exact shapes/errors live in the backend-owned contract, rather than a second incompatible plan copy.
- Delivered OpenAPI routes are synchronized with repository-local snapshots, and generation/checking covers property and lead types.
- Alternatives considered: direct agent routing requires property-agent ownership and changes the distribution model; Kanban-first adds interaction before the core workflow exists. **Recommended:** manager inbox with quick assignment and full detail pages. Unassigned inbox is the user's selected distribution direction; remaining design defaults still need review.
- **Existing integration files:** [workspace navigation](../../../src/components/layout/workspace-navigation.tsx), [property detail route](<../../../src/app/(public)/properties/[id]/page.tsx>), [API generation](../../../scripts/generate-api.mjs). Companion backend: `prisma/schema.prisma`, `src/app.ts`, `src/modules/auth/staff-operator.ts`, `docs/api/openapi.yaml`.
- **Delivered frontend files:** `src/app/(staff)/crm/leads/{page.tsx,new/page.tsx,[id]/page.tsx,[id]/edit/page.tsx}`; feature `data/{input,filters,queries,actions,types}.ts`, `public/inquiry-form.tsx`, `crm/{lead-list,lead-detail,lead-form,assignment-dialog,lead-activity}.tsx`. Add supporting transport/picker modules only where the implementation needs them.
- **Delivered backend files:** `src/modules/leads/leads.{routes,middleware,schema,controller,service,repository,dto}.ts`, `src/modules/leads/inquiry-limiter.ts`, generated migration directory and feature regression tests.

---

## 🚀 Execution Plan

1. **Data and lead ownership** — _(role: backend)_ — Add migration, DTOs and authorized manual create/list/detail/edit/stage APIs from the contract. Extend account lifecycle handling and preserve property snapshots.
   - [x] First add failing SQLite/HTTP tests in `tests/leads.test.ts`, `tests/lead-ownership.test.ts`, plus migration/staff-operator regression coverage: two-agent isolation, null clears, contact requirement, literal/Unicode search, inactive targets and property/staff deletion.
   - [x] Implement the module and app mount with explicit writes, version checks and transaction-owned events/receipts; exercise create/replay, pagination and all stage transitions.
   - [x] Run `bun run test` and `bun run db:check` in backend; tests must pass with populated migration fixtures. Review migration diff before any real database application.
2. **Assignment and follow-up history** — _(role: backend)_ — Add candidates, assignment, notes/calls and activity endpoints; preserve history and close concurrency races.
   - [x] Add failing `tests/lead-concurrency.test.ts` cases for simultaneous reassignment, former-owner write, stale versions, identical note keys and transaction failure rollback.
   - [x] Implement conditional writes and authorized receipt replay; verify deleted/disabled agent handling and timeline pagination without duplicate note bodies.
   - [x] Run backend `bun run check` and `bun run db:check`; require no permission leakage and no partial history commits.
3. **CRM screens and professional presentation** — _(role: frontend)_ — Build inbox/list, create/edit, details and assignment dialog matching the design spec. Deliver mobile cards/filters, stage controls and timeline.
   - [x] Publish implemented backend OpenAPI definitions, copy approved frontend-local contract/OpenAPI snapshots, extend `scripts/generate-api.mjs`, run `bun run api:generate` and verify `bun run api:check`.
   - [x] Add meaningful input/filter/action tests under `tests/unit/lead-*.test.ts`; cover budget conversion, source immutability, session forwarding and conflict recovery. Implement feature data/forms and routes using existing primitives.
   - [x] Exercise Admin/Manager and two Agent identities through real backend data; check disabled assignee presentation, long text, keyboard focus and 320/390/768/1440px layouts.
4. **Public inquiry capture** — _(role: fullstack)_ — Add the public form, atomic creation/replay and bounded rate limiter; connect submission to the manager inbox.
   - [x] Add failing `tests/inquiries.test.ts`: eligibility, unknown/forged fields, body/Origin/client identity limits, full limiter, idempotent replay after property removal, mismatched key payload and concurrent identical requests.
   - [x] Implement inquiry service/limiter and Server Action/form using the stable submission UUID. Add frontend tests for retained form values, pending guards, timeout explicit replay and unavailable property response.
   - [x] Run end-to-end inquiry → inbox → assignment → agent note/stage in `tests/e2e/leads.spec.ts`; verify real client identity survives the trusted frontend/backend path without accepting spoofed headers.
5. **Verify and reconcile delivery** — _(role: fullstack)_ — Run required checks, browser/runtime review and documentation reconciliation; close only proven roadmap criteria.
   - [x] Run frontend `bun run check`, backend `bun run check` and `bun run db:check`; run frontend `bun run test:e2e` with backend fixture port 4311. Inspect frontend port 3100 identity/runtime while affected pages are open.
   - [x] Verify inquiry, assignment and stage/notes lifecycle on desktop/mobile, including lost response, unauthorized direct URLs, reassignment while a form is open and back-navigation filter state.
   - [x] After code/tests settle, assign final documentation reconciliation to `spec-updater`, owning affected specs, root specs, API docs and shared roadmap copies; review its diff/gaps before completion. Frontend shared-document source first, backend copy second. Check only fully verified IDs; retain partial P1-16/P1-18 coverage accurately.

Each implementation slice should remain independently reviewable. Do not publish public inquiry collection until the CRM inbox and ownership boundary work together.

---

## ✅ Acceptance Criteria

**Functional**

- [x] Visitor inquiry persists once and appears unassigned; Admin/Manager distribute; current agent follows up with notes/calls and stage changes.
- [x] Manual creation/edit and role-specific search/filter/sort/pagination match the detailed specs.
- [x] Assignment dialog, public form and full detail pages match all specified responsive/state behavior.

**Non-functional** (performance, security, accessibility, reliability)

- [x] Backend-enforced ownership, bounded reads, rate limiting and safe DTOs are verified.
- [x] Keyboard/focus/contrast/mobile behavior passes review; uncertain responses and stale writes cannot silently duplicate or overwrite work.
- [x] Migration and all required checks pass; specifications and contract snapshots reflect actual delivery.

---

## 🧪 Validation Plan

**Manual tests**

- Complete the full flow as a visitor, Manager and Agent; test a second Agent's isolation. Review forms, dialog, long content, errors and narrow screens against frontend design acceptance.

**Automated tests**

- SQLite/API ownership, migration/idempotency/concurrency/lifecycle tests; frontend input/action tests; real desktop/mobile browser suite and existing regression suite. Commands are listed in the execution steps.

**Rollback / mitigation**

- Back up SQLite, deploy schema additively, hide/disable inquiry entry before reverting application routes; retain collected lead tables for recovery. Do not drop customer records as an application rollback.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Risk:** Manual inbox distribution delays replies. — _Mitigation:_ visible unassigned count, explicit refresh and an operational monitoring owner; automation stays a later feature.
- **Risk:** Proxy forwarding makes rate limiting ineffective or spoofable. — _Mitigation:_ configure/test explicit trusted ingress before real collection; single-process limiter limitation documented.
- **Risk:** Concurrent edits or agent disable/reassignment lose work or access boundaries. — _Mitigation:_ expected versions, transactional events and current-owner checks; keep drafts for explicit review.

**Open questions** _(blockers for production collection)_

- A deployment owner must approve real-customer privacy/retention wording and confirm the ingress that overwrites the trusted client header and blocks direct Next access.
- Before real-data deployment: confirm the operator-owned privacy/retention policy and deployment's trusted client-identity path. These do not block development with fictional fixtures.
