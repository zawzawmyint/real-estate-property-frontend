# Next.js agent runtime tooling

Status: Verified 2026-10-23

## Goal

Give coding agents version-matched Next.js documentation and verified visibility into the running frontend without changing the application or its Webpack workaround.

## Scope

Configure the pinned Next.js DevTools MCP connector for Codex at the workspace and standalone frontend entry points. Document runtime inspection with the existing browser tooling and preserve existing quality gates. No global agent configuration, application dependencies, business behavior, backend API contracts, or compiler changes are included.

## User flow

Open the trusted workspace or frontend in Codex and reload the MCP configuration. Start the backend on 4311 and frontend with `bun run dev` on 3100. Discover the frontend, confirm its project metadata, inspect routes, open the affected page in a browser, and inspect errors and page metadata. If the server is unavailable, start it and retry; an empty discovery result is not successful verification.

## Contracts and access

The local stdio connector is `next-devtools-mcp@0.4.0`, launched with `npx -y`. It proxies the development-only `http://localhost:3100/_next/mcp` endpoint. Discover tools before calling them and verify the project path before inspecting an instance. No backend contract changes, credentials, production endpoint, or business authorization changes are involved. Disable connector telemetry through its process environment.

## Design

Use Codex project configuration in `.codex/config.toml`; the workspace copy supports chats opened at the parent directory and the frontend copy travels with its independent repository. Preserve managed Next.js rules. Runtime checks use compatible MCP tools and the existing browser or Playwright installation. The upstream `next-dev-loop` skill requires Turbopack and is not installed. Webpack cannot use `get_compilation_issues` or `compile_route`; retain browser navigation and the production build as compilation checks.

## Acceptance criteria

- [x] Workspace and frontend configuration tables use the same pinned connector settings without global configuration or application dependencies. The workspace client recognized the connector; standalone frontend activation still requires project trust and a configuration reload.
- [x] Connector initialization and tool discovery work, and runtime calls identify this frontend on port 3100.
- [x] Routes, logs, page metadata and runtime errors can be inspected after browser navigation.
- [x] A real browser renders a public page and login; the runtime reports no errors for the checked pages.
- [x] Frontend quality checks pass; shared documentation is synchronized and records Webpack and trust/reload limitations.

## Validation

Run a stdio MCP initialize/list/call smoke check using the configured command. Start the existing development commands, inspect project metadata/routes/logs, navigate public and login pages in a browser, and inspect runtime errors/page metadata while that browser remains open. Run frontend lint, formatting, typecheck, tests and build. Check backend documentation formatting and shared-copy parity. This tooling-only change does not alter API integration behavior.

## Rollout and risks

Project configuration requires a trusted project and a fresh/reloaded Codex session. Package download requires npm network access on first use. Pin updates intentionally and reverify. Stop the dev server before the production build; preserve `.next` while it is running. Remove the connector configuration to roll back; no database or application migration is needed.

## Implementation evidence

On 2026-10-23, `mcp get next-devtools --json` from the workspace recognized the configured connector. The workspace and frontend configuration tables were compared excluding their entry-point comments and matched exactly. A separate frontend invocation returned `No MCP server named next-devtools`; that project must be trusted and its MCP configuration reloaded before its client activates the connector, so standalone-client activation was not verified in this session.

The ignored local smoke harness launched the configured stdio command and completed MCP initialization as `next-devtools-mcp` 0.4.0, tool discovery, explicit `nextjs_index` on 3100, project metadata for this frontend, routes including `/login`, log-path lookup, and bundled Next.js 16.4.2 documentation lookup. Chromium loaded `/` with live property cards from the backend on 4311 and `/login` with email/password fields. For both pages, Next.js page metadata reported the active browser session and `get_errors` returned empty `configErrors` and `sessionErrors`; the browser reported no console or page errors. The smoke harness exited 0 and its log is ignored at `.delivery-work/agent-tooling-verification.log`.

`bun run api:check`, `bun run lint`, `bun run typecheck`, `bun run test` (9 files, 51 tests), `bun run format:check`, and `bun run build` all exited 0; the build used Webpack and produced the route output. Targeted Prettier checks for the backend shared documentation and tech-stack copy also exited 0. Owned development servers were stopped before the production build. The full business E2E suite was not rerun because this change does not alter application or API behavior; the real public-page browser smoke exercised the existing cross-repository integration.

Existing Next.js 16.4.2 bundled docs and managed rules were confirmed. The official `next-dev-loop` skill explicitly requires Turbopack, so this delivery uses the compatible MCP connector instead.
