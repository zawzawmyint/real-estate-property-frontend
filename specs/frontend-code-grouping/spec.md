# Frontend code grouping

Status: Verified on 2026-10-23.

## Goal

Apply the user's preferred blank-line grouping to authored frontend code so related setup, hooks, handlers and results are easy to scan.

## Scope

- Review authored TypeScript/TSX and JavaScript in `src/`, `scripts/` and `tests/`.
- Group related declarations, validation, request coordination, helpers, handlers, work and returns without spacing every statement.
- Exclude generated contract types, styles, markup changes, configuration changes, dependencies and build output. No renames, moved statements, extracted helpers or behavior changes.

## User flow

Existing public, login and CRM flows remain unchanged, including pending/error states, property forms, uploads, role checks and navigation.

## Contracts and access

Preserve hook order, client/server directives, Server Action and authentication boundaries, request/response contracts, and Express ownership. No API changes; the [property contract](../../docs/contracts/properties.md) remains authoritative.

## Design

Only source whitespace outside literals and JSX changes. Preserve JSX text, styles, attributes, accessible names and rendered output. Document the grouping convention in AGENTS.md.

## Acceptance criteria

- [x] Authored frontend code uses logical blank-line groups while short related operations stay together.
- [x] Before/after syntax trees, literal and JSX contents, comments and non-whitespace content are identical; hook order and directives are preserved.
- [x] API generation check, lint, formatting, typecheck, tests and build pass.
- [x] Relevant contribution guidance and this specification contain actual implementation evidence.

## Validation

Capture authored code before changes. Compare parsed syntax including leaf text and comments with a local verifier. Inspect representative components/forms, actions, API helpers, scripts and tests. Run `bun run check`; use existing browser verification for representative public, login and property flows and report the coverage actually run.

## Rollout and risks

Excessive spacing can fragment related code. Review the grouping and keep short operations together. JSX whitespace can affect rendered text, so require identical JSX syntax and literal contents. No backend changes or migrations. Restore original whitespace from the local snapshot if necessary.

## Implementation evidence

- The local grouping verifier captured 90 authored `.ts`, `.tsx` and `.mjs` files in `src/`, `scripts/` and `tests/`, excluding generated code; 62 files received whitespace-only grouping updates. It compared syntax-tree child and leaf text, exact JSX text, comments and non-whitespace source before and after, confirming no directive or hook-order change.
- Manual review covered property form, photo and gallery components, login, Server Actions, API helpers and tests. No JSX, style or generated-type change was made.
- `bun run check` passed: API generation check, lint, format check, typecheck, 75 tests across 11 files and production build.
- The full 44 desktop and mobile Playwright tests passed against the disposable backend fixture and proxy. A hydrated `/crm/properties/new` browser inspection found no configuration or session errors after using a fresh fixture; the earlier fixture had intentionally triggered the authentication rate limit during the suite.
