# 🏡 Property Management Implementation Plan

> **Goal:** Deliver staff property management and public discovery using the agreed Property Finder-inspired Avenor design and reusable shadcn/ui Base Nova components. **Delivered and verified on 2026-10-22.**

---

## 🎯 Objective

Connect the staff-authentication foundation to the first useful business flow: create a draft, add photos, publish, discover and archive a property. **Status: executed and verified.** The feature specs and backend-owned contract record the delivered behavior and evidence.

---

## 📦 Scope

**In scope**

- P1-11/P1-12/P1-13 and filtered listings P1-15; partial P1-14 homepage search/featured and P1-16 detail/gallery, with responsive property screens contributing to P1-18.
- Role-enforced property/photo APIs, SQLite migration, public DTOs, CRM inventory/form, homepage search entry, listings/detail gallery and cross-repository validation.

**Out of scope**

- Inquiries/leads, saved favourites, maps, client portal and full contact/agent/homepage marketing content. P1-19 is delivered separately through the verified demo-property-data specs.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Independent frontend/backend repositories; Next.js consumes Express, Prisma/SQLite and existing public `Storage`. No sibling source imports or root package.
- Node 24.14.1, Bun 1.3.14, current Webpack scripts, existing Better Auth protocol and live guards. Read relevant bundled Next.js guides before frontend code.
- Reuse existing semantic palette and shadcn/ui Base Nova catalog. Add only used official Base UI components; React Hook Form/Zod for interactive forms. No full catalog, TanStack Table, carousel, drag library or toast system.
- Adopted tools: `sharp` 0.35.5 normalises backend uploads; `openapi-typescript` 7.13.0 generates checked frontend declarations. Both are recorded in the synchronized TECH_STACK copies.

**Product / Business**

- **Implemented defaults:** Admin/Manager manage and publish; Agent reads without owner contacts; Admin alone deletes archived records. Residential sale/rent, AED total/annual rent and sqft. Draft/published/archived are distinct from available/sold/rented.
- Published edits go live on save. Only published+available appears publicly. Uploaded listing photos have public URLs even on drafts; private documents remain excluded.
- Property Finder is the agreed information/layout inspiration; the saved mockup and Avenor palette control the visual identity. Do not add unimplemented controls from the reference.

**Dependencies**

- [Frontend spec](../../specs/property-management/spec.md), [contract snapshot](../contracts/properties.md), [visual reference](../design/homepage-maroon-ivory-charcoal.png). Backend-owned spec/contract live in companion repository `backend/specs/property-management/`.
- The implemented role/lifecycle/units decisions are recorded in the feature contract. This plan preserves the execution record and does not broaden the delivered scope.

---

## 🧩 Proposed Approach

**Architecture and data flow**

Public/staff Next.js pages -> backend HTTP transport/proxy -> property routes/controller -> service (permissions/lifecycle) -> repository -> Prisma/SQLite. Photo service decodes bounded raw images and writes through existing Storage. Public and staff DTO projection is explicit; no-store reads initially avoid stale publish/archive caches.

**File responsibilities — delivered property files**

- Backend `prisma/schema.prisma` plus migration provides Property/PropertyPhoto. `src/modules/properties/properties.{schema,dto,repository,service,controller,routes,image}.ts` owns validation/projection, queries, workflows, HTTP and image decoding/normalisation/compensation. `src/app.ts` mounts routes and reuses existing auth guards/storage.
- Frontend [server API entry](../../src/lib/api/server.ts) provides property server requests. `src/features/properties/` owns transport, form/filter rules and presentation; `src/lib/api/generated/properties.d.ts` is generated from the repository-local OpenAPI snapshot.
- Public routes: modify [homepage](<../../src/app/(public)/page.tsx>), add `src/app/(public)/properties/page.tsx` and `properties/[id]/page.tsx`, with route loading/error states where needed.
- CRM routes: extend [existing layout](<../../src/app/(staff)/crm/layout.tsx>) with Properties navigation; add `src/app/(staff)/crm/properties/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`. Keep entries thin and role-aware; backend remains authoritative.
- UI: reused [existing primitives](../../src/components/ui/button.tsx) and added consumed `textarea.tsx`, `native-select.tsx`, `badge.tsx`, `table.tsx`, `pagination.tsx`, `sheet.tsx`, `dialog.tsx`, `alert-dialog.tsx` and `skeleton.tsx` in the same local catalog.
- Tests: backend `tests/properties.test.ts` and frontend unit/API/property browser coverage. The isolated fixture uses real SQLite/storage without duplicating authentication setup.

**API changes**

Public list/detail and staff CRUD/photo endpoints are implemented as specified by the contract. Native auth and health remain intact; the backend OpenAPI, frontend snapshot and generated property types are synchronized. Public/Agent projections exclude private owner data.

**Review focus**

- Simultaneous photo removal/publish/upload must preserve last-photo and 12-photo limits (Task 2).
- Stale roles/revoked sessions and direct mutation requests must enforce current access (Tasks 1, 4).
- Ambiguous create/upload results must not cause automatic duplicate writes (Tasks 3, 4).
- Empty, decimal, exponent and overflowing numeric input must not broaden filters or corrupt price/area (Tasks 1, 3, 5).
- Old public URLs after archive/sold and API outages must produce 404 versus error correctly without private data leakage (Tasks 1, 5, 6).

---

## 🚀 Execution Plan

1. **Property persistence and API** — _(role: backend)_ — contract-compliant, permission-enforced inventory and publishing.
2. **Property photos** — _(role: backend)_ — validated upload, ordering, cover and recoverable cleanup.
3. **Client types and UI foundations** — _(role: frontend)_ — generated business types, transports and used Base Nova primitives.
4. **Staff property workflow** — _(role: fullstack)_ — working inventory and grouped edit/publish flow.
5. **Public discovery** — _(role: frontend)_ — homepage entry, filtered cards and gallery details matching the reference.
6. **Integration and evidence** — _(role: fullstack)_ — verified privacy, roles, responsive UX and synchronized documentation.

**Completion evidence:** Backend `bun run check` passed with 56 tests in 13 files; isolated migration/property-aware database checks passed. Frontend lint, typecheck, API drift check, 51 unit tests and production Webpack build passed. The complete browser suite passed 40 desktop/mobile checks, including 12 property checks; populated public pages passed 27 width checks from 360px through 1440px. The detailed test tasks below are retained as the original execution checklist; the delivered acceptance record is updated below.

### Task 1 — Property persistence and API

**Consumes:** existing `requireStaff`, Prisma client, nested AppError envelope and the exact property contract. **Produces:** public/staff list/detail and staff create/PATCH/delete endpoints; exported feature-local `createPropertyRouter(...)` mounted in app.ts. Dependency arguments follow existing app/test construction; do not introduce a DI container.

- [ ] Add `tests/property-migration.test.ts` asserting existing auth records survive the additive migration and property/photo FK persistence survives reopening SQLite. Run `bun run test -- property-migration` and confirm the missing-model/migration failure.
- [ ] Implement Property/PropertyPhoto schema and migration; preserve auth schema. Run the migration test against an isolated temporary DB and require PASS.
- [ ] Add `tests/properties.test.ts` cases: draft nullable fields; required publish fields/photo; exact public and Agent allowlists; all roles/current-role changes; missing/foreign Origin; publish/archive/restore/sold/rented; invalid transitions; filters/pagination/tie-breakers; invalid UUID/unknown keys; no-store/404/outage distinctions. Run `bun run test -- properties` to confirm meaningful missing-route failures.
- [ ] Implement feature validation, projections, repository, service and routes per contract. Use explicit public/private selects, integer money/area storage, trusted-origin guards and current sessions. Keep JSON limit and auth mounting intact. Publishing initially rejects zero-photo records; Task 2 enables the success path.
- [ ] Update backend OpenAPI with these implemented operations and matching errors. Run property tests, `bun run check` and `bun run db:check` against isolated migrated data. Record result and review this backend slice before proceeding; commit only scoped intended files if commits are requested.

### Task 2 — Property photos

**Consumes:** Task 1 property lifecycle/repository and existing Storage. **Produces:** contract photo upload/order/delete endpoints returning StaffProperty with generated public Photo URLs; publish succeeds with valid saved photos.

- [ ] Add `tests/property-images.test.ts`: valid JPEG/PNG/WebP, mismatched MIME, corrupt/animated/SVG content, 5 MiB boundary and chunked overflow, 25M-pixel boundary, stripped metadata/orientation, 2400px cap; cross-property IDs, exact permutation, cover, 12-photo count, last published photo, archived writes and failed DB/file operations. Include concurrent publish/remove/upload invariant tests. Run targeted tests and confirm failures.
- [ ] Pin a Node 24/Windows-compatible sharp version using current official docs; implement the feature-local decoder and guarded raw-body parser. Save through Storage, compensate failed DB attachment and handle deletion after DB commit. Serialise invariant-sensitive DB mutations; no multipart parser is needed.
- [ ] Add photo operations/schemas to implemented OpenAPI. Run photo and property tests and `bun run check`; require PASS. Document a safe orphan/failed-cleanup dry-run/retry procedure and matching DB/media backup before treating recovery acceptance as met.

### Task 3 — Client types and UI foundations

**Consumes:** implemented backend OpenAPI and exact snapshot. **Produces:** generated types plus `api.ts` typed methods for public/staff list/detail/create/update/delete/upload/reorder/remove; input/filter conversion functions consumed by Tasks 4–5.

- [ ] Pin `openapi-typescript` as a frontend dev dependency. Copy the backend-owned OpenAPI to `docs/contracts/properties.openapi.yaml`; generate and commit `src/lib/api/generated/properties.d.ts` from that repository-local snapshot. Add `api:generate` and `api:check` scripts: generation writes those declarations; check regenerates to a temporary file and fails on differences without changing tracked source. No runtime or type imports across repository folders. Keep native Better Auth client untouched.
- [ ] Add unit cases for exact AED->fils conversion, area precision, Studio, invalid/overflow/empty filter input, URL page reset, parameter preservation, private/public DTO usage and API error propagation. Run `bun run test -- property` and confirm missing-function failures.
- [ ] Implement `input.ts`, `filters.ts` and API transport with no-store reads, server-only origin handling, same-origin mutation requests and no automatic write retries. Expose pure `parsePropertyFilters(searchParams)` and `serializePropertyFilters(filters)` around the contract query shape; expose `parseAedToFils(value)` returning a valid integer or a validation result, never rounded arbitrary input.
- [ ] Audit current UI sources, then add only consumed official Base Nova components. Bind form controls through React Hook Form and local Field primitives. Verify Base UI APIs against current docs; add semantic token variants only when used.
- [ ] Run targeted unit tests and frontend `bun run check`; require PASS. Reconcile adopted dependencies and generation commands in both TECH_STACK copies and frontend API docs.

### Task 4 — Staff property workflow

**Consumes:** generated StaffProperty and Task 3 methods/primitives. **Produces:** Properties navigation, inventory, create/edit/read-only routes and working photo/publishing actions.

- [ ] Extend the isolated auth/backend browser fixture to create temporary property data/media without touching developer databases. Add staff cases in `tests/e2e/properties.spec.ts`: save draft before uploads, publish validation, owner visibility by role, draft/live edits, upload failures/refetch, cover/order/remove, archive/restore, Admin confirmation/delete, Manager delete rejection and revoked/changed sessions. Include double click and dropped response cases. Confirm the property route/UI failures before implementing.
- [ ] Implement inventory/table/mobile cards and a grouped form with a desktop publishing panel. Agent uses a read-only property detail view, without owner contacts. New draft redirects only after confirmed creation; failed responses preserve entered fields and explain uncertain results without automatic resubmit.
- [ ] Implement sequential photo uploads, saved-state refresh, accessible cover/order buttons and truthful pending/error states. Guard duplicate mutations and restore focus after confirmation. Explain public photo URLs and immediate published edits in the relevant UI.
- [ ] Run targeted property browser cases on desktop/mobile with backend 4311/frontend 3100; require PASS. Review keyboard use and all roles visually before proceeding.

### Task 5 — Public discovery and gallery

**Consumes:** public DTOs/list/detail methods and Task 3 URL filters. **Produces:** searchable homepage entry, `/properties` and `/properties/[id]` without inquiry/favourite controls.

- [ ] Add browser cases for Buy/Rent URL search, combined filters, sorting/page reset, back/forward/reload, featured eligibility, empty states, Studio/rent/year, one/twelve-photo gallery, keyboard/Escape/focus, private-data absence in HTML/network and archive/sold/missing ID versus API outage. Confirm failures before implementing.
- [ ] Implement photo-led cards and responsive public layouts using the saved mockup, semantic palette and local primitives. Homepage uses explicit featured records and safe hero fallback; omit unimplemented promotional destinations. Add bounded media-origin configuration only if required by the actual image implementation.
- [ ] Implement mobile Sheet filters, accessible Dialog gallery, real 404 handling, no-store reads and reserved/lazy image dimensions. Avoid loading hidden full-size gallery images on the listing page.
- [ ] Run targeted property browser tests on desktop/mobile and frontend `bun run check`; require PASS. Capture 360px/mobile and desktop screenshots for comparison with the saved design.

### Task 6 — Integration and documentation

**Consumes:** all implemented screens/contracts/tests. **Produces:** reviewed evidence and honest roadmap/spec status.

- [ ] Run backend `bun run check` and `bun run db:check` against isolated migrated SQLite; frontend `bun run check`; then the full frontend `bun run test:e2e` with isolated backend on 4311. Check output, not just process startup.
- [ ] Manually complete create->upload->publish->search->detail->live edit->archive->restore->republish->archive->delete, including stale public URL and role changes. Compare screenshots against the design criteria and inspect public HTML/responses for owner data.
- [ ] Reconcile backend OpenAPI, frontend snapshot/generated types, root specs, feature specs, specs indexes, development/API instructions, adopted tools and both roadmap copies. Preserve partial checklist IDs unchecked.
- [ ] After code/checks settle, delegate final documentation reconciliation to the `spec-updater` agent per workspace instructions, with docs-only ownership and no concurrent documentation edits; wait, review its diff and resolve gaps. If delegation is unavailable, perform the same review inline.
- [x] Record actual checks/screenshots/remaining gaps before marking verified. No environment, SQLite, uploads, dependency folders or build outputs were committed; no push/deployment was performed.

---

## ✅ Acceptance Criteria

**Functional**

- [x] Staff can complete the property lifecycle and photos under the specified role matrix; visitors can search and inspect eligible listings.
- [x] Draft/private/unavailable records and owner contacts do not leak into public surfaces; Agent owner access is denied.
- [x] Public design matches the agreed visual direction; CRM stays simple, responsive and composed from reused shadcn/ui primitives.
- [x] P1-11/P1-12/P1-13/P1-15 and P1-19 are checked after complete verification; P1-14/P1-16/P1-18 stay unchecked because their remaining scope is deferred.

**Non-functional** (performance, security, accessibility, reliability)

- [x] Current sessions/roles, trusted mutation origins, bounded/decoded images and transactional lifecycle/photo invariants pass real integration checks.
- [x] Keyboard/focus/contrast, 360px layout, reserved image dimensions and truthful error/retry states pass review.
- [x] Contracts, generated types, operational recovery and repository docs agree with verified behavior.

---

## 🧪 Validation Plan

**Manual tests**

- Full lifecycle in both desktop/mobile and Admin/Manager/Agent; visual mockup comparison and public privacy inspection.
- Upload interruption, API outage, expired session, zero results, long content and keyboard filter/gallery/confirmation flows.

**Automated tests**

- SQLite migration/service/HTTP/image tests, frontend input/filter/API tests and real desktop/mobile Playwright integration described in Tasks 1–6.
- Both repository quality checks and isolated database check. No repeated broad runs unless changes/failures justify them.

**Rollback / mitigation**

- Before migration preserve a compatible SQLite/media/application snapshot. Deploy backend before frontend; roll back matched artifacts together after evaluating new data.
- Recover orphan media through documented dry-run/maintenance procedures. Archive/unpublish affects discovery; previously shared image URLs are public.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Risk:** Reference-site scope expands — _Mitigation:_ implement only named screens and controls; inquiries remain later work.
- **Risk:** Role/lifecycle rules require future product changes — _Mitigation:_ revise the contract and acceptance evidence before changing enforcement.
- **Risk:** Public media mistaken for private storage — _Mitigation:_ upload disclosure, separate future document store and no secrecy claims for drafts/archives.
- **Risk:** Database/filesystem failure or concurrent photo writes breaks listings — _Mitigation:_ transactions, compensation, recovery procedure and failure/concurrency tests.
- **Risk:** Tooling/type snapshots drift — _Mitigation:_ pin only adopted tools, deterministic generation checks and shared documentation reconciliation.

**Open questions** _(blockers for implementation)_

_N/A for the delivered scope._
