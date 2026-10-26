---
name: frontend-entry
description: Use when starting frontend work in this repository and choosing the relevant project implementation guidance.
---

# Frontend entry

Start frontend work here. This file sits beside [AGENTS.md](AGENTS.md), which owns project rules and required checks. Feature specifications own requirements; the linked skills explain implementation workflows.

## Read the project context

1. Read [AGENTS.md](AGENTS.md) and the [project specification](spec.md).
2. Read the affected feature spec from [specs](specs/README.md). For new behavior, use the [feature template](specs/_template/spec.md) before implementation.
3. Consult [ROADMAP.md](ROADMAP.md) for scope and delivery status, and [TECH_STACK.md](TECH_STACK.md) for installed tools and deferred choices.

## Choose the workflow

- **Frontend implementation:** Read [frontend-development](.agents/skills/frontend-development/SKILL.md) for routes, feature organization, UI reuse, API integration and completion checks.
- **CRM headers, filter panels, tables, pagination and labelled fields:** Use the Shared CRM application components reference in [frontend-development](.agents/skills/frontend-development/SKILL.md) before assembling primitive markup. It documents application-level imports, props and a composition example.
- **Public headings, search panels, property grids and inquiry fields:** Use the Shared public application components reference in [frontend-development](.agents/skills/frontend-development/SKILL.md); reuse the existing public property components and the same labelled fields as CRM.
- **Data fetching, mutations and forms:** Also read [frontend-data-forms](.agents/skills/frontend-data-forms/SKILL.md) for Server Actions, shared create/edit fields, submit controls, safe errors and streamed result regions.
- **Local setup and browser verification:** Follow [development](docs/development.md) and [runtime inspection](docs/agent-tooling.md).

Read only the workflows relevant to the task. Use existing feature examples selectively; do not copy property-specific permissions or business rules into other domains.

## Preserve the architecture

Keep initial reads on the server and business mutations in feature-owned Server Actions that forward to Express. Express owns business validation, authorization and persistence. Keep Better Auth on its native client protocol. Keep backend origins, session credentials and database access out of browser code.

Before declaring completion, run the checks required by AGENTS.md, verify the affected user flow and permissions, then reconcile the feature spec and relevant documentation with actual evidence.

This root entry is linked from AGENTS.md. Discoverable implementation skills remain in `.agents/skills`; this document does not replace their metadata or the project's rules.
