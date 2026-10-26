# Demo property presentation

Status: Verified on 2026-10-22.

## Goal

Show the new property experience with clearly labelled fictional sample inventory and generated photographs.

## Scope

Render the backend's `isDemo:boolean` field in public listing cards, property detail and CRM inventory/details. Use the same Property Finder-inspired layout and shadcn/ui Badge/Alert patterns. Seed generation and persistence remain backend-owned; there is no browser seed button.

## User flow

An operator explicitly seeds a local demo database. Visitors browse/search sample properties and see Demo property labels; the detail page states that records and generated photos are illustrative. Staff can identify sample records in the CRM. Empty real installations remain empty until records are entered or seeding is explicitly requested.

## Contracts and access

Property DTOs add read-only `isDemo:boolean`, default false for ordinary staff-created records. Do not expose demoKey or owner data publicly. Demo designation is not an authorisation shortcut and changes no property permissions. Backend spec: companion repository `backend/specs/demo-property-data/spec.md`.

## Design

Use a concise text badge on cards/inventory and a visible explanatory note on detail. Generated photos use the existing gallery/card image treatment and meaningful alt text. Avoid persistent global banners for real listings; do not disguise sample inventory as live available homes.

## Acceptance criteria

- [x] Seeded cards, details and CRM records visibly say Demo property; detail explains generated imagery is illustrative.
- [x] Real records remain unlabelled and backend privacy/role rules still apply.
- [x] Fifteen seeded properties, images, filters and responsive layouts pass integrated verification.

## Validation

Desktop/mobile browser checks inspect demo labels, source image loading, filter variety and private-field absence. Existing property tests remain valid for non-demo records.

## Rollout and risks

No automatic seed or frontend database access. Backend adds the additive DTO field before frontend deployment; frontend reads it without accepting writes. Preserve generated source fixtures and provenance separately from runtime uploads.

## Implementation evidence

The final browser run passed 40 desktop/mobile checks, including property and demo presentation coverage; frontend lint, typecheck, API drift check, 51-unit-test run and production Webpack build also passed.
