# 🔔 CRM Notifications Implementation Plan

> **Goal:** Deliver live, persistent staff notifications for lead assignment, viewing changes, task reminders and website inquiries.

---

## 🎯 Objective

Help staff respond to changes without refreshing the CRM. Deliver **P2-02** first and use the same inbox for the three subsequent workflows.

---

## 📦 Scope

**In scope**

- Four independently verifiable slices. Lead assignment establishes the inbox, unread state, read action and SSE connection. Viewing changes, task reminders and website inquiries add producers.

**Out of scope**

- Email and external push. A future email slice can reuse workflow rules and add a durable delivery record with retries. The internal inquiry alert does not close P2-01.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Use the existing Express, Prisma/SQLite, Better Auth and Next.js stack. Start with one long-running Express process and verify the intended ingress supports streaming.
- Apply the existing staff authorization rules. Persist changes in their existing transactions, send payload-free SSE invalidations after commit and reconcile from the inbox endpoint after reconnect.

**Product / Business**

- Viewings notify the current lead assignee except for self changes. Task reminders target that assignee within a 30-minute window. New website inquiries notify active Admin and Manager users.

**Dependencies**

- [Frontend specification](../../../specs/crm-notifications/spec.md) and companion backend specification at `backend/specs/crm-notifications/spec.md`.
- Backend migration and contract precede the frontend integration. A single production process runs the reminder scan every 60 seconds.

---

## 🧩 Proposed Approach

- Add `backend/src/modules/notifications/` with explicit routes, controller, service, repository and stream fanout. Existing Leads, Viewings and Tasks modules own their trigger and recipient rules. Use `createNotification(input, tx)` with a recipient, type, source IDs and occurrence key; `transactionWithChanges` publishes the affected recipient IDs only after its transaction commits.
- Wire the live transport at backend startup behind publish and subscribe operations carrying recipient IDs. Implement the in-process transport first. A future Redis Pub/Sub adapter fits this boundary and can be selected at startup. Persist and read inbox state through SQLite independently of the transport.
- Modify `backend/prisma/schema.prisma` with an additive migration. Register the notification routes in `backend/src/app.ts`; wire scheduler and stream shutdown into `backend/src/server.ts` alongside the existing lifecycle. Document the proposed inbox, read and stream endpoints as backend-owned OpenAPI during implementation, then generate the frontend snapshot with `bun run api:generate`.
- Add `frontend/src/features/notifications/`. Mount the feature once in [CRM layout](<../../../src/app/(staff)/crm/layout.tsx>) and use a slot in [WorkspaceShell](../../../src/components/layout/workspace-shell.tsx) for the responsive bell. Reuse the same-origin API path and confirm the stream flushes through [Next rewrites](../../../next.config.ts). Keep mark-read in a feature Server Action with the existing staff and request boundary.

---

## 🚀 Execution Plan

1. **Persist assignment alerts and expose the inbox** — _(role: backend)_ — completed: additive migration, recipient-scoped pagination/read state and P2-02 trigger.
   - Add `backend/tests/notifications.test.ts` coverage for manager create/assign/reassign/unassign, self-create, receipt replay, conflict and rollback. Verify the old agent loses both the item and unread count. Run the focused suite before and after implementation.
   - Add transactional writes in `backend/src/modules/leads/leads.service.ts` and recipient-scoped `GET /api/v1/staff/notifications` and `PATCH /api/v1/staff/notifications/{id}/read`. Test that other-user IDs and stale rows return 404 and that a repeated mark-read preserves the original timestamp.
2. **Deliver live updates and the CRM bell** — _(role: fullstack)_ — completed: one authenticated stream per mounted workspace plus live and offline browser coverage.
   - Cover independent connections, recipient-only fanout, 15-second heartbeats, revocation and disconnect/shutdown cleanup in `backend/tests/notification-stream.test.ts`. Inject a test transport to verify wiring and confirm publish failure leaves the successful assignment and inbox row intact. Signal only after commit and send `notifications.changed` with `{}`.
   - Add `frontend/tests/e2e/notifications.spec.ts`. Verify that a manager can assign a lead and a separately signed-in agent sees one alert without a reload. Cover reconnect, sign-out/account change, retry, read persistence and stale responses during refresh. Run the suite against the same-origin route and use a 320px viewport and keyboard.
3. **Add viewing alerts** — _(role: fullstack)_ — completed: committed reschedule and cancellation notify the current assignee; tests cover unchanged time, self changes, missing assignee and stale versions.
4. **Add due task reminders** — _(role: fullstack)_ — completed: startup scheduler scans earliest due tasks every minute, capped at 100 candidates. It uses an injected clock after the SQLite lock and a per-task, due-time and recipient dedupe key.
5. **Add website inquiry alerts** — _(role: fullstack)_ — completed: both public inquiry paths fan out to eligible staff, prevent receipt replay duplicates and retire alerts on assignment.
6. **Reconcile verified delivery** — _(role: fullstack)_ — completed: both specs, root overviews and roadmap copies record verified P2-02 and the three supplemental slices.

---

## ✅ Acceptance Criteria

**Functional**

- [x] All four triggers follow their specified recipient and deduplication rules.
- [x] Staff see live updates, can open and mark items read, and recover unread items after reconnect.

**Non-functional**

- [x] No cross-recipient data or events. Stale ownership and revoked sessions lose access. Slow or closed connections release resources.
- [x] Keyboard, 320px mobile and replay safety are verified. Production ingress streaming remains an operational release check.

---

## 🧪 Validation Plan

**Manual tests**

- Completed targeted Edge coverage: live assignment, persisted read, desktop Ctrl-click, offline catch-up, reassignment, revoked-session re-sign-in, 320px keyboard use, retry and pagination race handling. The isolated Next Webpack server proxied to a disposable Express fixture; deployed ingress was not exercised.

**Automated tests**

- Backend: 173/173 tests in 43 files, ESLint, `tsc --noEmit`, production build, disposable migrated `db:check`, and fresh/populated migrations passed. Frontend: 306/306 tests in 49 files, API drift, lint, typecheck, isolated production Webpack build and exact notification-contract snapshot parity passed.

**Rollback / mitigation**

- Roll back frontend subscription and backend application code. Retain the additive table and stored data so the previous build can continue serving existing records.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Buffered stream:** The current endpoint sets `Cache-Control: no-store, no-transform` and `X-Accel-Buffering: no`; deployed ingress is still unverified. _Mitigation:_ test the deployed proxy before release.
- **Process-local fanout:** Keep the first deployment single-instance. Revisit signal distribution before adding replicas.
- **Duplicate or obsolete reminders:** Use a unique occurrence key and recheck the current task and lead in the write transaction. Test repeat scans and changes made between candidate selection and insert.

**Open questions** _(blockers for implementation)_

- No implementation blocker remains. Confirm deployed ingress before release. Email recipients, provider and sending policy belong to a later specification.
