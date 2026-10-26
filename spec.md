# Frontend project specification

Status: Project overview. Foundation, staff authentication/roles, property management, public discovery and demo data are verified.

## Purpose and scope

Provide the Avenor Properties public website and internal staff CRM interface in one independently versioned frontend repository. Deliver one verified feature slice at a time. The client portal is later, optional work.

This file defines project-wide scope and boundaries and indexes existing specifications. Detailed behavior, contracts and acceptance criteria belong in feature specs; this overview does not replace them or mark planned features delivered.

## Verified baseline

- Public homepage shell at `/` and staff shell at `/crm`, with separate layouts and shared design tokens and UI primitives.
- Loading, error and not-found handling, responsive foundation navigation and keyboard focus.
- Server-only backend transport and browser `/api/v1` proxy, verified against the Express health endpoint.
- Independent tooling, CI and validation commands. See the [foundation specification](specs/project-foundation/spec.md) for recorded evidence.
- Repository-contained shared documents and mockup. See [documentation organization](specs/documentation-organization/spec.md).
- Project-scoped Next.js runtime inspection through the pinned DevTools MCP connector, verified with the existing Webpack workflow and browser tooling. See the [agent tooling specification](specs/agent-tooling/spec.md).
- Staff sign-in/out, server-verified CRM protection, and Admin/Manager/Agent identities. The login form uses React Hook Form, a frontend Zod schema and locally owned Base Nova field/input primitives while retaining the native Better Auth contract. See the [staff authentication and roles specification](specs/staff-authentication-and-roles/spec.md).
- An optional, development-only Demo access group on `/login` signs into separately pre-provisioned Admin, Manager or Agent demo accounts through the same native auth flow. It requires ignored local configuration, is intentionally omitted from production and test rendering, and creates no accounts or permissions. See the [local demo staff login specification](specs/demo-staff-login/spec.md).
- The current frontend component catalog and role wiring have passed a behavior-preserving reuse and readability review. See the [component reuse review](specs/frontend-component-reuse-review/spec.md).
- The public, login and CRM layouts share the Avenor Properties architectural A mark with live wordmark text; editable public SVG assets and the file-based maroon/ivory favicon are included. See the [agency branding specification](specs/agency-branding/spec.md) for validation status.
- Public discovery uses accessible icon-only Buy/Rent controls in the header/menu and a small Staff sign-in footer link to `/login`. The CRM uses a responsive icon rail/sidebar with in-memory expansion, drawers and shared session feedback. It retains the existing routes, roles and Express authorization boundary. See the [header and sidebar polish specification](specs/header-sidebar-polish/spec.md).
- Poppins is self-hosted for application UI/body text and Lora for public display text and the wordmark. See the [typography specification](specs/typography/spec.md) and [font provenance](src/app/fonts/README.md).
- Staff property inventory, lifecycle and photo workflows; public search, featured listings, listing results and property detail/gallery routes. CRM property details use the authenticated read-only `/crm/properties/[id]` route for every staff role, with Admin/Manager editing at `/crm/properties/[id]/edit`; Agent edit requests redirect to details. Inventory labels keep CRM details, editing and the public `/properties/[id]` listing distinct, and public navigation appears only for published, available properties. Property reads/types/request handling and server-only mutations are separated; business writes use validated Server Actions and CRM inventory results stream independently. The feature is organized into data, public UI, CRM UI and shared presentation/loading modules without changing those workflows. See the [CRM property details specification](specs/crm-property-details/spec.md), [property-management specification](specs/property-management/spec.md), [data/forms refactor specification](specs/frontend-data-and-form-refactor/spec.md) and [property feature organization specification](specs/property-feature-organization/spec.md).
- An explicit, local/demo-only seed command adds 15 fictional labelled listings with generated illustrative images. See the [demo-property-data specification](specs/demo-property-data/spec.md).

Inquiries, leads and dashboards are not implemented. Lead ownership remains future work. The [property-management specification](specs/property-management/spec.md) and [implementation plan](docs/plans/property-management.md) record the delivered scope and exclusions.

## Verified presentation maintenance

The current presentation-maintenance slice refines the shared CRM staff-account row and property-image loading/failure placeholders without changing authentication, property API, image-delivery or authorization contracts. See the verified [staff account and property image polish specification](specs/account-and-image-polish/spec.md).

The loading and control clarity maintenance keeps the shared Dubai skyline for large route/result regions only, with one 64px skyline per property collection and a 96px LoadingState. Motion-safe SVG spinner feedback with operation text covers pending controls; photo loading uses neutral reserved shapes and unavailable photos remain static. Native selects use decorative logical-end SVG chevrons while retaining native keyboard behavior, and key public/CRM actions have visible labels. It preserves API, dependency, authentication, data, permission and public-404 behavior. See the verified [loading and control clarity specification](specs/loading-and-control-clarity/spec.md). The earlier [consistent loading specification](specs/consistent-loading/spec.md) remains the historical baseline for the superseded action/media presentation.

The [project review remediation](specs/project-review-remediation/spec.md) verifies CRM error recovery, UUID not-found handling, shared media/filter/upload definitions, public-form hydration guards, and the complete browser regression suite. This maintenance preserves API contracts, permissions and roadmap scope.

## Planned product scope

Remaining work includes website inquiry capture, contact and agent pages, lead management and ownership, pipeline, viewings, follow-up tasks and reporting. Later enhancements and the optional client portal remain subject to the roadmap.

Staff authentication, property management, homepage search and featured results, filtered listings, and property detail/gallery are already delivered within the verified baseline above. The roadmap records partial delivery for broader homepage, detail/inquiry and mobile-layout checklist items; their unchecked status does not make the delivered portions unimplemented.

The [roadmap](ROADMAP.md) owns checklist IDs and progress. The verified [authentication feature spec](specs/staff-authentication-and-roles/spec.md) covers P1-01 and the identity portion of P1-02. P1-03 remains pending because no lead records exist yet.

The auth implementation uses Better Auth 1.7.12's React client in Next.js and native server in Express. SQLite is the only database; Next.js does not run a second auth server or access the database. Provision staff through the backend's trusted operator command; there is no public signup or email-reset flow.

## Architecture and access

- The frontend consumes Express. It must not access the database, import backend source or own business authorization rules.
- Browser reconciliation reads and native Better Auth use `/api/v1`; server reads and business Server Actions use the server-only API transport. Backend origin configuration stays private.
- The backend owns API contracts. Define authenticated cookies, session forwarding and permission behavior in the authentication specs before implementation; navigation or route visibility alone is not authorization.
- Feature specs must define success, loading, empty and failure states, responsive behavior, keyboard access and verifiable acceptance criteria.

## Design direction

Use maroon `#701F35`, warm ivory `#FAF8F5` and charcoal `#252329`, with clear property information, photography and prominent search inspired by Property Finder while retaining the distinct Avenor Properties identity. The public property screens implement this direction. The [selected homepage mockup](docs/design/homepage-maroon-ivory-charcoal.png) remains a visual reference with illustrative branding and listings, rather than a flattened representation of the application.

## Specification and documentation ownership

- This `spec.md`: project purpose, boundaries, design direction and verified-baseline summary.
- [Feature specs](specs/README.md): detailed requirements, contracts, acceptance and evidence; use the existing template.
- [ROADMAP.md](ROADMAP.md): feature progress; [TECH_STACK.md](TECH_STACK.md): installed and deferred tools.
- [README.md](README.md) and [development guide](docs/development.md): setup and operational commands.
- [AGENTS.md](AGENTS.md): contribution instructions.

Keep this overview current as features are verified. Do not duplicate full feature requirements here. If documents disagree, reconcile them before implementation; do not silently override a feature contract. Shared documents use the frontend-first synchronization policy; this project-specific spec is maintained independently of the backend root spec.

## Validation

Use feature-specific acceptance checks and the repository quality commands documented in [AGENTS.md](AGENTS.md). The auth slice passed frontend and backend quality checks, real desktop/mobile browser coverage, and live SQLite lifecycle checks recorded in its feature specification.
