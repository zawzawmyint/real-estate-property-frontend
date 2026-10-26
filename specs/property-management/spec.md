# Property management and public discovery

Status: Verified on 2026-10-22.

## Goal

Let staff create a property, add photos and publish it so visitors can find and inspect it. Preserve the agreed simple Property Finder-inspired design using Avenor Properties branding and locally owned shadcn/ui Base Nova components.

## Scope

- Target P1-11, P1-12 and P1-13 in full: create/edit/delete/archive, property fields/photos and automatic public visibility.
- Deliver P1-15 public filtered listings. Deliver the search and featured-listings portion of P1-14 and the gallery/detail portion of P1-16; these items stay unchecked until their complete acceptance is verified. P1-18 remains partial until all public feature screens are responsive. Do not claim full homepage delivery from this slice alone.
- Include a property search entry on `/`, `/properties`, `/properties/[id]`, `/crm/properties`, `/crm/properties/new`, `/crm/properties/[id]` and `/crm/properties/[id]/edit`.
- Exclude inquiries, leads, staff assignment, saved properties/hearts, maps/geocoding, recommendations, mortgage tools, WhatsApp automation, contact/agent pages, a client portal and bulk import. P1-19 demo data is specified separately in `../demo-property-data/spec.md`.

## User flow

1. Admin/Manager opens Properties in the existing CRM navigation, searches or filters inventory and selects Add property.
2. A dedicated grouped form accepts a title and Buy/Rent purpose to save an initial draft. Save succeeds before uploads are enabled, giving photos a durable property ID. Creation redirects to the edit page; do not auto-retry an ambiguous create response.
3. Staff completes details, adds photos, sets the cover and order, then explicitly publishes. Show missing publishing requirements beside fields and in an accessible error summary. A failed publish leaves the saved draft intact.
4. Visitors search from the homepage, open filtered listings and select a property. Public pages show only published, available properties; they never load staff DTOs.
5. Staff can save live edits, return a listing to draft, archive it or mark it sold/rented. Explain that saving edits to a published listing updates the public page immediately; no second unpublished revision exists.
6. Archived records can be restored to draft. Admin alone can permanently delete an archived property, after an AlertDialog naming the property. No bulk deletion.

**States:** distinguish no inventory, no filter matches, loading, validation failure, upload failure, missing property, forbidden access, expired session and API outage. Preserve entered fields on failures. Provide retry without fabricated successful results. A missing/unpublished/archived/unavailable public ID gives a real 404; an API outage gives an error state, not 404.

**Roles:** Admin and Manager can read owner contacts and create/edit/upload/publish/archive/restore. Admin alone permanently deletes archived records. Agent can read inventory but receives no owner name/phone and no mutation controls. Backend enforces these rules on every request. There is no per-agent property ownership in this delivery.

## Contracts and access

- Backend owns validation, persistence, access and publishing eligibility. The backend-owned contract is mirrored as the [contract snapshot](../../docs/contracts/properties.md); the implemented OpenAPI snapshot generates the business types.
- Server reads go through `src/lib/api/server.ts`; browser reconciliation reads and native Better Auth use `/api/v1`. Property mutations use feature-owned Server Actions, which verify the live session and role, validate input and the request Origin, and forward only the configured session cookie to Express. Never import backend source, Prisma or private environment values into browser code.
- `openapi-typescript` 7.13.0 generates property types from the committed OpenAPI snapshot; `bun run api:check` detects drift without writing.
- Render prices in AED, sale total or rent per year; store integer fils through the API. Display area in sqft, bedrooms 0 as Studio. Preserve explicit zeroes and reject invalid/negative numeric filters rather than silently coercing them.
- All property API/page reads use no-store initially. After mutation, refresh/refetch the relevant inventory and public views; do not promise removal of already rendered content in another open tab.
- Owner data must be absent from public HTML, serialized props, metadata, responses, errors and public search. Agent responses also omit it. Do not include owner fields in frontend analytics or logs.
- Uploaded listing photos are public assets, including draft photos by their direct URL. State this beside upload. Never upload IDs, contracts or confidential documents here. Archiving removes discovery, not confidentiality of previously shared photos.

## Design

### Agreed visual reference

Use the [selected homepage mockup](../../docs/design/homepage-maroon-ivory-charcoal.png) as the visual authority: generous ivory space, white surfaces, charcoal text, maroon calls to action, strong property photography and clear information. Property Finder informs Buy/Rent search and scannable listing facts; do not copy its branding or add its full feature set. Keep Avenor Properties as the brand.

- Reuse semantic tokens in `src/styles/tokens.css`: maroon `#701F35`, ivory `#FAF8F5`, charcoal `#252329`. Avoid gradients, excessive badges, oversized dashboard metrics and decorative panels.
- Preserve existing body typography. Use a local/system serif stack for public display headings to echo the mockup; no external font service is required.
- Target a centered public content width around 1200px, comfortable 24–32px desktop gutters, 16px mobile gutters and restrained rounded corners. Keep the CRM's existing shell rather than adopting a new sidebar framework.

### Public screens

- **Homepage entry:** retain the mockup's spacious heading/photography direction and white search panel. Buy/Rent control, plain location text search, type, min/max price and Search properties submit to URL filters. Show up to three explicitly featured eligible properties; hide the section gracefully when none exist. Hero may use the first featured cover, with an ivory/text fallback; do not use the screenshot as a flattened UI or publish its illustrative records. Agent/contact promotional sections remain later work. Omit unimplemented navigation/CTA destinations.
- **Listings:** compact search/filter bar, result count, sort and photo-led cards. Filters: purpose, location, type, minimum/maximum price and minimum bedrooms; clear-all and pagination preserve URL state. Three columns at wide desktop, two at tablet and one at mobile. Cards show a 4:3 cover, sale/rent badge, AED price (rent `/year`), title, community/city, beds, baths and sqft. Use a clear title link; no fake favourite or inquiry buttons.
- **Mobile filters:** a labelled Filters button opens a Sheet with Apply and Clear; desktop uses inline controls. Apply resets page to 1. URL reload/back/forward restores applied values. Do not build autocomplete or a map for a free-text location field.
- **Detail:** back-to-results link, one large image plus up to four desktop thumbnails and a View all photos button. On mobile show the cover and gallery button. Open all photos in an accessible Dialog with previous/next, count, close and focus restoration. Below: title, prominent price, location, beds/baths/area and plain-text description. A compact desktop summary panel can repeat key facts and Back to listings; do not render a disabled/fake inquiry form.

### Staff screens

- **Inventory:** Properties title and Add property action, search, publishing-state/purpose/type/availability filters and sort. Desktop Table shows cover, title/location, price, publishing state, availability, updated date and explicit View details/Edit actions; mobile uses compact cards. Every staff role uses the read-only `/crm/properties/[id]` details route, while an Agent visit to `/crm/properties/[id]/edit` redirects there. Public View public listing appears only for published, available listings.
- **Form:** single page, two-column desktop layout (main form and narrow publishing panel), one column on mobile. Sections: Basics, Price and property facts, Location, Photos, Private owner details (Admin/Manager only). Place Save draft/Save changes, Publish/Unpublish and Archive/Restore in the action panel as appropriate; destructive Delete is separate and Admin-only. No multistep wizard.
- **Photos:** labelled native file input with optional drop target, thumbnails, individual pending/error state, Set as cover, Move earlier/later and Remove controls. First photo is cover; choosing a cover moves it to first. Buttons support ordering without drag-and-drop. Upload sequentially and refetch after each response. Never show a local preview as a saved upload.
- Show pending actions and prevent duplicate submissions. Preserve the existing React Hook Form/Zod pattern, synchronous submission guard, accessible `FieldError`, persistent `Alert` feedback and transition-aware refresh/navigation. On uncertain upload results refetch the photo list before offering retry.

### Component reuse

- Reuse existing `Button`, `Input`, `Field`/`FieldError`, `Alert`/`AlertDescription`, `Card`/`CardContent` and `Empty` exports first.
- Add only consumed official shadcn/ui **Base Nova/Base UI** primitives: `Select` or `NativeSelect` for finite choices, `Textarea`, `Badge`, `Table`, `Pagination`, `Sheet`, `Dialog`, `AlertDialog` and `Skeleton` as the screens need them. Do not install the entire catalog or mix Radix variants into this Base UI setup.
- Compose `PropertyCard`, `PropertyFilters`, `PropertyForm`, `PropertyPhotos` and `PropertyGallery` in `src/features/properties/`. These contain business presentation; do not invent replacement low-level inputs, buttons or dialogs.
- Prefer native form elements and ordinary links when they suffice. No TanStack Table, drag library, carousel package or toast system is needed for this delivery.
- Documentation basis: [official Base UI registry](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/_registry.ts), [React Hook Form integration](https://ui.shadcn.com/docs/forms/react-hook-form). Verify exact Base UI component APIs when adding local sources.

### Accessibility and media

Keyboard-operable filters, dialogs and photo ordering; explicit labels; status text beyond colour; visible focus; meaningful image alt text derived from property title and photo position. Escape closes overlays and returns focus. Aim for 44px action targets and WCAG AA contrast. No horizontal page overflow at 360px. Reserve image dimensions, load below-fold photos lazily, prioritise only the main visible image and request appropriately sized media. Review the configured media origin explicitly rather than wildcarding remote image hosts.

## Acceptance criteria

- [x] Admin/Manager can save a draft, complete all fields/photos, publish, edit, unpublish, archive and restore; Admin can delete an archived property. Role restrictions survive direct requests and stale sessions.
- [x] All P1-12 fields persist correctly; Studio, AED fils conversion and annual rental display round-trip without precision loss.
- [x] Publish refuses incomplete/invalid properties and zero-photo records; a public listing never exposes private owner fields or internal identifiers beyond its public property/photo IDs.
- [x] Photos upload, reorder, change cover and remove; failed upload/remove leaves truthful UI and no phantom photo. A published property cannot lose its last photo.
- [x] Public homepage featured cards, listings and detail gallery follow the saved visual reference and component reuse policy. Draft/archived/sold/rented records disappear from fresh public reads and direct URLs return 404.
- [x] Search/filter/sort/pagination combine correctly, survive URL navigation and show honest empty/error states. Gallery and all forms work by keyboard and on mobile.
- [x] Inquiries, favourite hearts and contact CTAs are absent. P1-14/P1-16/P1-18 remain partially complete; P1-19 is completed by the separate verified demo-data delivery.
- [x] Frontend quality checks, cross-repository browser checks and visual desktop/mobile review pass; evidence is recorded before checking roadmap items.

## Validation

- Unit tests: input normalization, strict money conversion, filter serialization, safe public/staff DTO handling and API failures.
- Browser integration against isolated real SQLite/backend: create/upload/publish/discover/edit/archive/restore/delete, all three roles, session revocation, invalid fields, interrupted requests, upload limit/type failures and no private data in public rendered/network output.
- Keyboard gallery/filter/confirmation flows, no duplicate submissions, 360px/mobile and desktop screenshots against the selected mockup. Include long titles, Studio, zero matches, missing image/network failure and 1/12-photo galleries.
- Run `bun run check`; start the isolated backend on 4311 and run `bun run test:e2e` on frontend 3100. Preserve existing auth and foundation coverage, updating shell assertions only where this feature intentionally replaces placeholders.
- Browser tests use the disposable backend fixture on 4311, the Playwright-only proxy on 4312 and frontend on 3100; global setup warms compiled routes before parallel browser work. `E2E_REUSE_FRONTEND=1` may reuse only a frontend already started with `API_URL=http://127.0.0.1:4312`. Never ship the fixture/proxy as application behavior or use production credentials/database for this suite.

## Rollout and risks

The role matrix, AED/year/sqft units, draft/publish lifecycle and Admin-only deletion of archived records are implemented product decisions.

Deploy backend/migration before frontend; snapshot SQLite and public media together. Restore compatible application/database/media backups together if rollback is needed. Photo paths remain public after unpublish/archive; physical removal is best-effort after database changes and failed cleanup must be recoverable.

## Implementation evidence

Backend `bun run check` passed with 56 tests in 13 files; three additive migrations and property-aware `db:check` passed in an isolated database. A development database/media backup was captured at `.delivery-work/properties/local-backup-before-properties` before migration. Frontend lint, typecheck, API drift check, 51-unit-test run and production Webpack build passed. The final browser run passed 40 desktop/mobile checks, including 12 property checks; separate populated-page width checks passed at 27 viewport/page combinations from 360px through 1440px. See the [implementation plan](../../docs/plans/property-management.md).
