# Local demo staff login

Status: Verified local-development feature.

## Goal

Allow one-click local testing as Admin, Manager or Agent from the existing login page.

## Scope

- Add a compact demo-access section to LoginForm using existing Button primitives.
- Expose configured local demo credentials to the form only when `NODE_ENV` is `development` and `DEMO_STAFF_PASSWORD` is 12–128 characters. Use the already provisioned `demo.admin@example.com`, `demo.manager@example.com` and `demo.agent@example.com` accounts.
- Keep the password in ignored local configuration; document only the empty optional variable. Do not commit credentials or create a new authentication endpoint.
- Exclude production demo access, account provisioning changes, business roles and permissions, or changes to the normal manual login flow.

## User flow

On the local login page, click Admin, Manager or Agent once to sign in through native Better Auth and enter CRM. Keep all actions disabled until hydration, during a pending sign-in and during a Retry-After cooldown. Failed login uses the existing safe feedback and allows a safe retry. Manual credentials remain available.

## Contracts and access

Express independently authenticates the chosen account and derives its actual role; buttons confer no permissions. No Server Action or auth bypass. Production, test and missing/invalid configuration omit demo credentials and controls entirely. Local development deliberately exposes the configured password and selected demo email to the browser payload for native sign-in; that is acceptable only for this local-development convenience flow.

## Design

Use existing outline buttons in a responsive three-role group labelled Demo access, with explanatory local-testing copy. Share guarded validation, pending state, feedback, native authentication and navigation with the existing form.

## Acceptance criteria

- [x] One role button click signs into the corresponding real local account and reaches CRM.
- [x] Native auth, manual login, hydration safety, duplicate guards and retry feedback remain intact.
- [x] Demo configuration and controls are omitted outside development or without a valid local password.
- [x] No credentials are committed; docs describe local setup without a concrete password.
- [x] Quality checks and real browser checks verify all roles and relevant guard behavior.

## Validation

Test the configuration boundary for production/test/missing/invalid values and development account selection. Verify demo buttons are disabled in server-rendered markup. Run frontend quality checks and use real browser sign-in/sign-out for each role, plus duplicate-request/error checks. Inspect Next.js runtime diagnostics and desktop/mobile layout. Document actual evidence and limitations.

## Rollout and risks

The configured credentials are intentionally visible in local browser payloads; require development-only configuration and never reuse real staff passwords. Remove the optional local variable to hide the demo section. Existing account creation remains the backend operator's responsibility. No database or API migrations.

## Implementation evidence

- `bun run check` exited 0: API contract generation check, lint, Prettier, Next.js type generation/TypeScript, 79 unit tests in 12 files and the Webpack production build all passed. The configured-development and demo-button SSR regressions were observed failing before implementation; all three configuration tests and the SSR hydration test now pass.
- Real local development checks against the backend on port 4311 signed in and out with Admin, Manager and Agent at desktop and mobile sizes (six flows). The reviewed screenshots had no horizontal overflow, and the exercised pages reported no browser/page errors. Same-tick duplicate input produced one native sign-in POST; pending role controls locked correctly; and a service-error path recovered for retry.
- A built Next.js server was started with `NODE_ENV=production` and a configured demo password on a free port. Its login response was 200 and contained no demo-access controls, demo addresses or configured password. The probe server was then stopped.
- The full 44-flow Playwright suite was not rerun for this delivery. The affected demo-login interactions were exercised against the running local development stack instead. Final in-app-browser inspection was blocked by the existing browser URL policy on an error page, so no clean Next.js DevTools session is claimed; open or refresh `/login` locally to inspect it.
