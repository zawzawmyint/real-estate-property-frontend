# Frontend implementation skill

Status: Verified on 2026-10-23.

## Goal

Provide a discoverable frontend skill that guides implementation using this repository's existing structure and patterns.

## Scope

Add `.agents/skills/frontend-development/SKILL.md` with the agreed six-section workflow and link its form/data guidance to `.agents/skills/frontend-data-forms/SKILL.md`. No application behavior, dependencies, backend skill, or shared policy changes.

Add a concise `SKILL.md` beside the frontend's `AGENTS.md`, as requested. Link it from AGENTS.md and route readers to the existing skills without duplicating their implementation guidance. The root file is a repository entry document; discoverable skills remain under `.agents/skills`.

## User flow

The skill applies to App Router pages, public or CRM UI, forms, and Express API consumption. It directs the agent to authoritative guidance and relevant examples before implementation.

## Contracts and access

No API or permission changes. Instructions preserve backend ownership, server-only configuration, and existing generated contract types. The skill grants no additional execution or publication permissions.

## Design

Use concise YAML discovery metadata and six sections: read first, code placement, data boundary, UI choices, forms, and finish. Reference existing rules and implementations rather than copying project specifications.

## Acceptance criteria

- [x] Skill metadata identifies the frontend scope and matches its folder name.
- [x] All six agreed sections include the reviewed adjustments, valid repository paths and commands, and the focused data/forms reference.
- [x] API instructions account for the frontend-local backend contract snapshot used by the generator.
- [x] Validation includes formatting and a realistic use review, and records its limitations.
- [x] Root `SKILL.md` sits beside AGENTS.md, links the authoritative project/feature guidance and existing skills, and has no broken local links or conflicting workflow instructions.

## Validation

Check Markdown formatting and independently exercise the instructions with a realistic frontend task. Validate YAML discovery metadata with an available parser. Application tests and builds are unnecessary for these documentation-only changes.

## Rollout and risks

Remove the root entry document and its AGENTS.md pointer to roll back the entry addition. The existing discoverable skill folders are separate, pre-existing guidance. Reference paths and commands can drift; maintain them when the corresponding implementation changes. Existing AGENTS.md and feature specs remain authoritative.

## Implementation evidence

The skill contains the required discovery metadata and the six agreed sections. Its paths and commands were checked against `AGENTS.md`, `package.json`, `components.json`, `scripts/generate-api.mjs`, `src/lib/api/server.ts`, the properties and auth reference features, and the listed UI, layout, App Router, generated-type, token, and contract paths.

Prettier completed successfully for the two discoverable skill files, including their YAML frontmatter. A Node verification confirmed the exact two-field discovery metadata, all six sections, 15 filesystem references, and eight package commands. The bundled Python skill validator could not run because PyYAML is unavailable; the installed Prettier YAML parser parsed the metadata and its name/description were checked. No full bundled-validator result is claimed.

Scenario review: a baseline scenario that selected browser mutations exposed wording now replaced by the focused data/forms guidance. A forward scenario correctly selected Server Actions, the session/cookie/Origin boundary, shared fields, Suspense and native Better Auth; it also flagged the corrected contradictions. For a new CRM inquiry form with no agreed backend contract, the skill directs the implementer to create or update the feature spec and resolve the blocking contract question before implementation.

The root entry uses `frontend-entry` YAML metadata and remains an entry document rather than a discoverable replacement for `.agents/skills`. It links AGENTS.md, the project and feature specs, roadmap, tech stack, development/runtime guidance, and both existing workflows. A Node link check confirmed all 11 local root-entry links and the AGENTS.md pointer exist. Prettier completed successfully for SKILL.md, AGENTS.md and this specification; the installed Prettier YAML parser also parsed the root metadata. Review of the CRM inquiry scenario correctly routes form work to the focused data/forms workflow while requiring a feature specification and agreed Express contract before implementation.
