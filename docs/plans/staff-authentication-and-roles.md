# 🔐 Staff Authentication Implementation Plan

> **Goal:** Deliver staff-only login, revocable sessions and role-aware CRM access across the frontend and backend without exposing private data.

---

## 🎯 Objective

Replace the publicly accessible CRM shell with verified staff access before adding properties or leads. This plan is retained as the delivery record; the implemented files and verified acceptance live in the feature specifications.

---

## 📦 Scope

**In scope**

- Better Auth React client in Next.js, Better Auth server in Express, email/password login, logout, fixed eight-hour database sessions and Admin/Manager/Agent identity.
- Backend migration, session/role guards, operator account lifecycle commands, frontend `/login`, CRM protection and auth-specific UI states.
- Same-origin cookies through the frontend proxy, security checks, integration tests and documentation reconciliation.

**Out of scope**

- Public signup/customer accounts, social login, MFA, reset emails, staff administration screens and business-resource permissions.
- Public homepage redesign. Shared palette changes are included, but the homepage mockup remains a future feature reference.
- PostgreSQL setup, drivers, schema/provider variants, migration SQL and compatibility testing. SQLite is the only database in this delivery; other providers are future migration decisions.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Independent Next.js and Express repositories, existing Node 24/Bun toolchain, Prisma and SQLite. No shared source imports or dependency folders.
- Use `createAuthClient` from `better-auth/react` in Next.js and Better Auth's native handler in Express. Better Auth 1.7.12 is pinned independently in both repositories. Allow only the three native endpoint/method pairs required by the client; disable signup and HTTP admin operations.
- Database sessions are authoritative; no localStorage tokens, cookie authorization cache or sliding renewal. Origins must match explicitly; production uses HTTPS.
- Auth/login limiter initially runs in one backend process. Shared throttling is required before multiple backend instances.
- Execution ruling: use Next.js's bundled Webpack for frontend dev/build and browser-test startup. Turbopack's PostCSS worker repeatedly exits before IPC connection on the current Windows runtime; the same source passes the supported Webpack build. No extra bundler dependency is needed.

**Product / Business**

- Proposed defaults: staff-only accounts, eight-hour absolute sessions and no remember-me UI; all successful logins land on `/crm`. The React client sends fixed `rememberMe: true` so the cookie follows the configured eight-hour duration instead of selecting the library's alternate nonpersistent-session expiry.
- A trusted backend operator provisions/resets/disables staff through a command. An Admin browser management screen and email recovery are deferred.
- Each role enters the current shell. P1-03 lead ownership cannot be completed without the later lead feature.

**Dependencies**

- Read this repository's [root spec](../../spec.md), [auth spec](../../specs/staff-authentication-and-roles/spec.md) and [contract snapshot](../contracts/staff-authentication.md).
- Backend owns `specs/staff-authentication-and-roles/spec.md` and `contract.md`; the implemented native subset is documented separately from the business error envelope in OpenAPI. Both feature specs agree. Better Auth's client supplies auth types; no OpenAPI client generator is needed solely for auth.
- Backend/CLI compatibility and real cookie round-trip passed. No account or external service setup is required beyond a local SQLite database and an independently generated server secret.

---

## 🧩 Proposed Approach

- Browser `authClient.signIn.email()` / `signOut()` / `useSession()` → existing same-origin `/api/v1` proxy → native Express Better Auth handler → Prisma/SQLite. Express sets/expires the HttpOnly cookie; Next.js runs no second auth server and has no database connection.
- CRM rendering → server-only helper forwards the auth cookie to Express's native get-session endpoint → parse native session or successful anonymous `null`; narrow UI data to current identity/expiry. Page/data checks and backend guards enforce access; neither a reused layout nor `useSession()` is an authorization boundary.
- Backend delivery: `src/modules/auth/auth.ts` owns library configuration/hooks, `auth.routes.ts` owns the method/path allowlist and native handler boundary, and `staff-operator.ts` owns operator lifecycle operations. `scripts/staff.ts` owns the trusted operator command. The vendor Node/Web Request adapter bounds raw auth request bodies before native parsing, then forwards an equivalent Web Request to Better Auth. `src/app.ts`, configuration, Prisma schema and two additive SQLite migrations were updated.
- Frontend delivery: `src/lib/auth-client.ts` creates the React client at `basePath: /api/v1/auth`; `src/app/login/page.tsx`, `src/features/auth/login-form.tsx` and `staff-account.tsx` provide the UI. The login form uses React Hook Form with `zodResolver(loginSchema)`, synchronizes native `FormData` before resolver validation to retain password-manager values without input events, and keeps a synchronous duplicate guard across resolver validation and the awaited native request. It combines the form submission phase with the transition pending state, then starts a nested transition for post-request navigation. `src/features/auth/login-input.ts` trims and lowercases emails up to 254 characters while preserving passwords exactly at 1–128 characters. `src/components/ui/input.tsx` and `field.tsx` are local Base Nova-derived primitives adapted to the existing palette. `src/lib/auth/server.ts` and `transport.ts` provide server checks. Supported client additional-field typing supplies roles without sibling imports. There is no browser auth fetch wrapper or duplicate session store. The [staff layout](../../src/app/%28staff%29/crm/layout.tsx), [staff page](../../src/app/%28staff%29/crm/page.tsx), [tokens](../../src/styles/tokens.css) and browser tests were updated; health transport remains independent.
- Native contract: POST `/api/v1/auth/sign-in/email`, GET `/api/v1/auth/get-session`, POST `/api/v1/auth/sign-out`. Preserve library response/error shapes, including 200 `null` for anonymous session and 200 `{success:true}` for logout. Non-auth business endpoints retain the project error envelope. Do not strip native token fields to fit the earlier bespoke response; application code must not log/render/persist/use them as bearer credentials.
- Copy the backend native protocol contract into the frontend and verify the actual React client against the pinned handler version. Runtime-check/narrow server session data and use supported library client types. OpenAPI generation remains a future non-auth business API adoption decision.

---

## 🚀 Execution Plan

1. **Prove the backend auth foundation** — _(role: backend)_ — add meaningful failing SQLite integration tests for provision → sign-in → session → revoke, then select/pin Better Auth, generate/review its SQLite Prisma models and migrate an isolated SQLite database. Verify custom roles, disabled state, server-only provisioning and eight-hour no-refresh sessions. Test duplicate emails and bootstrap reruns. Expected output: a passing real SQLite adapter/credential lifecycle; no PostgreSQL work.
2. **Deliver native auth HTTP integration** — _(role: backend)_ — test native handler middleware ordering and the exact three method/path pairs, origin/content-type checks, generic credential failures, role rejection, bounded throttling, cookies and revocation. Implement library hooks/guards/configuration and operator commands; test fixed rememberMe policy, 200 null session, native logout success and last-active-Admin protection. Preserve native auth errors while leaving business error handling unchanged. Expected output: independently tested native Better Auth protocol with signup/admin HTTP paths denied.
3. **Connect the actual React client and cookies** — _(role: fullstack)_ — add a compatible pinned Better Auth frontend dependency and `src/lib/auth-client.ts` using `better-auth/react`. Test real `signIn.email()`, `getSession()` and `signOut()` through the proxy, plus SSR Cookie forwarding, expiry and revoked-user rejection. Implement the server-only helper with no-store/timeout and distinguish native anonymous null from errors. Retain current rewrites if they pass; use a narrow auth proxy only if required. Expected output: proven client/server protocol and cookie compatibility without a custom browser API wrapper.
4. **Build the staff sign-in experience** — _(role: frontend)_ — test and build `/login` using client sign-in callbacks/results, logout through `signOut()`, and interactive identity through `useSession()` with supported invalidation/refetch. Protect server layout/page/data entry points independently. Test native null/errors, loading states and absence of duplicate auth storage. Apply maroon/ivory/charcoal tokens and regress public/CRM shells. Expected output: accessible desktop/mobile staff access with no dead signup/recovery controls or fabricated business UI.
5. **Verify the complete lifecycle** — _(role: fullstack)_ — run updated real-backend browser flows for each role, anonymous redirect, refresh, bad credentials, expiry, reset/deactivation, logout/back navigation, distinct browser identities and backend outage. Run every affected repository quality gate and backend database checks. Expected output: acceptance evidence for the complete auth flow, including negative paths.
6. **Reconcile the delivery** — _(role: fullstack)_ — update root specs, feature evidence, READMEs, environment examples, operational recovery steps, installed-tool inventory and both roadmap copies. Original delivery completed after review and verification: 34 backend tests, 38 frontend tests, 26 real desktop/mobile browser tests and six live browser lifecycle checks. The verified login-form refactor adds three independently pinned frontend dependencies, 39 frontend tests and 28 real desktop/mobile browser tests without changing the native auth contract. P1-03 remains pending until lead ownership is delivered. No commit, push or deployment is implied.

For each implementation task, write and run the failing behavior test first, add the minimum code to satisfy the contract, then rerun the focused checks before broad verification. Do not start dependent UI work if the library or proxy integration gate fails.

---

## ✅ Acceptance Criteria

**Functional**

- [x] Provisioned staff in all three roles use the actual Better Auth React client through the proxy to sign in, refresh valid session state and sign out against Express's native handler.
- [x] Anonymous, expired, revoked and disabled identities cannot retrieve protected CRM content; password reset disables all prior sessions.
- [x] Operator account lifecycle works, including bootstrap refusal, duplicate email handling and last-active-Admin protection.
- [x] Frontend and backend feature acceptance lists pass; role metadata does not imply unimplemented lead permissions.

**Non-functional** (performance, security, accessibility, reliability)

- [x] HttpOnly production-secure cookies, strict origin checks, bounded login throttling, no-store responses and current-database role checks are verified.
- [x] Credential hashes are private; native token fields are not rendered, logged, persisted in browser storage or used as bearer credentials by application code. Server UI props and CLI output contain no secrets.
- [x] Only SQLite schema/migrations/database tests are delivered; no PostgreSQL artifacts or provider compatibility infrastructure are introduced.
- [x] Keyboard/mobile flows, failure recovery and cross-user isolation pass; quality checks and real integration smoke tests pass.

---

## 🧪 Validation Plan

**Manual tests**

- Provision staff, sign in on desktop/mobile, use autofill/paste/keyboard, refresh, log out and try back navigation. Stop the backend during session validation/logout and verify a recoverable error.
- Review deployed-origin and production-cookie settings before release; check active-user revocation and operator recovery without exposing secrets.

**Automated tests**

- Backend Vitest/Supertest with real temporary SQLite; fake time for expiry/limits; frontend Vitest for React-client/native session/error boundaries and Playwright using the actual client against Express. Verify native 200 null session, 200 logout success, fixed rememberMe lifetime, role typing and denied extra routes.
- Both repos: `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test`, `bun run build`. Backend: `bun run db:check`. Frontend integration: `bun run test:e2e` with backend 4311/frontend 3100.
- Documentation validation: formatting, Markdown links, identical contract snapshots and status consistency passed alongside the verified application checks.

**Rollback / mitigation**

- Back up the database before additive auth migrations. Coordinate backend migration/configuration and frontend protection. If release fails, restrict staff access and restore the known-good application/database as needed; never recover by exposing the anonymous CRM shell.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Risk:** Better Auth's selected version differs from documentation — _Mitigation:_ pin after the adapter/provisioning integration proof and revise the spec before proceeding if needed.
- **Risk:** Proxy cookies or reused frontend layouts produce false auth confidence — _Mitigation:_ verify real headers, check page/data entry points and enforce Express guards independently.
- **Risk:** Operator-only recovery is insufficient for future production use — _Mitigation:_ document it explicitly and add email recovery/staff management as a separately scoped feature when needed.
- **Risk:** In-memory throttling loses state on restart or scale-out — _Mitigation:_ state the one-process deployment constraint and adopt shared limits before scaling.

**Open questions** _(blockers for implementation)_

- No local implementation blocker remains. Staff-only email/password access, eight-hour sessions and operator-managed accounts/recovery were approved and verified.
- The exact deployment origin/HTTPS topology must be supplied before production release; it does not block local implementation after the specs are agreed.
