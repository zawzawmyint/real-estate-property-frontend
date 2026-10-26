# Next.js agent tooling

## Configuration

The frontend's [.codex/config.toml](../.codex/config.toml) configures `next-devtools-mcp@0.4.0` through `npx -y`. The parent workspace has matching local configuration so chats opened above the two independent repositories can also use it. The frontend copy is the versioned source; keep the workspace copy aligned when changing the connector. No global configuration or application dependency is added.

Codex loads project MCP configuration only for trusted projects. Start a new Codex session or reload MCP connections after configuration changes. The workspace configuration was recognized during verification; a standalone frontend project can still report no configured server until it is trusted and reloaded. The first launch downloads the pinned package into npm's cache and needs network access. The process environment disables connector telemetry and supplies Windows environment variables; timeouts allow for initial startup. On another OS, omit the two Windows environment entries. No API key is required.

The [Next.js MCP guide](https://nextjs.org/docs/app/guides/mcp) describes the connector; [Codex MCP documentation](https://developers.openai.com/codex/mcp) describes project configuration. Framework documentation already ships with Next.js at `node_modules/next/dist/docs/`; managed `AGENTS.md` rules point there. Continue consulting Context7 as required by workspace guidance.

## Runtime workflow

1. Start the backend separately on port 4311 as described in [development](development.md). From the frontend, run `bun run dev`; it uses Webpack on port 3100. Reuse an existing dev server only after confirming it belongs to this checkout.
2. Call `nextjs_index` through `next-devtools`. If discovery misses port 3100, pass `port: "3100"` as exposed by its tool schema. Call `nextjs_call` with `port: "3100"`, `toolName: "get_project_metadata"` and confirm the returned project path and URL.
3. Inspect the discovered runtime tools. `get_routes` returns the route map; `get_logs` returns a local log path. Open the affected page using the available browser tooling or the existing Playwright installation and exercise the actual changed behavior.
4. While the browser remains open, call `get_errors` and `get_page_metadata`. An empty browser-session list does not prove success. Check both browser behavior/console and framework diagnostics; include relevant evidence and limitations in the feature spec.
5. Run the required lint, formatting, typecheck, tests and build checks. Stop a dev server you started before building, and preserve `.next` while it is running. If someone else owns the server, coordinate or defer the build rather than interrupting it.

For frontend-only inspection, `/login` renders without a running backend, but public property data and CRM sessions need Express. A backend-unavailable retry state is not evidence that the full public flow works.

## Webpack compatibility

The current official `next-dev-loop` skill requires Next.js 16.3+, Turbopack and `agent-browser` 0.31.1+. It explicitly refuses Webpack. It is **not installed**. The existing Windows Turbopack failure is documented in the staff authentication specification; changing bundlers requires a separately verified change.

The DevTools MCP connector supports the compatible runtime tools with Webpack. `get_compilation_issues` and `compile_route` are Turbopack-only even if discovery lists them; use page navigation and the required production build to check compilation. `browser_eval` is a gateway to `agent-browser` instructions, not browser automation itself. This setup uses the already available browser tools/Playwright, and does not install `agent-browser`.

## Troubleshooting and rollback

- No `next-devtools` tools: check project trust, npm access and configuration loading; reload the Codex session. A running chat may retain its original tool catalog.
- No Next.js server: start `bun run dev` and inspect the startup banner. Production `next start` is not a replacement for the dev MCP endpoint.
- Missing page metadata/errors: keep a real browser on the target page and retry after hydration. Confirm the project identity and port before diagnosing application code.
- Rollback: remove the `mcp_servers.next-devtools` table from the frontend and workspace configurations, then reload Codex. No database migration or application rollback is required.

See [the tooling specification](../specs/agent-tooling/spec.md) for verification evidence. This tooling maintenance does not complete any business-roadmap item.
