# CRM route guard and scoped loading

Status: Delivered and verified on 2026-10-26, except for production HTTPS cookie-topology verification.

## Goal

Centralize fast redirects for signed-out CRM visitors and keep static CRM navigation, headings and filters visible while independently loading verified identity, permission-dependent actions and list results. Retain one Better Auth session owned by Express.

## Delivered scope

- Added the frontend-only Next.js `src/proxy.ts` gate for `/crm/:path*`.
- Moved only account rendering behind suspension. The persistent account provider receives the server-started session promise and remains mounted across sidebar/menu state changes.
- Applied scoped loading to existing Properties and Leads lists. Detailed form and detail-route loading redesign remains excluded.
- Recorded warm session and route timings separately from cold development compilation observations.
- No API, schema, dependency, cookie-caching, cross-request identity-cache, auth-migration or backend behavior changed.

## User flow

1. A visitor opens a CRM URL. A missing configured session cookie redirects to `/login`; Proxy makes no HTTP or database request. Login redirects and return-URL parameters are unchanged.
2. With a cookie present, render the static shell and list heading/filter structure without waiting for session verification. These structures contain no staff identity, private records or role claims. Controls remain inert until hydration as today.
3. Verify the session through the existing server transport. The account region and role-dependent creation controls show accessible pending placeholders until verification succeeds. Admin/Manager actions appear only after verified role resolution; Agent permissions are unchanged.
4. Stream each list's count, rows and pagination inside its query-keyed result boundary. Properties begin their result request and session verification together, rendering records only after both succeed. Leads keep a provisional, role-neutral filter region inert until verified role parsing resolves. URL filters, search feedback, empty states and role-scoped results are retained.
5. A missing/expired/revoked session resolves to login before protected content is emitted. Backend 401 responses also trigger sign-in handling; 403 remains permission denied. Session-service failures show recoverable error/retry feedback, without treating outages as signed-out sessions or displaying protected data.
6. Sign-out retains native Better Auth behavior, invalidates router state and reconciles other tabs. Full route fallbacks may remain for detail/form navigation or failures before static route content is ready; no universal zero-loader guarantee is made.

## Contracts and access

- Existing backend-owned API contract remains unchanged: local [staff authentication contract snapshot](../../docs/contracts/staff-authentication.md), sourced from backend `specs/staff-authentication-and-roles/contract.md`. Existing [authentication requirements](../staff-authentication-and-roles/spec.md) remain authoritative.
- Proxy checks `agency.session` outside production and `__Host-agency.session` in production. Cookie presence is only an optimistic navigation gate, never authorization. A forged/nonempty cookie still fails live verification.
- Preserve GET `/api/v1/auth/get-session`, allowlisted cookie forwarding, private `API_URL`, `cache: no-store`, bounded timeout, and the null-or-session response. Only the existing safe `{id,name,email,role,expiresAt}` staff DTO may cross the server UI boundary; never expose session tokens or raw cookies in props, logs or storage.
- Reuse request-scoped session deduplication. Properties run unrelated session verification and inventory fetching concurrently, and do not render private records before both succeed. Express continues validating each protected API request and enforcing resource/role permissions.
- Do not move verification solely into a persistent layout or browser hook. Retain live checks in protected reads, pages needing roles and Server Actions as appropriate. No cross-repository source imports or backend changes are required.

## Design

- Reuse WorkspaceShell, existing account UI, PageHeader, FilterPanel, list skeletons, shared loading primitives and feature-owned result components.
- Keep static shell rendering independent of account resolution. The provider stays above desktop and compact account views, preserving pending sign-out and feedback while a menu closes, reopens or changes layout.
- Properties and Leads headings and filter structures live outside asynchronous session/result boundaries; role-sensitive actions resolve separately. Leads use inert provisional filters until verified; Properties retains its existing static filters. Results await the required verified session/data inside their own boundary.
- Loading regions announce status accessibly without duplicate announcements; preserve keyboard focus, stable layout, reduced-motion support and usable mobile widths. No private-record skeleton may include real cached record text from another identity.

## Acceptance criteria

- [x] Missing cookie on `/crm`, nested CRM routes and direct links redirects to `/login` without a Proxy session-service request; public routes, assets and auth/API paths are unaffected.
- [x] Development and production cookie names are unit-covered, and focused browser coverage confirms forged cookies cannot expose private direct routes or protected actions.
- [x] Holding session verification keeps static list headings, filter structure and navigation visible, with identity/actions pending and no private records emitted.
- [x] Holding Properties/Leads result requests shows result-region loading while headings and filters persist.
- [x] Focused browser checks cover role-dependent actions, direct route protection, anonymous/forbidden/revoked Express requests, session outages/retry, logout behavior and desktop/mobile account views. Express remains the authorization boundary.
- [x] Cold development compilation observations and warm session/route timing are recorded separately; the samples do not establish a causal performance gain.
- [ ] Verify production HTTPS/reverse-proxy secure-cookie topology in a deployed browser environment.
- [x] The final persistent-provider production build passed; API contract generation, lint, typecheck and 138 unit tests also passed.
- [x] The final combined desktop/mobile browser suite passed 97 tests with one conditional skip, covering authentication, route guard/loading, Properties and Leads.

## Validation

- Focused proxy tests cover matching, development/production cookie names, no-cookie redirects and pass-through behavior.
- Browser checks cover held session/result responses, forged cookies, role-specific actions, desktop/mobile views, direct nested URLs, session outage/retry and live Express authorization.
- API contract generation, lint and typecheck passed; 138 unit tests passed. A focused browser recheck passed 49 tests with one conditional skip. Modified code passed targeted Prettier formatting. Repository-wide format check retains 76 pre-existing warnings outside this change.
- Baseline warm samples, excluding the first request, measured session at 12–14 ms, Properties at 426–537 ms and Leads at 162–191 ms. A focused desktop recheck measured session at 10–11 ms, Properties at 385–428 ms and Leads at 106–117 ms. These environment-sensitive observations are not a performance claim. Development logs contain compilation warm-up events without an isolated cold per-route metric.

## Rollout and risks

- Implement in frontend only; existing API/session contracts and dependencies remain compatible. No breaking changes or backend migration.
- Main risk: shell provider consumers currently require verified staff. Inspect and separate only the consumers that need identity; never fabricate a staff object to render early.
- Parent loading boundaries can still hide static content if an ancestor awaits authentication; verify the complete layout tree, not only the list's Suspense boundary.
- Optimistic cookie checks accept stale/forged cookies until live verification rejects them. Preserve backend protection and explicit unavailable-service handling.
- Production secure-cookie/proxy topology still needs browser verification in HTTPS; local tests alone do not establish deployment readiness.
- Rollback restores the prior shell/page boundaries and removes Proxy without changing sessions or backend persistence.
- Open implementation blockers: none identified. Exact latency cause remains an investigation task, not an assumed defect.

## Implementation evidence

- Implementation uses `src/proxy.ts`, the persistent `StaffAccountProvider` with `StaffAccountRegion`, and scoped Properties/Leads boundaries. Express and the staff-authentication contract did not change.
- Evidence is recorded in `.delivery-work/route-guard-baseline.log`, `route-guard-recheck.log`, `route-guard-final.log` and `route-guard-build.log`. `route-guard-recheck.log` records 49 focused browser passes and one conditional skip; earlier failing exploratory runs are superseded by that recheck. `route-guard-final.log` records the final combined desktop/mobile suite: 97 passes and one conditional skip in 3.7 minutes.
- Production HTTPS topology remains the only unchecked acceptance criterion.

## References

- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next#auth-protection)
- [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication)
