# Shared-code naming and ownership

Status: Verified — 2026-10-27

## Goal

Make shared infrastructure discoverable under names that describe its actual responsibility, and distinguish property enquiry UI from general agency enquiries.

## Scope

Extract LoadingState into src/components/ui/loading-state.tsx while retaining BuildingLoader and its CSS/artwork in building-loader.tsx. Rename src/features/leads/public/inquiry-card.tsx and InquiryCard to property-inquiry-card.tsx and PropertyInquiryCard. Update every application/test import and current specification reference, with no compatibility forwarding exports. Backend companion: specs/shared-code-naming/spec.md.

Exclude generic pagination redesign, retry-button consolidation, unrelated renames, dependency changes and user-facing design changes. Existing dirty feature work must be preserved.

## User flow

Login, public properties, CRM loading and property enquiry submission retain their existing loading, validation, success, failure and accessibility behavior. Only source names and ownership change.

## Contracts and access

No endpoint, generated type, payload, permission, cookie, persistence or environment contract changes. Express remains authoritative. Existing backend-owned contracts remain unchanged.

## Design

Keep JSX, styles, defaults, aria attributes and client/server directives identical. LoadingState imports BuildingLoader from its artwork module; direct artwork consumers retain that import. PropertyInquiryCard remains lead-owned public business UI.

## Acceptance criteria

- [x] LoadingState is owned by loading-state.tsx and every consumer imports it directly.
- [x] PropertyInquiryCard is the property-specific enquiry component; its file, imports and current documentation use that name.
- [x] No old InquiryCard symbol/file imports or LoadingState exports from building-loader remain in active source/tests.
- [x] Existing appearance, accessibility, form workflow and contracts remain unchanged.
- [x] Required quality checks, an isolated build and affected browser flows pass; specs reflect actual evidence.

## Validation

Run API drift, lint, formatting, typecheck, unit tests and isolated production build without touching the active dev server build directory. Exercise affected property enquiry and loading-related routes with existing isolated browser fixtures. Review before/after source changes for behavior preservation rather than adding rename-only tests.

## Rollout and risks

No dependency, migration, deployment or API change. Update all consumers together without aliases/barrels. Preserve all existing uncommitted work and user-owned servers. Rollback reverses only this naming refactor.

## Implementation evidence

Frontend API drift, lint, formatting and TypeScript passed; all 199 unit tests in 34 files and an isolated production Webpack build passed. The initial sandbox run could not access four local HTTP transport fixtures; the unchanged suite passed outside that restriction. The isolated desktop/mobile smoke run passed 11 tests with one intentional mobile skip (12 total). It covered property enquiry through Manager assignment and Agent visibility, general agency enquiry, protected property reads/404, streamed inventory and public loading/navigation. A fresh scoped audit found no actionable findings and confirmed exact behavior preservation. Runtime checks confirmed this checkout, clean Next configuration/session error state, public pages returning 200 and backend health/public reads returning 200. No API, dependency or configuration value changed; existing uncommitted work was preserved.
