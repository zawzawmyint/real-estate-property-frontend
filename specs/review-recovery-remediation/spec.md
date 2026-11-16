# Review recovery remediation

Status: Verified maintenance — 2026-11-16

## Goal

Correct misleading CRM recovery states and reconcile the minor maintenance findings from the full implemented-feature review.

## Scope

Validate malformed staff property/detail/edit and task detail route IDs; distinguish property CSV preview failures from uncertain confirmation failures; remove the unused lead mutation receipt option; reconcile stale pre-hydration and local migration notes. Production secret/media-origin issues and optional architectural/SEO work are excluded.

## User flow

After the live staff session check, malformed IDs enter the existing not-found flow before resource reads or agent edit redirects. Valid IDs preserve current role, missing-resource, access-loss and outage behavior. Preview transport/5xx failures instruct staff to retry the preview. Commit transport/5xx failures retain same-file confirmation recovery and uncertainty.

## Contracts and access

No API, data shape, persistence, role or authorization contract changes. Express remains authoritative. Reuse existing UUID schemas, not-found UI, import actions and error envelopes. Removing the unused receipt option changes no receipt or idempotency behavior. Existing backend-owned [property contract](../../docs/contracts/properties.openapi.yaml) remains unchanged.

## Design

Reuse current not-found and import error presentation; no layout or component changes.

## Acceptance criteria

- [x] Invalid property detail/edit and task IDs resolve to not-found without resource reads; live session enforcement remains first.
- [x] Invalid property edit IDs resolve to not-found before the Agent redirect; valid Agent edit routes still redirect.
- [x] Valid route outages retain retry recovery and missing-resource behavior remains intact.
- [x] Offline and 5xx property preview errors give preview-specific guidance; commit errors preserve same-file confirmation guidance and uncertainty.
- [x] The unused lead receipt option and call arguments are removed without changing receipt handling.
- [x] Frontend/backend roadmap and remediation notes reflect the resolved hydration fix and distinguish dated, applied local migration evidence from unverified production deployment.

## Validation

First reproduce with failing route/action regressions, then rerun focused and complete frontend checks. Exercise corrected routes in desktop/mobile disposable browser fixtures and import preview/commit recovery. Reconcile docs after code settles; inspect both Git diffs before any push. Preserve normal databases, local servers and all existing uncommitted CSV work.

## Rollout and risks

No migration, dependency, configuration or backend runtime changes. Authentication must precede ID validation, and notFound must remain outside generic task error handling. Historical evidence stays dated; production deployment is not claimed.

## Verification evidence

Focused regressions changed the route cases from 4 failures and 6 passes to 12 passes, and the import/action cases from 2 failures and 21 passes to 23 passes. Final isolated QA passed backend `bun run check` (53 files / 263 tests and build) and frontend `bun run check` (OpenAPI parity, lint, formatting, route types, 57 files / 403 tests and webpack build). Fresh browser fixtures passed all 30 targeted cases: record recovery 4/4, property import 8/8, lead import 10/10 and CSV export 8/8. Next runtime inspection on port 23100 identified the isolated checkout with empty configuration and session errors. An independent scoped audit found no actionable finding.

The initial combined browser run was cancelled after a known fixture sign-in quota limit; it is not test evidence. The passing suites each used a fresh fixture. The complete browser matrix, production database/deployment/migration state and real user sessions were not exercised. Production secret/media-origin issues remain outside this maintenance.
