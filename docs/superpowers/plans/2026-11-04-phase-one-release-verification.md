# 🧭 Phase 1 Release Verification Plan

> **Goal:** Verify the two remaining Phase 1 items on the merged frontend and backend before declaring the MVP ready to deploy.

---

## 🎯 Objective

Phase 1 has 28 of 30 items verified. The homepage and responsive public layouts are implemented. The release candidate still needs evidence that they meet the existing acceptance criteria.

---

## 📦 Scope

**In scope**

- P1-14 homepage search and featured listings, P1-18 public responsiveness, and their shared release checks.
- Minimal fixes for reproduced acceptance failures, followed by verification and evidence updates.

**Out of scope**

- New features, redesigns, Phase 2 enhancements, and portfolio deliverables D-02 through D-05.
- Executing production deployment. Deployment remains a separate requirement for closing Phase 1.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Use disposable data, current merged source, and the existing Playwright suites and fixtures. Record both repository SHAs.

**Product / Business**

- Apply the existing public acceptance matrix. Only verified criteria and roadmap items can be checked off.

**Dependencies**

- A supported full Chrome or Chromium executable for native zoom, an isolated browser profile, and the backend health endpoint on port 4311 for the normal runtime check.

---

## 🧩 Proposed Approach

- Use the [public completion spec](../../../specs/phase-one-public-completion/spec.md) for acceptance and the [development guide](../../development.md) for local setup. Retain existing public DTOs, permissions, and inquiry contracts.
- Run the focused [homepage and public coverage](../../../tests/e2e/public-completion.spec.ts), [long-content coverage](../../../tests/e2e/public-long-content.spec.ts), and [native zoom check](../../../tests/e2e/public-browser-zoom.spec.ts) before broadening to the release suites.

---

## 🚀 Execution Plan

1. **Establish the candidate** — _(role: fullstack)_ — record both SHAs, start disposable fixtures, and confirm the frontend checkout and backend health.
2. **Verify homepage behavior** — _(role: frontend)_ — verify sale and rental searches, URL persistence, invalid budgets, featured listing states, and guidance and links on the current homepage.
3. **Verify public layouts and access** — _(role: frontend)_ — exercise all six public route shapes across the spec’s width matrix, inspect captures, and verify keyboard and focus behavior, reduced motion, long content, form recovery, and native zoom.
4. **Run release checks** — _(role: fullstack)_ — verify inquiry persistence and CRM access boundaries, run frontend quality gates and one clean serial legacy suite, then restart with the exact dashboard fixture and run its dedicated suite. Diagnose failures and rerun affected gates after fixes.
5. **Reconcile evidence** — _(role: fullstack)_ — record commands, SHAs, counts, intentional skips, visual review and runtime findings in the spec. Update the [frontend roadmap](../../../ROADMAP.md) first and mirror the evidence in the backend roadmap. Close each item only if its acceptance passes.

---

## ✅ Acceptance Criteria

**Functional**

- [ ] Homepage sale and rental searches preserve criteria on reload, invalid budgets retain input and display an error, and featured states remain distinct and navigable.
- [ ] Property and general inquiries each create exactly one expected CRM lead. Role, ownership and public field boundaries hold.

**Non-functional** (performance, security, accessibility, reliability)

- [ ] Public routes pass at 320, 375, 390, 768, 1024 and 1440 CSS pixels and at native 200% browser zoom from a 1280px desktop viewport.
- [ ] Keyboard, focus, reduced motion, long content and form recovery pass. Captures are reviewed and the normal preview has no unexplained browser or runtime errors.
- [ ] Quality checks, a clean serial legacy run, and the separate exact-data dashboard run pass. Both roadmaps reflect verified results.

---

## 🧪 Validation Plan

**Manual tests**

- Review each route at 320px and 390px and the homepage at 1440px. Exercise shared navigation, drawer/gallery focus and recovery states. Confirm runtime diagnostics on port 3100.

**Automated tests**

- Run frontend `bun run check`, the focused public suites, the legacy suite with `--workers=1`, and the dedicated dashboard suite under its own fixture. Run backend checks if backend code or fixtures change.
- Use an isolated native browser profile for zoom. Use `PUBLIC_BROWSER_EXECUTABLE` if bundled Chromium cannot launch. Confirm viewport and device-pixel-ratio changes with CSS zoom at 1.

**Rollback / mitigation**

- Revert any acceptance fix with its associated test changes if it introduces a regression. Discard disposable fixtures after the run.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Browser tooling blocks native zoom** — _Mitigation:_ use supported Chrome or Chromium. Record the blocker and keep P1-18 open if native zoom cannot be verified.
- **Shared fixture state causes interference** — _Mitigation:_ run legacy tests serially with fresh disposable data and restart with the exact dashboard fixture. Keep failures visible in the evidence.

**Open questions** _(blockers for implementation)_

- _N/A_
