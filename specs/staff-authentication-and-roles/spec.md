# Staff authentication and roles

Status: Delivered and verified on 2026-10-22.

Delivery record: [implementation plan](../../docs/plans/staff-authentication-and-roles.md).

## Approved form refactor — 2026-10-22

Status: Delivered and verified on 2026-10-22. Existing authentication behavior remains the compatibility baseline.

- Use React Hook Form with `@hookform/resolvers` and a frontend Zod schema for email/password validation. Normalize email only; preserve passwords exactly. Do not require the provisioning minimum length at sign-in.
- Replace native form markup/styling duplication with locally owned shadcn/ui Base Nova Input and Field primitives adapted to the existing semantic palette. Preserve accessible labels, field errors, focus behavior, autocomplete and keyboard submission.
- Submit the native Better Auth client request in a React 19 `startTransition(async () => ...)` Action. `isPending` tracks the awaited sign-in; React Hook Form manages field validation and its own submission phase. Combine the relevant pending states and a synchronous in-flight guard so rapid clicks/Enter cannot issue duplicate requests. Transition state must not control text input updates. Wrap navigation updates after `await` in a new transition.
- Preserve masked/visible password behavior, email retention, password clearing, 429 cooldown, generic credential errors, recoverable outages, fixed `rememberMe: true`, server session guards and native cookie protocol. Native password-manager values must still work when changed without React events. SSR controls remain disabled before hydration and the form keeps `method="post"`.
- Add only required, independently pinned frontend dependencies; no backend auth API, persistence or session-policy changes.
- Browser validation uses four workers to bound local dev-server contention. The disposable fixture provisions a separate Agent identity for the transition test so normal login coverage does not exhaust the production-equivalent five-attempt account limit. Do not weaken auth limits for tests.

### Refactor acceptance

- [x] Actual React Hook Form and Zod resolver validate both fields, including normalization, limits and exact password preservation.
- [x] Registry-derived shadcn/ui form primitives replace duplicated field markup and retain the selected visual/accessibility behavior.
- [x] Async transition covers the real native sign-in request and prevents duplicates through request completion/navigation.
- [x] Existing real desktop/mobile auth tests, delayed hydration/autofill regressions and both repository quality checks pass.
- [x] Installed-tool inventory, architecture guidance and feature evidence are reconciled after verification.

## UI feedback component reuse — 2026-10-22

Status: Delivered and verified on 2026-10-22. Reuse existing local UI primitives first; add the appropriate official shadcn/ui Base Nova component when the local catalog lacks it. Adapt semantic tokens rather than creating feature-specific copies of standard components.

- Keep field-specific validation in `FieldError`. Use registry-derived `Alert` and `AlertDescription` for persistent login, session-verification and logout failures. Preserve accessible alert announcements, existing message text and retry behavior.
- Reuse the shared `Button` with a ghost variant for password visibility and session retry, retaining native button semantics and hydration/pending safeguards.
- Keep live pending/cooldown announcements as semantic status text; do not add a toast system or dependencies for messages that belong beside the affected form/action.
- [x] Reused components preserve the existing desktop/mobile auth, validation, outage, cooldown, autofill, focus and pending behavior.
- [x] Quality gates/browser checks pass and contribution guidance documents the reuse-first convention.

## Goal

Give provisioned agency staff a clear, accessible sign-in experience and protect the CRM using Express-verified sessions. Covers P1-01 and the authentication portion of P1-02. P1-03 remains pending until lead ownership exists.

## Scope

- In scope: `/login`, Better Auth React client email/password sign-in, logout and session state, CRM route/data checks, loading/failure states, native auth protocol integration, and responsive maroon/ivory/charcoal styling.
- Staff-only login, fixed eight-hour sessions, no remember-me or return-to parameter; successful sign-in always opens `/crm`. Staff accounts and password recovery are handled by a trusted backend operator command for this slice.
- Out of scope: signup/customer login, invitations, OAuth/MFA, reset-email forms, staff-management screens, public homepage redesign and business CRM screens. Do not build inactive controls for excluded flows.

## User flow

1. Unauthenticated visitor opens `/crm` or a nested staff page: no protected content is rendered; redirect to `/login`. Public `/` remains accessible.
2. `/login` presents email, password, accessible show/hide password, Sign in and a Return to website link. Short recovery guidance says `Need access or a password reset? Contact your agency administrator.` No fake forgot-password/signup links.
3. Submitting shows a pending state and prevents duplicate submission. Call `authClient.signIn.email({email,password,rememberMe:true})` with normalized email and unchanged password. The fixed true value keeps the configured eight-hour cookie/session lifetime; there is no remember-me UI. Clear password on success or failed response; preserve email on retry. Do not log or persist field values.
4. Success stores only the browser-managed HttpOnly cookie and navigates to `/crm` with fresh server state. Shell shows the current staff name and role; no fabricated dashboards.
5. Wrong credentials show the contract's generic message. Validation associates inline errors with fields; 429 shows a retry message using Retry-After and permits retry when elapsed. Network/non-JSON/5xx failures show a recoverable service-unavailable message without exposing internals or claiming invalid credentials.
6. Already authenticated staff opening `/login` are redirected to `/crm`. A backend session lookup failure shows a retryable error, not a login/CRM redirect loop.
7. Logout disables duplicate actions, calls `authClient.signOut()`, and only after confirmed native success (200 with the library success object) redirects/replaces history to `/login` and refreshes router state. Verify supported client session invalidation/refetch behavior. Failure offers retry and does not claim logout succeeded.
8. Expired/revoked sessions redirect on the next protected server request; protected client API calls treat 401 as sign-in required and 403 as permission denied. Backend outage is a distinct recoverable failure. Back navigation/refresh after logout cannot recover usable protected data; invalidate client router state and enforce server authorization again.

## Contracts and access

- Follow the [backend contract snapshot](../../docs/contracts/staff-authentication.md). It is copied verbatim from backend `specs/staff-authentication-and-roles/contract.md`; reconcile changes with that source. Do not import sibling files or invent frontend endpoint contracts.
- One browser client uses `createAuthClient` from `better-auth/react` in `src/lib/auth-client.ts`, with `basePath: /api/v1/auth` and same-origin credentials. Better Auth 1.7.12 is pinned independently here. There is no Better Auth server or credential database in Next.js, and no NextAuth/Auth.js is introduced.
- Use `authClient.signIn.email()`, `authClient.signOut()` and `authClient.useSession()`/`getSession()` against the native Express handler through the same-origin proxy. Native paths are POST `/api/v1/auth/sign-in/email`, GET `/api/v1/auth/get-session`, POST `/api/v1/auth/sign-out`. Verify all Set-Cookie headers survive. Do not maintain custom fetch wrappers for browser sign-in/logout/session state.
- Use `useSession()` for interactive identity/loading/error UI only; it is never an authorization boundary. Use supported invalidation/refetch after login/logout, refetch on focus, and no continuous polling unless justified. Do not create a duplicate auth state store.
- Server session lookup uses GET `/api/v1/auth/get-session` against server-only `API_URL`; read cookies with the installed async request API, forward only the configured auth cookie and use no-store with the bounded timeout. Parse the native null-or-session result, then narrow UI data to `{id,name,email,role,expiresAt}`. Never pass the raw session to client props. Native auth token metadata may exist in client responses; application code must not render, log, persist or use it as bearer credentials.
- Use supported Better Auth client additional-field typing for the server-owned role with a local contract declaration compatible with the pinned version. Do not import sibling source to infer types. Auth uses library types and native errors; an OpenAPI client generator is not required for this slice. Non-auth business APIs keep their existing types/error envelope.
- Only the backend accesses SQLite. This feature introduces no PostgreSQL configuration, driver, migrations, compatibility layer or tests; migration to another database is future work.
- Central server-only session access validates with Express; do not infer identity from cookie presence or browser state. Use request-scoped deduplication only, never cross-user caching.
- Guard the staff layout for initial rendering and each protected page/data entry point because layouts may be reused during navigation. Express protects every private backend route independently. Do not add route middleware/proxy as the sole authorization boundary.
- Native auth GET 200 `null` means anonymous and can trigger the protected-page redirect. A valid object means a session validated by Express. Malformed responses, timeouts and non-2xx native errors are recoverable errors, not anonymous fallback. Future protected business APIs still use their existing 401/403 meanings. Do not redirect on permission denial or outages.
- Session GET is read-only with no renewal/Set-Cookie dependency, avoiding unsupported cookie mutation during Server Component rendering. Browser POST responses set/expire cookies.
- No JWT/localStorage auth, database access, client secrets, direct cross-origin browser calls or frontend role assignment. Keep public health transport separate and unchanged.
- Admin/Manager/Agent may access the shell. Display metadata from Express; do not show future privileged actions or claim lead isolation exists yet.

## Design

- The login panel uses the shared registry-derived `Card`/`CardContent`, retaining its named region and h1. The [frontend reuse review](../frontend-component-reuse-review/spec.md) records this behavior-preserving cleanup.
- Apply the agreed semantic palette to login/shared tokens: maroon `#701F35`, ivory `#FAF8F5`, charcoal `#252329`, white form surfaces and stone borders. Verify contrast and visible focus. Because tokens are shared, include public/CRM foundation regression checks for the palette update; no homepage layout redesign.
- A focused staff sign-in page with the existing agency brand and readable typography. Use a lightweight branded introduction beside the form on desktop; stack on narrow screens. Avoid new photography/font dependencies for this operational screen.
- Reuse the existing button and layout conventions. Use labeled native email/password inputs with email/username and current-password autocomplete, password-manager support, keyboard-operable visibility control, inline error descriptions and an announced submission status. Do not block pasting passwords.
- Ensure one main landmark, logical focus order, visible focus, keyboard submission, 44px control targets and no horizontal overflow at 390px or 1440px. Login is outside the protected staff layout, marked noindex without treating indexing controls as security.

## Acceptance criteria

- [x] Public pages remain accessible; unauthenticated CRM requests redirect before protected content is returned, including direct page requests.
- [x] Provisioned Admin, Manager and Agent use the actual Better Auth React client through the proxy to sign in/out and see the server-confirmed name/role; browser code has no bespoke auth fetch/state store.
- [x] Refresh preserves a valid session; eight-hour expiry, logout, password reset and deactivation stop access on the next protected request.
- [x] Cookie security and proxy headers work; no token/password appears in browser storage, URLs, logs or client props.
- [x] Native session lookup forwards cookies and distinguishes authenticated data, successful anonymous `null`, malformed responses and service failures; auth errors and logout success use native client-compatible responses.
- [x] Native token fields are never logged/rendered/persisted by application code or used as bearer credentials; raw server session objects are excluded from client props.
- [x] Auth infrastructure, migrations and database tests use SQLite only, with no PostgreSQL additions.
- [x] Login/logout pending, validation, generic credential failure, throttle and outage states are accessible and retryable.
- [x] Desktop/mobile keyboard and password-manager flows work with the selected palette; public and CRM foundation rendering regressions are checked.
- [x] Existing foundation navigation tests are updated for the now-protected CRM and new login flow rather than retaining an anonymous CRM expectation.
- [x] Frontend quality gates and real cross-repository smoke checks pass; docs and roadmap are reconciled with verified behavior only.

## Validation

- Unit tests: client configuration/method integration, normalized email without password transformation, fixed rememberMe input, server cookie allowlist, no-store/timeout configuration, native null versus outage distinction, native error versus business-envelope handling, role typing and retry-after handling. Do not mock away client-to-server compatibility in integration tests.
- Browser integration against real Express and isolated SQLite: anonymous redirect; each role login; refresh/session persistence; bad credentials; sign-out and back navigation; expired/revoked/disabled session; untrusted-origin direct mutation rejection; concurrent browser contexts with distinct identities.
- Outage tests: backend unavailable before login, session verification failure after login, and failed logout. Confirm recoverable errors and no protected-content leak or endless redirects. The page error action uses Next.js 16's `retry()` to refetch failed Server Components after the backend recovers; `reset()` alone does not refetch.
- Manual desktop/mobile: focus, labels, announced errors, password paste/autofill, show/hide, pending actions, contrast and overflow. Test production secure-cookie flags independently of local HTTP.
- Original delivery verification completed: `bun run check` passed in the frontend (including 38 tests); `bun run check` passed in the backend (including 34 tests); and `bun run test:e2e` passed 26 real Express/SQLite desktop and mobile browser tests. Six live browser lifecycle checks also passed for deleted, expired and disabled sessions, password reset, current role changes, and backend outage/recovery.
- Form-refactor verification completed: frontend `bun run check` passed with 39 tests; backend `bun run check` passed with 34 tests across 11 files; and `bun run test:e2e` passed 28 real desktop/mobile browser tests. The suite covers invalid and valid same-tick duplicate submissions, a held sign-in request, and a held post-sign-in navigation transition. The native frontend/backend contract snapshots remain byte-identical.
- UI-feedback reuse verification completed: frontend `bun run check` passed (lint, formatting, Next.js type generation, TypeScript, 39 tests across 6 files and the bundled Webpack build); `bun run test:e2e` passed all 28 real desktop/mobile flows. The reviewed flows include persistent credential/outage/logout feedback, 429 cooldown and pending announcements, password visibility, autofill, focus and session retry. No backend runtime or contract changes were required.

## Rollout and risks

- Local compiler verification found Turbopack's PostCSS child process repeatedly exits before IPC connection in this Windows environment, including outside the sandbox. The supported bundled Webpack build succeeds against the same source. Use `next dev --webpack --port 3100` and `next build --webpack` for repository commands and browser test startup; no additional bundler dependency is installed. Reassess Turbopack only as a separately verified tooling change.
- Requires backend migration, explicit origin/secret configuration, staff provisioning and working session endpoint before frontend protection is released. Deploy as a coordinated slice; never revert to anonymous CRM as a recovery measure.
- Real proxy Set-Cookie and SSR Cookie forwarding passed the integration gate using the existing rewrite. Preserve this contract when changing proxy configuration.
- Production HTTPS origin/deployment topology is not selected; retain same-origin browser API behavior and verify deployed reverse-proxy trust before production release. Fixed-session and operator-only recovery defaults are approved and implemented.

## Implementation evidence

- Better Auth 1.7.12 React client, protected login/CRM flow, staff account/logout UI and maroon/ivory/charcoal auth styling are implemented in this repository.
- Real browser checks cover sign-in/out for all three roles, refresh and concurrent contexts, client failure/retry states, protected navigation, responsive layouts and native cookie behavior.
- Backend-backed lifecycle checks verify that Express, rather than frontend state, remains authoritative after session or account changes.

## Documentation sources

- [Better Auth React client](https://www.better-auth.com/docs/concepts/client), [basic usage](https://www.better-auth.com/docs/basic-usage), [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication), [cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies).
- Queried through Context7 on 2026-10-22. Read the installed Next.js 16.4.2 documentation before implementation; do not assume older request APIs apply.
