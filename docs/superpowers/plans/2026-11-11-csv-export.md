# 📤 CSV Export Implementation Plan

> **Goal:** Let all staff export filtered leads and properties within their existing access, delivering the export-only portion of P2-04.

---

## 🎯 Objective

Add reliable spreadsheet downloads to the existing CRM lists. **Status: locally verified export-only slice.** Read the [frontend spec](../../../specs/csv-import-export/spec.md), companion `backend/specs/csv-import-export/spec.md` and backend-owned `backend/specs/csv-import-export/contract.md` for the implemented boundary and evidence.

---

## 📦 Scope

**In scope**

- Filtered, sorted CSV downloads for leads and properties, all staff roles, all matching pages, bounded reads and safe serialization.
- Explicit permissions, pending/error recovery, role/browser coverage, contract snapshots and documentation.

**Out of scope**

- Import, spreadsheet updates, duplicate detection, XLSX/PDF, custom columns, selected rows, images, background jobs and deployment.
- Completing P2-04 before import and export for both entities are verified.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Existing independent Express/Prisma/SQLite and Next.js repositories; no cross-repository imports or shared dependency assumptions.
- Backend-only `csv-stringify` 6.9.0 is installed and locked; no frontend package, migration or environment variable was added.
- Limits: **5,000 records / 10,485,760 encoded bytes**, no partial success. UTF-8 BOM, comma, CRLF, safe quoting/formula handling and fixed columns follow the backend contract.
- Reuse stable SQL filter/sort semantics. Revalidate current staff and read export data in one bounded transaction; serialize after releasing it.

**Product / Business**

- User confirmed **all staff within existing access** and **export first**. Agents see their assigned leads and no property owner contacts.
- Export the active view, including the current Admin/Manager default unassigned inbox; never substitute all leads implicitly.
- The caps, fixed column selection and filename/date conventions are proposed defaults for review. Exports are reports; future import formats remain unspecified.

**Dependencies**

- Existing staff session middleware, `requireCurrentStaff`, list filters, same-origin API rewrite and disposable browser fixtures.
- Specs/contract must be reviewed before application implementation. Implementation execution can use `superpowers:executing-plans` in the current chat.

---

## 🧩 Proposed Approach

**Approaches considered**

- **Browser-only export of loaded rows:** requires no backend route, but cannot reliably export every matching page. Rejected for this scope.
- **Bounded backend CSV response — delivered:** applies permissions and database filters centrally and fits the existing request/response architecture.
- **Background export job:** supports larger inventories but introduces job state, storage and retrieval. Defer until measured demand exceeds the bounded design.

**Data flow:** validated list filters → same-origin authenticated GET → Express route/controller → feature service current-staff validation → bounded repository snapshot → shared CSV serializer → browser Blob download. The GET creates no business mutation and requires no Server Action.

**Backend files** (all paths in the independent backend checkout)

- Modify `src/modules/leads/leads.{routes,controller,service,repository,schema}.ts` and `src/modules/properties/properties.{routes,controller,service,repository,schema}.ts` for feature-owned export behavior.
- `src/shared/csv/export.ts` is the shared writer; feature-local lead/property service code owns its explicit column mappings. No thin mapper modules were created.
- Reuse `src/modules/auth/staff-actor.ts`. Extract only concrete filter/order logic shared by list/export, preserving list behavior; avoid a generic export module or unbounded page loop.
- Modify `docs/api/leads.openapi.yaml`, `docs/api/properties.openapi.yaml` and root `docs/api/openapi.yaml` only as needed to expose additive routes. Modify `package.json` / `bun.lock` when installing the chosen CSV writer.
- Added `tests/csv-export.test.ts`, `tests/csv-export-http.test.ts` and `tests/csv-export-authorization.test.ts` for serializer, HTTP and service-level stale-identity authorization contracts.

**Frontend files**

- `src/components/crm/csv-export-button.tsx` owns the shared pending/error/download lifecycle with `{ entity, query, scope }` props. Endpoint and filename validation remain centralized in `src/components/crm/csv-export.ts`.
- Modify [lead inventory](../../../src/features/leads/crm/lead-inventory.tsx) and [lead list page](<../../../src/app/(staff)/crm/leads/page.tsx>) to pass validated session-resolved export filters into the action.
- Modify [property list page](<../../../src/app/(staff)/crm/properties/page.tsx>) to expose export to all staff separately from manager-only creation; keep permissions resolved before activation.
- Modify [lead filters](../../../src/features/leads/data/filters.ts) and [property filters](../../../src/features/properties/data/filters.ts) to add feature-owned `leadExportQuery(filters)` / `propertyExportQuery(filters)` functions returning pagination-free query strings.
- Reconcile `docs/contracts/leads.openapi.yaml`, `docs/contracts/properties.openapi.yaml` and regenerate their existing `src/lib/api/generated/*.d.ts` files; no new generator domain.
- Create `tests/unit/csv-export.test.ts` and `tests/e2e/csv-export.spec.ts`; extend existing feature filter unit tests where appropriate.

**API changes:** additive `GET /api/v1/staff/leads/export` and `GET /api/v1/staff/properties/export`, registered before dynamic ID routes. Success is a no-store CSV attachment; normal JSON errors include `422 EXPORT_LIMIT_EXCEEDED`. Exact queries, columns, mapping and headers are in the backend-owned proposed contract. No existing JSON contract is changed.

---

## 🚀 Execution Plan

1. **Implement safe CSV serialization** — _(role: backend)_ — **complete:** a tested, bounded writer shared by the two features.
   - [x] Reviewed the contract, selected and installed backend-only `csv-stringify` 6.9.0.
   - [x] Added serializer coverage for fixed headers/order, scalar/null mappings, BOM/CRLF, quoted/Unicode/formula-like text, phone text and byte/row bounds.
   - [x] Recorded the initial missing-module RED run before implementation.
   - [x] Implemented `serializeExport` and `sendExport` in `src/shared/csv/export.ts`, with explicit columns from feature services, formula protection, row/encoded-byte caps and pre-response errors.
   - [x] Focused serializer/export/authorization suites pass.
2. **Deliver lead export** — _(role: backend)_ — **complete:** filtered authorized all-page export without changing list behavior.
   - [x] Added HTTP/service tests for access/defaults, filters/order, pagination rejection, bounds and stale current-session/role checks.
   - [x] Recorded RED-to-GREEN export behavior coverage.
   - [x] Added the pagination-free schema, live-current-staff service export and bounded repository selection.
   - [x] Mapped the contracted lead columns in the lead service, used the shared serializer after the read transaction, and registered the controller/route before `/:id`; headers follow successful serialization and filenames use the Dubai export-start date.
   - [x] Updated backend lead OpenAPI and verified error envelopes without CSV download headers/body.
3. **Deliver property export** — _(role: backend)_ — **complete:** role-aware inventory export using the shared writer.
   - [x] Added inventory filter/sort, mapping, role-column, owner-projection, downgrade and bound coverage.
   - [x] Recorded RED-to-GREEN property export behavior coverage.
   - [x] Reused pagination-free property validation with live-current-staff, bounded export selection.
   - [x] Mapped contracted property columns in the property service; registered the route before `/:id`, updated property/root OpenAPI and reused shared response conventions.
   - [x] Ran export/serializer and affected property/lead regression suites; projections exclude excluded/private fields.
4. **Deliver CRM download controls** — _(role: frontend)_ — **complete:** exports on both existing lists with accessible recovery.
   - [x] Copied authoritative operations into existing domain snapshots and regenerated the local types.
   - [x] Added query/lifecycle unit coverage for pending guard, invalid responses, safe filenames, errors, cancellation and cleanup.
   - [x] Implemented the shared Button/Alert-based control: authenticated same-origin no-store GET, one active request, abort/discard stale work, CSV metadata/content validation, Blob/temporary-anchor/object-URL cleanup and contracted status/error copy. It accepts only contracted backend filenames.
   - [x] Added feature query serializers and validated role/session wiring without changing action hierarchy or Agent visibility.
   - [x] Passed affected unit/browser suites and desktop/narrow visual inspection.
5. **Verify integration and reconcile delivery** — _(role: fullstack)_ — **complete:** integration/browser evidence, both isolated whole-repository checks and documentation are complete; verified imports subsequently completed P2-04.
   - [x] Added disposable all-role download coverage through the actual frontend rewrite.
   - [x] Covered empty/error/retry/duplicate/cancellation paths without test-only production behavior.
   - [x] Passed both repository `bun run check` gates, backend disposable database check and focused/affected browser suites.
   - [x] Confirmed normal port 3100 checkout/runtime health and reviewed desktop/mobile keyboard, pending and error captures.
   - [x] Reconciled feature specs/evidence, contract, snapshots, development guidance, tool inventory and synchronized roadmaps; verified imports subsequently completed P2-04.
   - [x] Reviewed the complete diff and checks; no commit/push was performed.

---

## ✅ Acceptance Criteria

**Functional**

- [x] All staff export both entities within existing access, including every matching page and exact filtered sort order.
- [x] Agent lead/owner privacy restrictions are independently enforced by Express using current access.
- [x] CSV columns, decimal/date/null mappings, filenames and no-results/error behavior match the backend contract.
- [x] Pending, retry, cancellation and cleanup work without duplicate or stale downloads.

**Non-functional** (performance, security, accessibility, reliability)

- [x] Bounded queries, row/byte limits and pre-response failures prevent silent truncation or partial files.
- [x] Formula-safe text, explicit column selection, no-store responses and current-staff validation pass targeted tests.
- [x] Responsive keyboard-accessible controls pass unit/browser checks, required repository gates and active-page runtime inspection.
- [x] Both repositories' docs preserve this historical export-only scope; property and lead imports are separately verified.

---

## 🧪 Validation Plan

**Manual tests**

- Review downloaded Unicode/multiline files and spreadsheet text-import behavior for international phone numbers; do not promise CSV controls spreadsheet cell types.
- Review desktop/mobile action wrapping, focus, screen-reader status and error recovery using disposable data.

**Automated tests**

- Backend serializer/HTTP authorization, current-session changes, SQL filter parity, stable ordering, zero/limit/byte boundaries and exact field projections.
- Frontend query/download lifecycle units; real same-origin Playwright downloads for all roles; affected lead/property regression.
- Both repositories: `bun run check`; backend disposable `bun run db:check`; frontend `bun run test:e2e -- tests/e2e/csv-export.spec.ts --workers=1` with documented fixture setup.
- Delivery decision (2026-11-11): cap backend Vitest's default workers at 4 after the 46-worker default run left an existing public-chat fixture at its unchanged 5-second limit while the serial 189-test suite passed. Preserve test timeouts and CLI worker overrides; validate the bounded configuration with a passing `bun run check`. This is test scheduling only, not application/runtime/configuration behavior.

**Rollback / mitigation**

- Remove additive routes/UI/dependency together if acceptance fails. Existing JSON APIs/data remain compatible; no migration or data rollback.
- Narrow filters on 422; defer larger-export infrastructure until demand/performance measurements justify it.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Access changes during export:** authorize and select in one transaction; already downloaded data cannot be recalled after reassignment.
- **Shared-query regression:** extract only concrete reused predicates/order and retain existing list tests; no unbounded pagination loop or full-record loading.
- **Spreadsheet interpretation:** escaping can add an apostrophe to formula-like text/phone values; explain text-column import and test installed writer behavior.
- **Synchronous resource use:** row and encoded-byte caps bound one response; measure representative exports before raising limits or adding jobs.
- **Proxy/download errors:** inspect content type/status before creating a file and exercise downloads through the actual same-origin rewrite.

**Open questions** _(blockers for implementation)_

- No unresolved product blocker. The draft specs/contract and proposed defaults require user review before application implementation; the exact package version is an implementation-time compatibility choice.
