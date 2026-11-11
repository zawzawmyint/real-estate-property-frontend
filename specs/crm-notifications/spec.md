# CRM notifications

Status: Verified, 2026-11-10

## Goal

Give CRM staff a bell that updates live and keeps unread alerts available across page navigation and sign-in.

## Scope

- P2-02: inbox, unread count, mark as read and live lead assignment/reassignment alerts.
- Supplemental delivered slices on the same inbox: viewing reschedule/cancellation, upcoming follow-up task and website inquiry alerts.
- Staff email, client email, browser push and notification preferences are follow-up work.

## User flow

1. Signed-in staff see a bell in the CRM workspace on desktop and mobile. A positive unread count appears on the bell. On connection and reconnect the CRM reads the current inbox; on SSE change it refreshes that snapshot without moving focus.
2. Opening the bell shows newest alerts first with their timestamp and read status. Show loading, empty and retry states, and a **Load more** control if there is another page. If a background refresh fails, keep the last successful list visible with a retry control.
3. Each alert has a clear link: **New lead assigned** or **New website inquiry** opens the lead, **Viewing rescheduled** or **Viewing cancelled** opens the viewing, and **Follow-up task due soon** opens the task. Opening requests a read update; if it fails, retain unread state for retry. The destination still uses its existing access checks.
4. Clear inbox state and close the stream on sign-out or account change. An authorization failure clears private state and uses the existing staff session behavior.

## Contracts and access

The companion backend specification owns the implemented inbox, read and SSE contracts under `/api/v1/staff/notifications`; its local OpenAPI snapshot is [notifications.openapi.yaml](../../docs/contracts/notifications.openapi.yaml). Use same-origin browser reads, a single mounted `EventSource` in the CRM layout and a feature-owned Server Action for mark-read. Browser inbox reads may send `X-Staff-Account`; it is optional, but a supplied value must match the live session. The Server Action independently compares its expected account ID with the live staff session before forwarding the allowlisted Cookie and Origin. Stream messages contain no lead or contact details. A successful read or refresh uses backend truth for unread count.

## Design

Reuse the workspace shell, shared Button and Popover primitives and semantic tokens. Keep one active bell/stream across layout breakpoints. Use keyboard-accessible links and controls, visible focus, Escape and focus return. Make the unread count available to assistive technology without announcing every refresh. Keep the popover in bounds at 320px. Refresh the loaded list without appending duplicate items or letting an older request overwrite a newer snapshot.

## Acceptance criteria

- [x] An agent sees one unread alert without reloading when a manager assigns a lead in another session. The notification links to the correct record.
- [x] Offline/reconnecting staff catch up, and an open bell updates without moving keyboard focus. Account changes, revoked sessions and reassignment clear stale data.
- [x] Read state persists after reload, errors can be retried and pagination works with concurrent updates.
- [x] Viewing, task and inquiry alerts use the same controls and link to the authorized record.
- [x] Desktop, 320px mobile, keyboard and assistive labels work with no page overflow.

## Validation

Frontend unit tests (306 tests in 49 files), API-contract drift, lint, typecheck and an isolated production Webpack build passed. A targeted Edge browser suite passed 4/4 against an isolated Next Webpack server on port 13100 and disposable Express/SQLite fixture on port 14311. It covered live delivery, persisted reads, Ctrl-click from desktop, offline catch-up, reassignment, revoked-session re-sign-in, 320px keyboard behavior, retry and pagination races. Screenshots were reviewed, and the active CRM lead page had no configuration or session errors in Next DevTools. This is targeted coverage, not a full legacy browser-suite or deployed-ingress verification.

## Rollout and risks

Deploy the backend migration and routes before the client. The stream returns `Cache-Control: no-store, no-transform` and `X-Accel-Buffering: no` so the current Next rewrite does not buffer it; deployment ingress remains to be verified. A browser reconnect reloads the canonical inbox. To roll back the UI, remove the bell and stream subscription together.

## Implementation evidence

The implementation and frontend contract snapshot are verified. P2-02 is checked in the roadmap. Viewing, task-reminder and staff-inquiry alerts are verified supplemental slices; they do not implement an email/WhatsApp auto-reply, notification preferences, Redis transport, or deployed production ingress.
