# Project review remediation

Status: Verified (2026-10-26).

## Purpose

Resolve the October 23 project review findings while preserving existing property workflows and API contracts.

## Scope

- Recover failed CRM Server Component reads using Next's re-fetching retry callback.
- Reject invalid RFC UUID property URLs as not found before requesting Express.
- Remove unused property filter/currency/health wrappers, reuse property-type and upload definitions, and use shared photo error presentation in CRM.
- Re-run quality gates and desktop/mobile browser integration against disposable backend data.
- Browser helpers wait for streamed account controls, loading assertions observe the held server read, and public photo tests start with deterministic featured inventory.
- Public search/filter controls stay disabled until their client handlers hydrate, preventing native form submission during streamed loading.
- The Playwright-started Next server disables its floating development indicator to prevent it covering CRM account controls. Runtime error reporting remains enabled.

## Permissions and contracts

Existing live-session, role, Server Action and Express authorization rules remain authoritative. Public property IDs follow the backend UUID contract. No API shape changes. Search implementation belongs to the backend companion specification.

## Acceptance criteria

- [x] A failed CRM inventory read recovers after the service succeeds and the user selects Try again.
- [x] UUID-shaped invalid property paths render the not-found state rather than an outage.
- [x] CRM photos use the shared unavailable-image handling without changing thumbnail layout or decorative alt text.
- [x] Unused wrappers are removed and public filters/upload validation reuse existing feature definitions.
- [x] API drift, lint, formatting, typecheck, unit tests, production build and desktop/mobile browser tests pass.

## Validation

Add meaningful browser regressions for retry, invalid IDs and photo failure; retain existing role, lifecycle, upload and filter coverage. Run the repository quality commands and inspect runtime diagnostics with an active browser.

## Rollout and risks

No client configuration or contract migration is required. `E2E_TEST_RUN` is set only by the Playwright-started frontend process to suppress its development indicator; normal API/runtime behavior is unchanged. Preserve local application data and use isolated browser fixtures.

## Implementation evidence

- CRM inventory reads use Next's retry callback; malformed public property IDs use the existing UUID validation and not-found state before an Express request.
- CRM inventory, property details and photo management use the shared `PropertyImage` unavailable state while preserving caller sizing and decorative alt-text behavior. Public filters reuse feature enums and stay disabled until client hydration, including sort and the filter drawer; client photo feedback shares the 5 MiB MIME/size definition.
- `bun run check` exited 0 on 2026-10-26: API drift, lint, formatting, type checking, 93 unit tests in 16 files and the root Webpack production build all passed.
- `node .delivery-work/review-e2e-isolated.mjs` exited 0 on 2026-10-26 with four workers against temporary fixture ports 3140/4341/4342: 80 cases discovered, 76 passed, and four intentional viewport-project skips. Retry, invalid-UUID, loading, image failure, navigation, permissions, lifecycle and search cases passed with zero failures.
- The final frontend source snapshot matched the browser-tested copy across 102 files. Active-browser diagnostics found no configuration or session errors before intentional fault injection.
