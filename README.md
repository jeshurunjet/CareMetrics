# CareMetrics

CareMetrics is a mobile-first care documentation and workforce management application developed for a New Zealand disability-support context. It brings assigned house/client information, shifts, attendance, Client Diary and Care Plans into one Staff workflow, with essential desktop Admin management.

This repository contains the implemented Next.js application through Phase 2J and the subsequent GPS, live-map and Google Maps evaluation updates. The database-connected MVP is distinct from the broader Figma-derived UI prototype retained for future development. All evaluation records are fictional; this is an academic prototype, not an approved clinical or payroll system.

## Features

| Area | Implemented database-connected behaviour |
| --- | --- |
| Authentication and access | Auth.js credential login, Argon2id password verification, authenticated sessions/sign-out, active-account checks, and server-enforced organisation, role and house/client scope. |
| Staff dashboard and records | Assigned Houses, Client Profiles, next-of-kin/contact information, scoped search, My Shifts and Roster. Staff can continue to Dashboard without clocking in. |
| Essential Admin management | Employee, House, Client and next-of-kin management; employee/house and client/house assignments; transactional writes and persistent mutation audit metadata. |
| Scheduling | Admin shift creation, editing and cancellation; Staff views of their assigned shifts; overlap, stale-update and access validation. |
| Attendance | Server-validated clock-in and clock-out, own attendance history, management read access and immutable event evidence under explicit policies. Production house-verification attendance remains disabled. |
| GPS evaluation | Foreground location preview with accuracy/freshness checks, Stop and Recenter controls, lifecycle cleanup, event-only persistence on accepted clock-in, and retained attendance-location viewing. The isolated fictional staging mode records location without enforcing proximity to a house. |
| Maps | Google Maps JavaScript API evaluation for the pre-clock-in preview using Glenfield Mall as a public reference; consent-gated OpenStreetMap/Leaflet for recorded attendance evidence. The reference is not a real client address. |
| Client Diary | Authorised submission, newest-first history and management reads of persistent, immutable submitted entries. |
| Care Plans | Client-assigned, versioned templates; configurable forms; exact-template-version submissions, persistent history and management reads. |
| Location retention | Seven-day precise-evidence expiry in the fictional GPS mode, a restricted purge operation and signed QStash scheduling. Attendance and audit records are preserved when precise coordinates are removed. |
| Android delivery | Online-first PWA manifest/icons, verified HTTPS association and a signed Trusted Web Activity wrapper. APK 1.0.1 / versionCode 2 has documented acceptance on one REDMAGIC 10 Pro / Android 16 / Brave combination. |

The existing fictional evaluation deployment is [caremetrics-staging.vercel.app](https://caremetrics-staging.vercel.app). Records require an authorised account; there are no published reusable login credentials. APKs and signing materials are maintained separately from this Git repository.

## Scope and limitations

The broader development-only UI includes Charting, House Diary, Galleries/Files, Leave, notifications/concerns, correction review, a visual documentation builder and Reports/Audit. These interfaces do **not** establish working backend services in the submitted MVP. Deferred actions in database mode are unavailable rather than reporting simulated saves as successful. Persistent Diary/Care Plan draft saving, private uploads, profile/photo editing, Settings, self-service account provisioning/recovery and the full correction workflows are also deferred.

GPS is spoofable browser evidence, not proof of physical attendance. The fictional recording mode can accept an off-reference event with a warning; it does not implement an approved ten-metre production geofence. Foreground preview updates are transient, and navigating away or stopping the preview ends the observer. The seven-day deadline marks evidence expiry; physical deletion depends on scheduled delivery and retries.

The Android wrapper requires network access. Offline record creation/synchronisation, broad device/browser certification, clinical approval and organisational production readiness are not claimed. A successful test on one physical device does not establish compatibility with every Android device. See the detailed handovers for simulated versus physical tests and remaining scenarios.

## Architecture

- **Application:** Next.js App Router, React and TypeScript, with Staff mobile and Admin desktop interfaces adapted from the original Figma export.
- **Server:** Auth.js sessions, trusted identity/capability checks, scoped services, validation and API handlers. Access checks apply to reads and writes independently of navigation.
- **Persistence:** Prisma with PostgreSQL/Neon, versioned SQL migrations, database constraints, transactions and append-only audit/event protections.
- **Hosting and integration:** Vercel HTTPS staging, Google Maps JavaScript API evaluation, Leaflet/OpenStreetMap and signed QStash location-cleanup deliveries.
- **Android:** Trusted Web Activity loading the verified hosted application, with Digital Asset Links and a separately managed signing identity.

| Path | Purpose |
| --- | --- |
| `src/app/` | Routes, server-rendered entry points and API handlers. |
| `src/modules/` | Staff/Admin feature interfaces, forms and adapters. |
| `src/server/` | Authentication, authorisation, configuration, services and persistence boundaries. |
| `src/styles/`, `src/index.css` | Shared visual tokens and Staff/Admin styles. |
| `prisma/schema.prisma`, `prisma/migrations/` | Database schema and versioned migrations; no database records or credentials. |
| `tests/` | Unit, database integration and browser acceptance tests with fictional fixtures. |
| `scripts/` | Guarded local verification, production isolation checks and operator tooling. |
| `docs/` | Feature contracts, implementation evidence and historical phase handovers. |
| `reference/` | Local-only original Figma/migration references, excluded from Git. |

## Run locally

Use **Node.js 22 LTS** (the package requires `>=22.18.0 <23`) and **pnpm 10.15.1**. `.mise.toml` and `.nvmrc` describe the toolchain.

```sh
git clone https://github.com/jeshurunjet/CareMetrics.git
cd CareMetrics
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Choose one of the two mutually exclusive modes below. Keep `.env.local` private; `.env.example` contains blank settings and explanatory comments.

### Database-connected MVP

Provision your own empty, isolated development PostgreSQL database. Configure the following in `.env.local`:

| Setting | Local database mode |
| --- | --- |
| `CAREMETRICS_BACKEND_MODE` | `database` |
| `CAREMETRICS_UI_PREVIEW` | `false` |
| `DATABASE_URL` | Your server-only runtime connection. Remote databases require verified TLS. |
| `DATABASE_URL_UNPOOLED` | Matching direct connection for migrations/seeding; a local connection may match the runtime URL. |
| `AUTH_SECRET` | A locally generated random secret of at least 32 characters. |
| `AUTH_URL` | `http://localhost:8443`, matching the actual local application origin. |

`DIRECT_URL` is a legacy fallback when `DATABASE_URL_UNPOOLED` is absent. Neon runtime connections may use the pooler; migrations require the direct hostname. Do not reuse the project's hosted database or put connection settings in browser variables.

Generate a private Auth.js secret locally, then copy its output into your private environment file:

```sh
node -e 'console.log(require("node:crypto").randomBytes(48).toString("base64url"))'
pnpm db:generate
pnpm db:validate
pnpm db:migrate
```

For an initial fictional seed, explicitly set `CAREMETRICS_SEED_CONFIRM=fictional-development-only` and `CAREMETRICS_SEED_DATABASE_NAME` to your exact isolated database name. To create active accounts on the **first** seed, also set `CAREMETRICS_SEED_CREDENTIALS_FILE` to an owner-only file outside the repository (permissions `0600`). Its JSON shape is `{ "<seed account email>": "<unique generated password>" }`; use the fictional account emails in `prisma/seed-data.ts` and distinct random passwords of 16–128 characters. No default password or public provisioning endpoint exists.

```sh
pnpm db:seed
pnpm dev
```

Without a private credentials file, seeded accounts remain Invited and cannot log in. Reseeding preserves existing passwords/status and does not activate those accounts. Remove seed confirmation/path settings after provisioning. The seed is blocked in production; do not seed or reset a populated/shared database.

Open [localhost:8443/login](http://localhost:8443/login). Use `PORT=8444 pnpm dev` if necessary and update `AUTH_URL` to match. Attendance remains unavailable without an explicit approved policy. Leave GPS/demo/scheduler variables blank for ordinary local setup; the guarded test runner supplies isolated fictional policies for its own processes. Hosted demo settings are deliberately pinned to the existing fictional staging identity and are not a generic deployment recipe.

### Development-only UI preview

Keep the defaults from `.env.example`: `CAREMETRICS_BACKEND_MODE=disabled` and `CAREMETRICS_UI_PREVIEW=true`, then run `pnpm dev`. The labelled mock sign-in accepts fictional input. Choose **Preview administration** for desktop Admin demonstrations. Changes are in memory and reset on reload; there is no real authentication or persistence in this mode. Preview access requires development mode and is refused in production.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
pnpm test:production
```

`pnpm build` generates Prisma and uses `.next-build`; `pnpm start` serves that build on port 8443. The production verifier checks public assets, security/isolation boundaries and refusal of development preview routes. A build does not replace lint, type checks or tests.

For database and browser verification:

```sh
pnpm exec playwright install chromium
pnpm test:backend:local
pnpm test:e2e
pnpm test:e2e:admin
```

The local backend runner requires PostgreSQL tools (`initdb`, `pg_ctl`, `createdb`) on `PATH`. It creates a temporary local cluster, applies migrations, seeds fictional accounts, runs service/authenticated browser checks and removes its owned cluster. It does not require the hosted Neon database. Preview browser tests use isolated development output and fictional fixtures. Comparisons against the original export additionally require the locally retained `reference/`; fresh clones cannot reproduce missing original-export comparisons. Set `CAREMETRICS_SKIP_REFERENCE=true` to exercise the no-reference path.

Historical phase results are recorded in the documentation rather than presented as a new full-suite run. The Google Maps handover records 572 unit and 290 database integration passes, focused browser/SDK checks and actual Android GPS acceptance. Simulated browser location tests and physical-device results are explicitly distinguished. Representative Firefox checks are available with `pnpm test:e2e:firefox`; earlier host launch failures are documented and are not a Firefox certification.

## Development documentation

| Reference | Topic |
| --- | --- |
| [Implementation status](docs/implementation-status.md) | Chronological evidence, checkpoints and limitations; read newer dated updates before historical entries. |
| [Architecture decisions](docs/architecture-decisions.md) and [database schema](prisma/schema.prisma) | Design decisions and current persistence structure. |
| [Route map](docs/route-map.md) and [MVP scope](docs/submission-mvp-scope.md) | Navigation, access boundaries and implemented/deferred scope. |
| [Backend foundation](docs/backend-foundation.md) and [Admin mutations](docs/admin-backend-mutations.md) | Sessions, access controls, management writes and audit. |
| [Shift integration](docs/shift-backend-integration.md) | Shared scheduling and Staff shift views. |
| [GPS clock-in](docs/gps-clock-in-backend.md) and [clock-out/history](docs/clock-out-attendance-backend.md) | Attendance contracts, policies and immutable evidence. |
| [Client Diary](docs/client-diary-backend.md) and [Care Plans](docs/care-plan-backend.md) | Persistent submissions, exact-version forms and scoped history. |
| [GPS demo and presentation](docs/gps-demo-and-visual-polish.md) | Fictional recording mode, retention, cleanup and physical acceptance. |
| [Live GPS preview](docs/live-gps-map-preview.md) and [Google Maps](docs/google-maps-demo.md) | Foreground observer lifecycle, map interaction and genuine Android follow-up. |
| [Android/PWA readiness](docs/android-pwa-readiness.md) and [deployment/Android acceptance](docs/deployment-and-android-acceptance.md) | Hosting, wrapper/signing association, installation and device-test limits. |
| [UI migration notes](docs/ui-migration-notes.md) and [historical handovers](docs/history/) | Phase 0, UI migration phases and backend phase checkpoints. |

Git-triggered deployments are disabled in `vercel.json`. Deployment, live database changes, scheduler configuration and Android signing/release remain separate operator actions. Environment files, private credentials, signing keys, APK binaries, academic submission artifacts and local reference exports do not belong in Git.
