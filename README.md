# Real estate frontend

Start with the [project specification](spec.md) for scope, boundaries and current status, then read the relevant feature spec before implementation. Keep the root spec synchronized after verified feature delivery.

Next.js public website and agency CRM, independently versioned from the Express backend. Staff authentication, property management, public property discovery, property inquiries and role-scoped lead management are implemented. `/crm` is protected by an Express-verified session.

## Local setup

Requires Node.js **24.14.1** (24 LTS) and Bun **1.3.14**.

```powershell
bun install --frozen-lockfile
Copy-Item .env.example .env.local
bun run dev
```

Open `http://localhost:3100`. Start the separate backend at `http://localhost:4311` before opening `/crm`; CRM rendering verifies its session through the server-only transport. Public `/` does not require backend availability. Copy the backend `.env.example`, generate an independent `BETTER_AUTH_SECRET` of at least 32 characters, run its database migration, and bootstrap the first staff Admin before signing in.

## Commands

```text
bun run dev           Development server with bundled Webpack, port 3100
bun run check         Lint, formatting, types, unit tests, build
bun run build         Production build (backend need not be running)
bun run start         Serve production build, port 3100
bun run lint          ESLint, no warnings
bun run typecheck     Next route types and strict TypeScript
bun run format        Format source and docs
bun run format:check  Check formatting
bun run test          API transport/config unit tests
bun run test:watch    Unit tests in watch mode
bun run test:e2e      Browser integration; backend must be running
bun run api:generate  Regenerate property and lead API types from committed contract snapshots
bun run api:check     Verify generated property and lead API types match their snapshots
```

For browser setup, run `bunx playwright install chromium` once. Browser integration uses real Express/SQLite, covers desktop/mobile staff and property workflows, and saves screenshots under ignored `test-results/`. Set `E2E_REUSE_FRONTEND=1` only when deliberately reusing an already-running frontend during local investigation. The implemented forms use React Hook Form, Zod and locally owned Base Nova primitives; see [architecture](docs/architecture.md), the [property specification](specs/property-management/spec.md) and [development](docs/development.md).

## Shared project documentation

Read the [roadmap](ROADMAP.md), [tech stack](TECH_STACK.md), [workspace overview](docs/shared/workspace-overview.md), [workspace guidance](docs/shared/workspace-guidance.md), [workspace foundation spec](docs/shared/foundation-spec.md), [foundation execution record](docs/shared/setup-plan.md), and [selected homepage mockup](docs/design/homepage-maroon-ivory-charcoal.png). These are committed alongside this project when staged and committed.

The frontend copy is the editing source for shared documents; synchronize the backend copy in the same delivery. Each repository keeps its own feature specs and implementation docs. Both copies work independently after cloning; no sibling checkout is required to read them.
