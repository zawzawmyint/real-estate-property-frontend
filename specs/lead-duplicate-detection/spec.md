# Lead duplicate detection

Status: Verified delivery — 2026-11-17. P2-05 is complete; deployment and normal-database migration remain separate operational work.

## Goal

Recognize repeat contacts before staff intentionally create separate leads, without losing legitimate inquiries.

## Scope

Manual create, changed-phone editing, existing-lead list/detail review, Admin/Manager lead CSV preview/commit and staff visibility of repeated public inquiries. All stages participate. UAE national phones match their +971/00971 equivalents; other countries need explicit + or 00 international input.

Exclude merging, deletion, reassignment, fuzzy/name/email matching, public duplicate disclosure, messaging and a persistent review/resolve workflow.

## User flow

1. Create/edit uses the existing lead form. Check a supplied phone on blur, keep draft values and show a labelled checking state. Ignore out-of-order responses. No supplied phone means no phone check.
2. Visible matches show "Possible duplicate phone number", the accurate scoped count, at most 20 accessible summaries, and links to existing records. Explain that a shared number can represent a separate opportunity. The explicit unchecked control reads "I reviewed the matches and want to save a separate lead." It gates saving only when applicable.
3. Changed phone or fresh backend review clears acknowledgement. Formatting-only edits of an already recognized number and unrelated edits do not prompt. A check outage offers Retry and never claims no matches; save-time enforcement remains authoritative. Session/access loss uses existing recovery.
4. Existing lead rows/detail show scoped other-lead counts. A "Possible duplicates" list filter combines with existing URL filters, pagination and export. Detail offers the same accessible match review. Ambiguous legacy phones show a correction hint instead of a misleading no-match assertion.
5. CSV preview retains errors and first-20-row preview. A separate bounded warning region reports existing and within-file repeated phones across all rows, accurate totals/truncation and example matches/row references. One unchecked batch acknowledgement allows creation of every valid row. Invalid rows still block the whole batch.
6. Commit-time stale matches preserve the draft/file and submission identity, re-preview, clear acknowledgement and require explicit confirmation. Successful-response loss/reload uses existing receipt recovery; never turn an uncertain result into a new submission automatically.
7. Public inquiry forms receive phone-format guidance but no duplicate UI/status. Repeated inquiries remain accepted, then become visible through authorized CRM indicators.

For pending version-1 import recovery after upgrade, reselect and verify the original file's v1 digest, then explicitly retry the stored v1 commit identity before any v2 preview. A compatible receipt completes recovery without another import. Transport/5xx retains that same v1 identity for retry. A definitive stale/conflict result or unavailable original file requires the existing explicit duplicate-risk acknowledgement before discarding old recovery and creating a new v2 preview/batch. Never silently overwrite old metadata. Version-2 recovery continues through re-preview of the same file/identity.

## Contracts and access

Use the [backend-owned contract snapshot](../../docs/contracts/lead-duplicate-detection.md), copied from the backend contract. Backend remains authoritative; the snapshot is documentation, not a second editable API source. The executable backend OpenAPI and generated frontend declarations are updated by their owned workflows.

Admin/Manager can see all agency matches; Agent matches and counts include only their currently assigned leads. Never show hidden counts, owner names, links or acknowledgement requirements. No backend URL, database access or phone parser runs in the browser. The backend uses installed `libphonenumber-js` 1.13.16 with full metadata.

A new body-based staff duplicate-check is called through a feature-owned Server Action with live session/Origin/actor checks. Use existing data/actions, safe serializable outcomes and no automatic write retries. Extend create/patch acknowledgement, list filter/count and lead import v2 while preserving successful receipt identity and property import behavior. E.164 canonicalization is exact, not proof of contact identity.

## Design

Reuse existing Alert/AlertDescription, labelled fields, Button, shared table/filter/pagination and native labelled checkbox controls, following the existing property-form convention. The acknowledgement is a simple boolean: do not add a custom primitive, component-catalog entry or dependency. Keep match review feature-local in lead-duplicate-warning.tsx; do not create a generic duplicate framework. Integrate lead-specific import warning content through a small optional shared CSV extension; property import receives no changed behavior.

Use an accessible checkbox label, descriptive existing-lead links, polite status announcements and focused conflict summary. Preserve keyboard control, dirty-form protection, hydration guards and same-tick submission guards. Fit 320/390/768/1440px and native 200% zoom. Warning content must not depend on color alone.

## Acceptance criteria

- [x] UAE examples match; explicit foreign international phones and email-only leads work; foreign national/ambiguous numbers receive useful validation.
- [x] Preview shows scoped summaries/counts with correct empty/loading/error/truncation and stale-response behavior.
- [x] Acknowledgement is explicit, cleared on changed phone/review and enforced by the backend; unrelated edits do not re-prompt.
- [x] Agent accounts cannot infer inaccessible matches through lists, check responses, warnings or conflicts.
- [x] Existing leads across all stages show accurate counts and filter membership before pagination; export preserves the filter and fixed columns.
- [x] Import v2 warns across the complete file/database, requires batch acknowledgement and retains existing all-or-nothing semantics.
- [x] Definite stale-review conflicts differ from uncertain-save failures; manual/import retries and pending committed v1 recovery do not duplicate records.
- [x] Public repeated inquiries are accepted without duplicate disclosure and appear in staff review.
- [x] Warning flows pass keyboard/mobile/zoom, current-session and navigation-recovery checks.
- [x] Frontend/backend checks, OpenAPI parity, targeted and existing cross-repository browser regression and active-page runtime inspection have recorded passing evidence.

## Validation

Unit/action tests cover response schemas, stale responses, acknowledgement invalidation, filters, status-specific recovery and v1/v2 identity handling. Backend integration covers race/permission guarantees. Browser tests cover manual create/edit, another Agent's hidden matches, public-to-CRM repeats, legacy correction hints, CSV within-file/database matches beyond displayed rows, stale confirmation and response loss.

Run bun run check and bun run test:e2e with disposable backend services. Inspect the correct frontend checkout through Next DevTools with the affected page open. Record screenshots and runtime diagnostics without touching real CRM data.

### Test-fixture isolation and final browser evidence

The patched 16.4.6 targeted duplicate suite passed 21 cases with one intentional skip, and current-session MCP runtime inspection reported `configErrors=[]` and `sessionErrors=[]`. The test-only fixture isolation provisions separate disposable Admin, Manager and Agent identities for the `csv-export`, `lead-import` and `property-import` namespaces and desktop/mobile coverage; each affected file reuses a cached signed-session helper that performs a live `get-session` role/ID check. The real five-sign-ins-per-email-per-15-minutes safeguard remains enabled and no normal database changes. A focused browser run passed 60 of 64 registered cases with four expected mobile skips. The final clean serial run passed all 394 expected cases of 468 registered, with 74 expected skips, zero unexpected/flaky results and exit 0. Root reviewed final native 200% evidence: the complete warning/acknowledgement/save region is readable in the viewport, `innerWidth`/`scrollWidth` are both 640, and the warning rectangle (x32, y113, 576×226) stays inside the 452px viewport.

The current diagnostic serial run found two test-compatibility corrections before that rerun: `task-helpers.ts` must create its repeated-phone setup through the existing `createReviewedLead` path so `taskLead` explicitly acknowledges the real duplicate guard, and the stale public-component-reuse missing-contact expectation must match the established `Enter...` validation message. These are test-only changes: task suites already use isolated namespace/project accounts and session caching; no production authentication, rate-limit, validation copy or product behavior changes. Existing described-by, anchor and no-write assertions remain.

The diagnostic log identified a cold `/login` recompilation after normal Next on-demand route eviction during an earlier serial attempt. The final test-only `E2E_TEST_RUN` configuration keeps the bounded regression route set warm with `onDemandEntries.maxInactiveAge = 60 * 60 * 1000` and `onDemandEntries.pagesBufferLength = 64`, alongside the existing hidden test-only dev indicator. Default development and production settings, timing assertions and application behavior remain unchanged.

The route-retention run cleared the earlier navigation issue but exposed one mobile lazy-image test setup failure. The final test-only setup narrows missing-photo injection to backend `/media/` image requests so it cannot abort Next font assets under `/_next/static/media/`, and scrolls the existing property-image wrappers into view before unchanged fallback checks on detail, edit and inventory surfaces. This enables native lazy loading only; product image code, fallback assertions and timeouts are unchanged.

## Rollout and risks

Coordinate frontend/backend deployment after migration/backfill; older clients must re-preview new imports and cannot bypass new acknowledgements. Preserve established receipt handling, including committed v1 imports. There is no automatic merge or phone uniqueness constraint. Some historical phones cannot be classified until corrected.

## Implementation evidence

Implementation is present in both repositories, including the nullable indexed canonical-phone migration, idempotent backfill/startup verification, backend-owned review routes and write guards, the generated-contract update, and CRM/public/import integrations. Backend `bun run check` passed with 275 tests across 58 files; fresh/populated/idempotent disposable migration and database checks passed. A local 10,000-existing-lead plus 500-row CSV measurement recorded 1066.9 ms preview and 1620.6 ms commit.

Root engineering remediated the confirmed Next.js advisory by updating `next`/`eslint-config-next` from affected 16.4.2 to exact 16.4.6 while retaining React 19.3.1. The official post-upgrade assessment is unaffected. After the final test-only updates, frontend `bun run check` passed API drift, lint, formatting, typecheck, 414 tests across 60 files and a production Webpack build with 20 static pages; backend `bun run check` passed lint, formatting, typecheck, 275 tests across 58 files and a production build. The final clean serial browser result, runtime, responsive and native-zoom evidence is recorded above. P2-05 is verified; no deployment or normal-database migration has been performed.
