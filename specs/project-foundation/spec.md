# Project foundation

> **Historical snapshot — 21 October 2026.** The original setup requirements and verification record below are preserved as delivered on that date. Statements about public CRM access, missing authentication or absent listings describe that setup state. For the current system, read the [project specification](../../spec.md) and [roadmap](../../ROADMAP.md).

Status: Delivered and verified on 2026-10-21.

## Goal

Create an independently versioned Next.js frontend for the public property website and internal agency CRM. No business features are included.

## Requirements

- App Router, strict TypeScript, Tailwind, shadcn-style local UI source backed by Base UI. Bun manages packages; Node.js 24 LTS runs the app.
- `/` public shell and `/crm` staff shell use separate layouts and shared semantic design tokens. CRM is publicly accessible until an authentication feature is implemented; it is not production-ready staff access.
- No fake properties, metrics, authentication, listings, leads, or forms.
- Express owns business logic, authorization, SQLite access, and files. This repository never accesses the database.
- Server-only `API_URL` defaults to `http://localhost:4311`. Browser `/api/v1/*` requests proxy to the same backend. Server rendering uses a typed, bounded-time API transport. No backend origin appears in client configuration.
- Health contract: `GET /api/v1/health` returns `{status: 'ok', service: 'real-estate-api'}`. Error contract: `{error: {code, message, requestId}}`.
- CRM rendering exercises the server transport without displaying developer diagnostics. Backend failures reach the error boundary, with no fabricated success state.
- Shared loading, error, and not-found handling; accessible responsive navigation and keyboard focus.
- Pin stable dependency versions and Bun lockfile. Include formatting, lint, typecheck, unit tests, browser smoke tests, builds, CI and environment examples.

## Acceptance

- [x] Frozen installation, development startup and production build succeed independently.
- [x] Public and CRM shells render at desktop and mobile sizes without simulated business data.
- [x] Browser API proxy and server transport reach the real Express service at the configured origin.
- [x] API transport checks status, the health response contract, timeout and structured errors.
- [x] Linting, formatting, strict type checking, 13 unit tests and the production build pass.
- [x] Six Playwright desktop/mobile smoke tests cover the public-to-CRM flow, proxy health, missing page and narrow-screen overflow.
- [x] Documentation agrees with the verified commands and architecture boundaries.

## Exclusions

Authentication, business entities, images/data, client portal, S3, email, queues, deployment and generated business API types are deferred. Introduce feature folders and dependencies when needed.

## Validation

Unit tests run against a temporary real HTTP server. Playwright starts this frontend and, with the backend running on port 4311, tests public/CRM shells, navigation, mobile overflow, missing pages and proxied health. On 2026-10-21, 13 unit tests, 6 Playwright tests, linting, formatting, type checking and the production build passed. CRM intentionally requires backend availability at request time; builds do not require a live backend.
