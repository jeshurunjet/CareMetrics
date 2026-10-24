# CareMetrics

Phase 1E.4A desktop Admin submitted records and correction review, alongside workforce and core Employee, House and Client management on the Next.js foundation for a New Zealand disability-support care/workforce application. This is a UI-only development preview, with no real authentication, persistence, GPS verification or file services. Use fictional data only.

## Run locally

Use Node 22 LTS (see `.mise.toml`) and pnpm 10.15.1:

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open http://localhost:8443/login. If a server already owns that port, use `PORT=8444 pnpm dev`. Use any fictional email and non-empty password in the clearly labelled development mock sign-in to enter My Shifts; continue to the dashboard without attendance. Admin preview requires a desktop viewport. Preview requires `NODE_ENV=development` and `CAREMETRICS_UI_PREVIEW=true`; it is always unavailable in production. Production login and password recovery intentionally report unavailable services. Never enter real credentials.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:production
pnpm format:check
```

Playwright starts its own dev server on port 8555 with isolated output and fictional fixtures. `pnpm start` serves `.next-build` on 8443; all preview URLs should return 404 in production. `pnpm format` formats active source/tests/scripts/config, never the reference copies. Build does not replace lint/typechecking. See implementation status for actual results and limitations.

## Structure and phase boundary

- `reference/src.zip`, `reference/figma-export/`: untouched archive and safe extraction of latest visual source.
- `reference/workspace-before-bootstrap/`: previous migration source/config/README preserved before changes.
- `src/app/`: App Router, server preview gate and explicit placeholders.
- `src/components/`: approved-export icons and shell adaptations.
- `src/modules/`: authentication presentation and the shared typed Staff mock adapter; future feature services/repositories belong here.
- `src/styles/`: unchanged staff/admin CSS plus isolated bootstrap additions; `src/index.css` preserves global tokens/fonts.
- `tests/`: unit boundary/time checks and browser smoke flows.
- `docs/`: [source audit](docs/source-audit.md), [route map](docs/route-map.md), [status](docs/implementation-status.md), [decisions](docs/architecture-decisions.md), complete file/dependency inventory.

Next.js/React/TypeScript are active. Auth.js, Prisma, Neon PostgreSQL, private Vercel Blob and Vercel are approved future integrations, not configured services. No backend feature is production-ready. Login, My Shifts, Dashboard, Houses, House/Client Profiles, Contacts/NOK and Search reuse the approved Staff interface. Client and House Diary history, drafts, submission and correction requests now work in the development session and reset on reload. Care Plan now supports client-assigned versioned templates, configurable forms, drafts, submitted details and correction requests in the same development session. Charting now supports assigned categories, structured history, numeric exercise charts, configurable repeating equipment rows, drafts and targeted correction requests through the same renderer and session. Client and House Galleries now share scoped metadata, local demonstration downloads, temporary upload simulations and profile-photo selection. Secure storage is deferred. Roster and Timesheets now reuse the same shifts with a responsive calendar, scoped Team Schedule, own attendance and session-only correction requests. Real attendance and GPS remain disabled. Staff Leave now supports own history, fictional balances, session-only Pending Review requests, read-only decisions and roster context. Staff cannot cancel approved leave or perform management review. Staff Notifications now shares official scoped notices, employee-specific reads, own concern submission/history/details and contextual profile lists. No messages are delivered; supporting selection retains metadata only. Staff Profile now supports own allowlisted contact edits, read-only employment/account information, assigned-house links and a shared temporary photo; Settings intentionally displays Coming Soon. See the Admin workforce contracts for current session management workflows, and docs/configurable-forms.md for the shared renderer contracts. See docs/ui-migration-notes.md for visual comparisons and limitations.

`reference/` is local-only and excluded from Git. Fresh clones run all functional browser checks and migrated-screen captures; original-export comparisons run additionally when the local reference is present. Set `CAREMETRICS_SKIP_REFERENCE=true` to verify the no-reference path explicitly. Historical docs describe the locally retained originals.

For representative Firefox smoke checks, install the isolated Playwright test browser with `pnpm exec playwright install firefox`, then run `pnpm test:e2e:firefox`. On this host Firefox currently fails before application execution with `Could not find profile folder`; no Firefox application pass is claimed. This is selected desktop smoke coverage, not full browser/device certification. See [Staff UI completion review](docs/staff-ui-completion-review.md) for routes, remaining placeholders and future integration boundaries.

The desktop Admin core preview now includes Dashboard, Employees, Houses, Clients, Contacts/NOK and confirmed assignment/transfer workflows. From development Login choose **Preview administration**. Fresh direct Admin entry requires explicit development opt-in; role demonstrations are in the labelled account disclosure. Admin edits and Staff views share one in-memory session; reload resets records and roles. Never introduce real personnel/client/health data. Roster Calendar, Shift List/create/edit/cancel, Attendance Monitor/Timesheets/correction review and Leave review/calendar now operate on those same session records. Original attendance remains immutable; approved corrections change only effective timesheets. Leave approval never changes shifts or balances. Care Documentation now configures diary categories and drafts, validates/publishes immutable Care Plan/Charting versions and explicitly assigns them to clients through the existing Staff renderer. Submitted-record review, files, notification publication, concerns, reports and settings remain deferred. Read [documentation-builder contracts](docs/admin-documentation-builder.md). Read [Admin core contracts](docs/admin-core-data-management.md) and [workforce contracts](docs/admin-workforce-management.md).

Run `pnpm test:e2e:admin` for Admin workflow/comparison checks at 375/390/768 (desktop notice) and 1280/1440/1600px. The ordinary full browser command retains all earlier Staff tests and includes Admin coverage at its established five widths.

Admin submitted documentation and immutable correction-review UI: [contracts](docs/admin-record-review.md). Fictional session-only data; no production services are connected.
