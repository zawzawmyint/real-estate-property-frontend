# Repository-contained shared documentation

Status: Verified

## Goal

Keep the project roadmap, technology inventory, shared workspace records, and selected homepage mockup available in a standalone frontend repository clone.

## Scope

- In scope: repository-local copies of shared documentation, a root project specification at [spec.md](../../spec.md), links from the frontend README and contributor guidance, and a recorded frontend-first synchronization rule.
- Out of scope: application behavior, API contracts, feature implementation, and changes to the meaning or verification status of roadmap items.

## User flow

1. A contributor opens the frontend repository after cloning it independently.
2. The README and AGENTS guidance link to the root project specification, roadmap, technology inventory, workspace records, and selected design mockup in that same repository.
3. When shared documentation changes, the contributor edits the frontend copy and reconciles the matching backend copy in the same delivery.

## Contracts and access

This is documentation-only work. It does not add API requests, responses, persistence, authentication, permissions, configuration, or public runtime behavior. Repository-local feature specifications and the backend OpenAPI document remain their respective sources of truth.

## Design

The selected mockup is stored at [docs/design/homepage-maroon-ivory-charcoal.png](../../docs/design/homepage-maroon-ivory-charcoal.png). It records the agreed maroon, ivory, and charcoal direction as a visual reference; it does not represent delivered user-interface behavior.

## Acceptance criteria

- [x] A frontend clone contains `ROADMAP.md`, `TECH_STACK.md`, `docs/shared/`, and the selected design mockup without requiring a sibling repository.
- [x] The root `spec.md` distinguishes the verified foundation from planned product capabilities and links detailed requirements to feature specifications.
- [x] The frontend README and AGENTS guidance link to repository-local shared documentation.
- [x] The roadmap preserves its checklist IDs and marks no unverified product feature as complete.
- [x] Shared-document guidance identifies the frontend copy as the editing source and requires backend reconciliation.

## Validation

- Verified every relative Markdown target in the frontend repository resolves to an existing file.
- Formatted the changed Markdown with the repository's Prettier installation.
- Confirmed the shared documentation files and mockup exist at their documented frontend paths.
- Confirmed the root project specification, README, AGENTS guidance, and specification index link to one another using repository-local paths.

## Rollout and risks

No runtime rollout, migration, or rollback applies. The continuing risk is drift between the duplicated shared documents; mitigate it by editing the frontend source first and synchronizing the backend copy in the same delivery.

## Implementation evidence

- 2026-10-22: Shared documents were relocated into the frontend repository under `ROADMAP.md`, `TECH_STACK.md`, `docs/shared/`, and `docs/design/`; README and AGENTS navigation links were updated.
- 2026-10-22: Added the repository-root project specification as an index for verified foundation scope, planned capabilities, architecture boundaries, and feature-spec ownership.
- 2026-10-22: Markdown path validation and Prettier formatting completed for the relocated frontend documentation.
