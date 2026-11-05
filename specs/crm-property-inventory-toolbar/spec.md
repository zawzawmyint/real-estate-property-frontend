# Compact CRM property inventory header and filters

Status: Delivered with verification limitations on 2026-11-03.

## Goal

Give staff more room to scan property inventory by replacing the oversized filter panel with a concise header and search toolbar while retaining the page description and existing sidebar.

## Scope

Included: `/crm/properties` heading/description/action spacing, compact search/sort/apply toolbar, expandable advanced filters, applied-filter chips, responsive and accessible interactions, and regression verification.

Excluded: property details/create/edit redesign; sidebar or workspace navigation changes; inventory table redesign; other CRM pages; public pages; API, authorization, database, dependencies, configuration and deployment changes. The reference table is contextual, not a requirement to restyle rows, actions or pagination.

## User flow

1. Open inventory with existing URL filters restored. See Properties, the description “Manage your agency’s property inventory.” and the role-permitted Add property link.
2. Enter a search and choose sort in the compact toolbar. Open Filters to edit publishing state, purpose, property type and availability.
3. Use an inline disclosure immediately below the toolbar for advanced fields, collapsed initially. It participates in normal page flow, uses one form instance and retains draft values when closed. Opening, closing or changing controls does not navigate or fetch results. There is no modal, nested form or new dependency.
4. Apply submits all current draft values together, validates through the existing parser, resets page to 1 and navigates using the existing serializer. Pressing Enter in search performs the same action. Pending and hydration safeguards remain.
5. Show chips for applied search and nonempty advanced filters only; sort and pagination are not chips. Filters count reflects applied advanced fields only. Chips represent URL state, never unsaved edits. Removing a chip navigates immediately, removes only that applied key, preserves other applied keys/sort/pageSize and resets page to 1; discard draft edits through the existing URL-keyed form remount. Clear all links to `/crm/properties`, restoring existing defaults. Hide chip row and Clear all when no search/advanced filters are applied.
6. Browser Back/Forward restores applied controls and chips. Pagination retains applied filters. Invalid URLs keep existing safe feedback; slow, empty and failed reads keep usable controls and existing result recovery.

## Contracts and access

- No backend work required. Authority: [property contract](../../docs/contracts/properties.md) and the backend-owned `docs/api/openapi.yaml` in the independent backend repository.
- Retain `getStaffProperties` and the current authenticated inventory request/response. No endpoint, field or response changes. Inventory continues consuming `{items,total,page,pageSize}` and existing staff property projections.
- Visible toolbar keys: `q` (max 160 characters) and `sort` (`updated_desc`, `newest`, `price_asc`, `price_desc`). Advanced keys: `publishingState` (`draft`, `published`, `archived`), `purpose` (`sale`, `rent`), `type` (`apartment`, `villa`, `townhouse`, `penthouse`), `availability` (`available`, `sold`, `rented`). Empty selections omit keys. Preserve other parser-supported applied parameters when editing/removing one field, except existing Clear all behavior.
- Reuse `PropertyFilters`, `parsePropertyFilters(params, true)` and `serializePropertyFilters`. Keep current defaults, validation and query-keyed Suspense. No automatic write or search retries.
- Express retains authorization. Admin/Manager retain Add property; Agents do not gain it or edit actions. Never expose count or inventory data before live session and inventory authorization succeed.

## Design

### Visual correction — 2026-11-03

Keep the current warm workspace background, sidebar and table. Match the selected toolbar reference with a leading search icon and “Search properties” placeholder, a funnel icon on Filters, balanced desktop search/Filters/sort/Apply proportions, consistent 48px controls, white input/select surfaces, stronger toolbar text, a thin header divider and soft maroon applied-filter pills. Scope these styles to the inventory page; adding an unused-by-default icon must not restyle existing consumers. Verify against the selected image in the same collapsed/applied-filter state rather than comparing an expanded draft form to a collapsed reference.

- Visual authority: [selected refinement](reference.png): compact heading with description, maroon primary action, one desktop search/Filters/sort/Apply row, conditional applied-chip line and subtle dividers. Generated sample counts, photos and text are illustrative, not data requirements.
- Keep the existing collapsed/expanded sidebar, icons, dimensions and behavior exactly as implemented. Use existing semantic tokens, fonts, buttons, labelled fields and icons; no global token or shared-component default changes.
- Use `PageHeader` with local spacing overrides. Preserve its title and description semantics. Do not add a duplicate breadcrumb/global header.
- Do not add a header count in this slice: the existing authorized results count remains the source of truth. This deliberate adaptation avoids duplicating/fetching inventory or blocking the streamed heading for decorative mockup data.
- At 1440px with sidebar collapsed and advanced filters closed, heading and toolbar must fit within the first 180px of main content (excluding optional applied-chip row); table follows without the former expanded panel or unnecessary gaps.
- At 320px and 390px, wrap controls in reading order, retain full accessible names and reachable actions, and avoid page-level horizontal overflow. Keep visible description. Use accessible labels for search/sort even when visually hidden; placeholders are not labels.
- Mobile inventory cards wrap long unbroken community and city values within the text column so the complete location remains readable at 320px and 390px.
- Filters is a non-submit button with `aria-expanded` and `aria-controls`. Disclosure fields use shared labels and existing select choices; collapsed fields must not lose values on Apply. Keep focus on Filters when collapsing; chip removal restores focus to a stable toolbar control after navigation. Announce pending/results with existing status regions.
- Existing PageHeader, buttons, fields and filter container styling can be reused later, but this slice does not migrate other pages or add a generic toolbar abstraction for a single caller.

## Acceptance criteria

- [x] Header retains title, description and role-aware Add property with compact spacing.
- [x] One desktop toolbar contains search, Filters, sort and Apply; advanced fields are initially collapsed.
- [x] Apply preserves closed disclosure values, parser validation, hydration/pending guards and page reset.
- [x] Applied chips/count, individual removal and Clear all follow the defined URL semantics, including Back/Forward and unsaved edits.
- [x] Existing inventory count, table, pagination, permission boundaries and streamed recovery remain intact.
- [x] Sidebar, public pages and other CRM page appearance remain unchanged.
- [x] Desktop geometry, 320px/390px widths and keyboard/focus behavior are verified.
- [x] Visual correction matches the selected collapsed/applied-filter reference state.
- [ ] Native 200% browser zoom is verified with a full Chrome/Chromium executable.
- [x] API drift, lint, typecheck, unit/build and targeted authenticated browser checks pass.
- [ ] Repository-wide format check passes without unrelated pre-existing CRLF-only differences.

## Validation

- Add `tests/e2e/crm-property-inventory-toolbar.spec.ts` using the existing isolated auth fixture/proxy. Cover disclosure persistence, keyboard submit, combined filters, chips with unsaved edits, Clear all, Back/Forward, pagination, invalid queries, slow/error/empty states and Agent permissions.
- Update affected accessible-name expectations in `tests/e2e/properties.spec.ts`; retain meaningful streaming, pending and hydration assertions. Test pure helpers only if implementation introduces meaningful query transformation logic not already exercised.
- Run `bun run api:check`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test`, `bun run build`, then targeted browser integration against the disposable backend fixture. Do not build over an active owned dev output; follow project server-isolation guidance.
- Compare desktop/mobile screenshots to the reference; check keyboard/focus, native 200% browser zoom and the unchanged sidebar/public/other-CRM smoke routes. Use project runtime tooling when available and record unavailable tooling honestly.

## Rollout and risks

Frontend-only, no migration or compatibility break. Revert the frontend changes to restore the previous panel. Main risks are lost values when disclosure controls unmount, stale chips after navigation, hidden-label regressions and broad shared-style changes; keep one form, derive chips from applied filters, scope styles and test those paths.

## Implementation evidence

2026-11-03: Frontend-only delivery updates local page spacing and the feature-owned inventory filters; the sidebar, table, shared components, public pages and backend source remain unchanged. API drift validation, lint, route type generation/typecheck, 288 unit tests in 46 files, and the production Webpack build passed. The final disposable-fixture toolbar/properties run passed 40 cases with two intentional native-zoom skips; it covers disclosure persistence, chips/history/focus, pagination, invalid/slow/error/empty states, Agent permissions and unaffected public/CRM routes. Desktop, 320px and 390px captures were reviewed without header/filter clipping or page-level overflow. Final normal-runtime inspection confirmed the expected checkout, an authenticated `/crm/properties` session with expanded advanced filters, and no configuration/session errors. Changed files pass Prettier. The full format check does not pass because it reports 85 existing CRLF-only differences; they were not rewritten. Native 200% browser zoom remains opt-in via `PUBLIC_BROWSER_EXECUTABLE`: the bundled Chromium could not launch and Edge does not expose the Chromium zoom setting, so that acceptance remains unchecked.

2026-11-03 visual correction follow-up: local header divider, balanced 48px toolbar proportions, search/funnel icons, white field surfaces and updated chip/clear styling were added without changing filter/URL behavior. Targeted ESLint and TypeScript checks, 288 unit tests in 46 files, and an isolated snapshot production Webpack build passed. Normal-runtime diagnostics reported the expected frontend checkout, active properties session and empty configuration/session errors. Reviewed captures confirm the warm workspace background and corrected live toolbar during filter interaction (`outputs/crm-properties-concepts/toolbar-visual-correction.png`) and the selected collapsed/applied-filter reference state (`outputs/crm-properties-concepts/toolbar-reference-state.png`). No new full disposable-fixture browser run was made; the prior 40-pass/2-skip run remains baseline evidence only.

2026-11-04 regression follow-up: inventory cards now apply `wrap-anywhere` to the community/city line. The maximum-length fixture asserts the complete location remains inside the document width at 320px and 390px after advanced filters expand. This passed during the 322-pass/65-skip isolated serial run; the remaining failure in that run was an unrelated Contact-route streamed-heading timing assertion. A final clean serial suite remains pending. No contract, permission, URL-filter or checklist state changed.
