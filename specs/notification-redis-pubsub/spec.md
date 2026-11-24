# Redis notification transport — frontend compatibility

Status: Implemented locally — 2026-11-23. The backend transport is locally verified; frontend production code, configuration and API snapshots remain unchanged.

## Goal

Preserve the CRM notification bell and inbox while backend processes share live refresh signals through Redis Pub/Sub.

## Scope

- Verify existing desktop/mobile notification behavior against the Redis-backed Express transport.
- No new screens, settings, notification types, browser Redis client, dependencies, polling or generated API changes.
- Backend owns the transport/internal message contract in its independent repository at `specs/notification-redis-pubsub/spec.md`; its plan is `docs/superpowers/plans/2026-11-23-notification-redis-pubsub.md`. These are companion-repository paths, not runtime imports.

## User flow

1. Signed-in staff keep the existing bell, unread count, pagination, read action and record links.
2. A change committed through another cooperating API process causes the browser's existing SSE connection to signal an inbox refresh.
3. Redis subscriber recovery causes a refresh even when the browser SSE connection never disconnected. Keep focus and the last successful inbox snapshot during transient failures.
4. Sign-out, revoked sessions, ownership changes and account switching preserve existing private-state cleanup and access checks.

## Contracts and access

- Preserve the [notification contract snapshot](../../docs/contracts/notifications.openapi.yaml), same-origin `GET /api/v1/staff/notifications`, `PATCH /:id/read` Server Action and `GET /stream` EventSource.
- SSE remains `notifications.changed` with `{}` data. Redis carries backend-only recipient hints; the browser never receives its address, credentials, channel, origin IDs or internal message envelope.
- Express remains authoritative for permissions, visible records and unread counts. A refresh signal conveys no authorization.

## Design

Reuse the existing `NotificationBell`, `useNotificationInbox`, account lifecycle, accessible Popover and loading/error/retry behavior. No visual redesign is intended.

## Acceptance criteria

- [x] Existing desktop/mobile notification flows, keyboard focus, read state and account isolation remain unchanged.
- [x] A notification written through API A updates a browser connected to API B using the existing SSE/inbox protocol.
- [x] Backend subscriber recovery refreshes an already-open inbox; browser reconnect also recovers the database snapshot.
- [x] Frontend production code/config and API snapshot remain unchanged.
- [x] Quality gates, notification browser coverage, active-session runtime diagnostics and docs reconciliation passed for local delivery.

## Validation

Frontend `bun run check` passed contract parity, lint, formatting, typecheck, 440 tests in 62 files and build. With `STAFF_E2E_NOTIFICATION_REDIS=1` and a disposable Redis endpoint supplied through `EMAIL_TEST_REDIS_URL`, one isolated run of `tests/e2e/notifications.spec.ts` passed all four desktop/mobile cases. The fixture uses a random notification channel; these test controls are not production configuration. Backend integration tests own the two-process topology and forced Redis failures. The actual port-3100 checkout was identified with Next DevTools while an affected `/crm/leads/[id]` page was open; configuration and session errors were empty.

## Rollout and risks

Backend-only transport activation does not require a frontend product deployment. Preserve [CRM notification behavior](../crm-notifications/spec.md). Database persistence survives missed signals; Pub/Sub itself has no replay. This does not remove SQLite or other multi-instance constraints. Operators must verify deployed SSE forwarding and Redis configuration separately; no deployment or activation is recorded.

## Implementation evidence

Local verification is recorded in Validation. It does not prove production ingress behavior, Redis deployment, broader multi-host readiness, normal-database migration, live SMTP, commit or push.
