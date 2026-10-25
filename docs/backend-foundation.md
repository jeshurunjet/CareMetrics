# Backend foundation — Phases 2A–2D

Phase 2D now connects shared PostgreSQL shift scheduling; see [shift contracts](shift-backend-integration.md) and [current status](implementation-status.md). GPS and attendance remain unavailable.

The initial sections preserve the Phase 2A foundation decisions. Current Phase 2C adds essential transactional Admin management and minimal persistent audit; later phase updates below supersede earlier statements that these core reads/writes are deferred. See [current status](implementation-status.md) and [management contracts](admin-backend-mutations.md).

## Checkpoint, scope and current state

Git checkpoint **a66b54612898009b4cabd71fbbc55325fb61d204** preserves Phase 1E.5. Work is on **phase-2a**, with previous branches/reference/CSS/tests/evidence preserved. The user subsequently authorised a Git checkpoint/push on `phase-2a`, preserving prior iterations. No frontend deployment is authorised by this phase. The user's later Neon setup instruction separately authorises CLI/MCP configuration and PostgreSQL service deployment in the specified Neon project.

Implemented: Prisma schema/versioned migration, database-backed credentials, Auth.js sessions/sign-out, trusted active employee/tenant/role/house/client services, bounded read APIs, safe fictional seed and isolated database/auth tests. The existing Figma preview remains available. Full Employee/House/Client frontend integration is Phase 2B; attendance, GPS, Diary/Care submission APIs and all deferred backend modules remain absent.

## Dependency audit and decisions

Verified on isolated **Node 22.23.4 / pnpm 10.15.1**. Existing Next.js **16.3.8**, React/React DOM **19.3.1** and TypeScript **5.9.3** are retained. No framework upgrade. Repository Node range now requires at least 22.18 on the 22 line; use the verified Node 22 runtime for these checks.

| Addition | Installed version | Purpose |
| --- | --- | --- |
| `next-auth` | **5.0.0-beta.32** | Auth.js's documented Next.js v5 installation; compatible peer range includes Next 16 / React 19 |
| `prisma`, `@prisma/client`, `@prisma/adapter-pg` | **7.10.1** | Matching stable Prisma 7 CLI/client/driver; avoids Prisma 8 prerelease |
| `pg` / `@types/pg` | **8.23.1** | Node PostgreSQL pool and types |
| `argon2` | **0.45.1** | Argon2id password verification/hashing |
| `@vercel/functions` | **3.10.3** | Pool lifecycle attachment on Vercel |
| `server-only` | **0.0.1** | Enforced Next.js server module boundary |
| `tsx`, `dotenv` | **4.23.15**, **17.4.2** | Maintenance/seed execution and explicit CLI env loading |
| `@neon/config`, `@neon/env` | **1.9.3**, **1.6.4** | Official Neon CLI-installed configuration/env tooling |

Auth.js v5 is explicitly a beta dependency, not represented as a stable GA release. This follows its current official Next.js installation instructions and retains the requested provider/design; release/security monitoring and deployment acceptance remain required. No extra OAuth provider, Prisma Auth.js adapter, client database SDK or alternative authentication service is introduced.

Reviewed primary references: [Auth.js installation](https://authjs.dev/getting-started/installation), [Credentials](https://authjs.dev/getting-started/authentication/credentials), [session strategies](https://authjs.dev/concepts/session-strategies), [Prisma 7 upgrade/configuration](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7), [Neon/Prisma connection strategy](https://neon.com/docs/guides/prisma), and the locally installed Next.js authentication/DAL and Route Handler guides. The user's [Neon skill](https://neon.com/.well-known/agent-skills/neon/SKILL.md) and installed `neon-postgres` skill were read. Their Node/Vercel guidance preserves Prisma, uses node-postgres, pooled runtime connections and Vercel pool attachment. No Edge runtime is used.

## Neon setup and infrastructure boundary

Installed **Neon CLI 8.11.1** via the requested global npm command. Configured Codex's global MCP URL with OAuth and the specified project scope, with no API key in the repository. Installed official `neon` and `neon-postgres` skills globally. MCP configuration is installed; this runtime has no active Neon MCP tools, so MCP OAuth/tool connectivity is not claimed. The authenticated CLI performed the actual operations.

Requested organisation: `org-bitter-frost-50433978`; project: **CareMetrics / fragrant-snow-30323119**. `neon init -y --org-id … --project-id … --branch production --services postgres` was run, reusing pnpm and already installed agent tooling. Initial unauthenticated setup wrote an offline link only; after the user completed `neon login`, setup verified the project and pulled `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and `NEON_BRANCH` into ignored `.env.local`.

`neon config plan` then `neon deploy` both reported **“No changes — branch production already matches the policy”**, with **Postgres** as the utilised service. No Auth, Data API, Functions, storage or AI service was enabled. `neon.ts` does not explicitly disable unrelated Auth services. `neon deploy` is infrastructure reconciliation, not a Next.js frontend deployment.

Following the skill and Phase 2A's isolated-database requirement, `neon checkout phase-2a --create` created **phase-2a / br-billowing-rice-a78isrig**. Its connection and **empty public schema** were verified before migration. The versioned initial migration and fictional seed were applied **only to this development branch**. The `production` database/schema was not migrated, reset or seeded. Current ignored `.neon` and `.env.local` point to the development branch.

The CLI-generated policy gives new nondefault branches a **seven-day TTL**; this development branch is temporary and will expire unless its lifecycle is changed deliberately. The production branch is retained. Review the branch lifecycle before relying on this environment long term; migrations/seed in Git can recreate fictional development data without retaining secrets. Existing branches receive no policy overrides.

## Prisma schema and migration

`prisma/schema.prisma` uses the Prisma 7 **prisma-client** generator with output `src/generated/prisma`; generation occurs during install, typecheck and build. Output is ignored and never authored/imported by Client Components. `prisma.config.ts` explicitly loads `.env.local` then `.env` without overwriting supplied process variables, and selects **DATABASE_URL_UNPOOLED**, with **DIRECT_URL** as an optional legacy alias. There is no pooled-URL migration fallback.

Initial migration: `prisma/migrations/202610250001_initial_foundation/migration.sql`, enclosed in a transaction and tracked with PostgreSQL migration lock metadata. It was generated with `prisma migrate diff --from-empty --to-schema … --script`, then reviewed/extended with constraints and triggers not expressible in Prisma syntax. Never use `db push`, `migrate reset` or an uncontrolled production reset as a substitute.

Entities: Organisation; User (employee/account, Role enum and active/inactive/invited state); House; EmployeeHouseAssignment; Client; ClientContact; Shift; AttendanceRecord; CareTemplate; immutable CareTemplateVersion; ClientTemplateAssignment; ClientDiaryEntry; CareRecord; LoginAttempt security buckets. No OAuth/session tables are needed for the selected Credentials/JWT strategy.

UUID primary keys, composite tenant foreign keys, unique organisation codes/assignments/template versions and query indexes enforce stable relationships. Clients require exactly one house; employees can have multiple active assignments. Attendance has one unique shift and a composite relation ensuring its employee matches that shift. Author/client/template links cannot cross organisations. Historical templates retain exact versions. Published form definitions and answers are versioned JSON compatible with the existing dynamic renderer; template field validation and submission services are later work, not implicit functionality from JSON columns.

Database checks enforce normalised email, positive session versions, paired valid coordinates, shift/attendance timestamp order, positive template version/object definition and submitted timestamps. Triggers prevent published version updates/deletes and submitted Diary/Care original updates/deletes. Drafts remain mutable at schema level; no draft write API is supplied. Account password/status changes and organisation activation changes increment session versions. Existing history remains referenced with restrictive deletes; no cascade deletes erase care history.

Coordinates are configuration only: no geofence radius/window/accuracy rule is invented and no real attendance event is implemented. `category` is currently a Diary snapshot string; full category service/retention/corrections and clinical template approval await their own backend slices. No deferred module schema expansion is attempted.

### Applying migrations safely

1. Confirm the intended **isolated development** branch and inspect existing schema; do not print connection URLs.
2. Put pooled and direct URLs in ignored environment configuration. For remote databases use verified TLS; never disable certificate verification.
3. Run `pnpm db:generate`, `pnpm db:validate`, then `pnpm db:migrate` (`prisma migrate deploy`).
4. Run the explicitly confirmed fictional seed only on development, as described below.
5. Verify migration status and bounded authenticated reads. Test/review changes on a child branch before any separately authorised production migration.

## Server-only database and service structure

- `src/server/config`: explicit backend mode, trusted origin, required secret/connection validation and safe connection URL handling.
- `src/server/db.ts`: lazy singleton Prisma client over a bounded node-postgres Pool, `max: 5`, connection/idle limits, and `attachDatabasePool` when running on Vercel. Standalone disconnect disposes the external pool. These engineering limits are not a capacity/SLA claim.
- `src/server/auth`: Argon2id credentials, shared database throttling, Auth.js configuration and trusted active identity/capabilities.
- `src/server/data/access.ts`: current house/client scope and explicit safe DTO queries.
- `src/server/errors.ts`: safe 400/401/403/404/503 responses and private/no-store headers.

Neon runtime URL uses the pooled endpoint; migrations use the direct endpoint. Neon-pulled `sslmode=require` is strengthened to `verify-full` for Neon hosts; remote insecure modes are rejected. A pooled migration hostname is rejected. Credentials are not logged, exposed via `NEXT_PUBLIC_`, or returned to a browser. Before deployment, review dedicated least-privilege runtime versus migration roles; the current isolated development branch uses the CLI-provisioned server credential.

## Authentication and sessions

The existing Login appearance/CSS/layout is retained. An optional real authentication callback uses `next-auth/react` with Credentials; mock handlers remain a separate development path. No browser role/employee ID is accepted as authority. Login accepts a normalised bounded email/password and returns generic failure for invalid, unknown and inactive accounts. Hashes and plaintext passwords never enter employee DTOs or session responses. No registration, fake 2FA, reset email or invitation endpoint exists.

Argon2id uses 64 MiB memory, three iterations and one lane. Initial development passwords are random per account and supplied outside the repository through a private provisioning file. Unknown accounts perform dummy Argon2 verification. Malformed and oversized input is rejected. Persistent atomic PostgreSQL rate-limit buckets apply across app instances: five attempts per normalised email per 15 minutes, plus 200 attempts globally per minute; attempts include successes and failures. Buckets use HMAC identifiers, not plaintext email/IP. Expired buckets are cleaned on subsequent login attempts. No client-supplied forwarding/IP header is trusted to grant attempts. Review these conservative engineering limits and upstream abuse protection before deployment; targeted lockout/availability tradeoffs remain.

Auth.js issues encrypted JWT cookies containing subject and session version, **not an authoritative role**. Maximum rolling session age is eight hours as an initial engineering setting, subject to organisational session-policy review. Secure cookies are selected for HTTPS; production requires an exact HTTPS `AUTH_URL`. Auth.js provides HttpOnly/SameSite cookies and CSRF handling. Public Auth handlers additionally require the configured origin and exact POST Origin, and remove untrusted proxy host metadata. No custom token parser is used.

Every protected service re-reads active employee, organisation and session version from the database; current roles and assignments are checked at operation time. Role/assignment changes take effect on the next protected read. Password/status changes invalidate older sessions, including after reactivation. Organisation status changes invalidate member sessions. Sign-out clears the cookie and increments the employee's session version, deliberately invalidating **all of that employee's sessions**; replay of a previous cookie is denied. Secret rotation also invalidates existing sessions. Database availability errors return safe service errors, not a mock-login fallback. The Auth.js session endpoint also applies the active identity check.

## Access rules and bounded APIs

| API / helper | Authority and safe response |
| --- | --- |
| `GET /api/me` / `requireEmployee` | Verified session + active account/org/version; own ID/code/name/email/current role only |
| `GET /api/houses` | Current active assignment for Staff/Senior; active houses within own organisation for Manager/Admin; safe house fields, capped at 100 |
| `GET /api/houses/[id]/clients` | Authorised active parent house; same-tenant active clients, capped at 100 |
| `GET /api/clients/[id]` | Current authorised house, active client; basic profile and NOK only |
| `GET /api/admin/foundation` | Manager/Admin server capability; bounded availability metadata, no CRUD |
| `requireManagement` | Staff and Senior denied; Manager and Administrator allowed within organisation |
| `requireCapability` | `staff.assignedData`, management `admin.foundation`, Administrator-only `admin.accountAdministration`; unknown/deferred capabilities denied |

There is no general model/mutation API. Responses use explicit Prisma selects, private/no-store caching and safe error bodies. Unknown/unassigned clients return the same unavailable response. Invalid IDs cannot widen a query. Current-house transfers and assignment removal withdraw access immediately; history is not deleted. Management's broader house reads follow the established development contract and remain tenant scoped; account-administration capability remains Administrator-only. No production management mutation is implied by a capability helper.

Server layouts and the three real entry pages check identity directly; data APIs check independently at the data boundary. No middleware/proxy-only protection or globally cached identity is used. Missing sessions redirect entry pages to Login; APIs return 401. Permission denial returns 403, scoped missing records 404, invalid IDs 400 and service/configuration failures 503. Next.js may stream an unavailable page with HTTP 200 after a layout awaits identity; protected APIs retain the explicit status codes and no protected data is returned by deferred pages.

## Real versus preview versus deferred

`CAREMETRICS_BACKEND_MODE=database` explicitly enables the real foundation and always disables the mock provider even if the preview flag is true. Missing security configuration fails closed. Default `disabled` mode retains the opted-in Figma preview only when NODE_ENV=development and CAREMETRICS_UI_PREVIEW=true. Production never enables mock roles/authentication/CRUD.

In real mode: `/login`, `/shift-check`, `/dashboard` and the guarded `/admin/dashboard` are **bounded foundation entry views**, not a completed migration of business data. Login still goes to My Shifts, and Continue to dashboard works without clock-in. Actual shift rendering/attendance is not connected. Admin retains its desktop-only notice. Other existing feature pages remain preview-only and return unavailable/not-found in real mode; they cannot mutate fictional state just because an employee logged in. The original full Staff/Admin interfaces remain untouched in preview mode for Phase 2B integration.

Current local `.env.local` deliberately keeps the usual preview mode as the default. To start the real foundation separately:

```sh
PORT=8558 AUTH_URL=http://localhost:8558 CAREMETRICS_BACKEND_MODE=database CAREMETRICS_UI_PREVIEW=false pnpm dev
```

Use the private generated fictional credentials file identified by `CAREMETRICS_SEED_CREDENTIALS_FILE`; values are never printed here. Do not run another server on an occupied port. The automated real-auth tests start/stop their own 8558 server. The existing 8443 preview is not restarted or replaced. Restart a real backend server after changing Neon branches or connection variables: the Prisma singleton belongs to its running process and is not a hot-switching database router.

## Fictional seed and account bootstrap

`pnpm db:seed` is deliberately disabled in production Node/Vercel environments or when `NEON_BRANCH_NAME=production`. It also requires `CAREMETRICS_SEED_CONFIRM=fictional-development-only` and an exact `CAREMETRICS_SEED_DATABASE_NAME` match. These are operator confirmations, not a public API. Confirm the linked branch is isolated before setting them.

The seed creates one fictional Administrator, one Manager, two Staff, one Senior, two houses, multi-house assignments, three clients/NOK, two shifts and one predefined published Care Plan/assignment. Stable IDs are in `prisma/seed-data.ts`; they are domain fixtures, never credentials. No reference/browser snapshot or negative privacy fixture is imported.

Optional `CAREMETRICS_SEED_CREDENTIALS_FILE` is an owner-only 0600 JSON file **outside Git** mapping the fictional account emails in `seed-data.ts` to distinct generated random passwords (16–128 characters). Generate each with a cryptographic RNG, store privately, supply at first seed and distribute only through an approved channel. The verified setup generated these privately outside the repository. Do not copy values into chat, docs, command arguments or source.

Without this file, accounts are Invited with no password and cannot authenticate. Reseeding preserves existing IDs, records, roles, statuses and passwords rather than wiping/resetting. Supplying credentials on a later seed does not silently activate/reset an existing account. For already seeded invited accounts or password changes, use a separately reviewed operator-only maintenance procedure; no unrestricted signup/reset endpoint is exposed.

Production initial administration is not automatically bootstrapped: approve an operator/organisation and isolated target, generate credentials privately, hash with the same helper, create/activate only the intended account in a reviewed transaction, retain an operational audit and revoke bootstrap access. The fictional seed must not be used to create production privileged accounts. Full provisioning/invite/recovery is later work.

## Environment variable inventory

| Name | Use |
| --- | --- |
| `DATABASE_URL` | Server-only pooled runtime connection |
| `DATABASE_URL_UNPOOLED` | Server-only direct migration/maintenance connection pulled by Neon |
| `DIRECT_URL` | Optional legacy direct URL alias when UNPOOLED is absent |
| `AUTH_SECRET` | Unique random Auth.js/HMAC secret, at least 32 characters |
| `AUTH_URL` | Exact trusted application origin; production HTTPS required |
| `CAREMETRICS_BACKEND_MODE` | Explicit database or disabled foundation mode |
| `CAREMETRICS_UI_PREVIEW` | Deliberate development-only Figma preview opt-in |
| `NEON_BRANCH` | Neon CLI-managed branch identifier |
| `NEON_BRANCH_NAME` | Local development safety label used for seed/test guards |
| `CAREMETRICS_SEED_CONFIRM`, `CAREMETRICS_SEED_DATABASE_NAME` | Explicit fictional development seed confirmations |
| `CAREMETRICS_SEED_CREDENTIALS_FILE` | Private, untracked initial fictional credential file path |
| `BLOB_READ_WRITE_TOKEN` | Reserved only; no file service is wired |

`.env.local`, other env files and `.neon` are ignored. Only `.env.example` is tracked. Environment URLs/secrets are never included in this document. CLI config/seed explicitly read `.env.local`; Next.js uses its normal server env loading. Keep process variables ahead of files for isolated test runs.

## Verification commands and results

- `pnpm db:validate` validates schema without a live database.
- `pnpm test:backend:local` creates a new temporary localhost-only PostgreSQL cluster, migrates, seeds twice, runs service/constraint tests and two-width real-auth browser tests, then destroys **only that cluster** and private temporary credentials. It does not connect to/reset a pre-existing database. PostgreSQL binaries must be installed.
- `pnpm test:backend:neon` runs the same two-width auth/browser cases against the explicitly confirmed fictional `phase-2a` Neon development environment. It changes test account/assignment state, restoring roles/assignments/status, and advances session versions. Never run on production.
- `pnpm test:e2e` remains the complete original Figma-preview regression. It deliberately tests mock development mode, not real authentication/business persistence.
- `npm run build` generates Prisma then builds the production app. `pnpm test:production` retains all 141 existing preview-route checks and adds five disabled-backend API checks with forged client cookies/roles.
- `pnpm format[:check]` now enumerates authored files via Git, excluding regenerated Prisma output; lint also excludes generated code. Original assertions are not removed or weakened.

Final verified results: lint/types/format, **393 units / 17 files**, transactional migration/repeat seed plus **12 PostgreSQL service/constraint/security tests**, **10 local PostgreSQL real-auth browser tests**, **10 actual Neon real-auth browser tests**, **619 original Chromium preview passes / 126 intentional narrow-Admin skips**, the explicitly requested **npm run build**, and production isolation all pass. The build reported **Compiled successfully in 4.0s**. Original **141 preview-route checks** remain intact and **five added disabled-backend API probes** also fail closed. **Nine configured secret values / ten restricted fixture markers** are absent from **98 production client chunks**. All **385 authored source/test/tooling hashes** stayed frozen during final verification. See [implementation status](implementation-status.md) for widths, durations and limitations. No extra large visual collection was created; all 51 original export files and three CSS copies remain unchanged.

## Deployment prerequisites and remaining limits

This is a tested foundation, not approval to process real information. Use fictional data only. Before deployment: approve production organisation/account provisioning, trusted HTTPS origin/proxy setup, session/throttle policies, least-privilege DB roles, secret rotation, migrations/backup/restore, monitoring/retention/incident procedures, external fonts/resources and NZ privacy/security requirements. Review Auth.js beta updates and platform-native Argon2 installation. Vercel Fluid compute pool attachment is wired but not claimed tested on a deployed Vercel instance.

Firefox's pre-launch profile-folder blocker remains; Safari, physical devices, exhaustive accessibility, penetration testing and production operational acceptance remain unverified. MCP OAuth connectivity requires the agent's first-use sign-in/reload; CLI setup and Neon/PostgreSQL integration have been verified independently.

No real GPS/geofencing, attendance writes, Diary/Care submission service, full Admin CRUD, private files, Leave, corrections, builder publication, delivery, concern review, advanced reporting or frontend deployment. Remaining business operations require separate authorisation. Phase 2B read integration is recorded below.

## Phase 2B — essential real read UI

The preceding verification describes the preserved Phase 2A checkpoint. [Staff data integration](staff-data-integration.md) now connects Dashboard, Houses, House/Client Profiles, NOK, Search and own Profile to scoped PostgreSQL reads. Essential management directories/details use the same records. Server DTOs exclude unrelated/private metadata; errors never fall back to fixtures. Original CSS/preview remains, and all deferred writes remain unavailable. No schema/migration/dependency changes were needed.

Neon `phase-2a` was checked before tests and its expiry extended to **24 November 2026 at 11:18 NZDT**. Git work is on `phase-2b`, based on committed Phase 2A `a7c5747`. Authenticated browser verification now includes **375, 390 and 1280px** and the full Staff read journey. The new search API is included in production isolation. Current final evidence and remaining limits are in [implementation status](implementation-status.md). Management mutation integration is recommended next, subject to a separate instruction.

Phase 2B final checks pass: 393 units, 18 PostgreSQL services, 21 local/21 Neon authenticated browsers, 619 preview passes/126 intentional skips, lint/types/format/build and 141 preview-route/six disabled-API production probes. Original reference/CSS remain unchanged. No production deployment or real-data operational acceptance is implied.

## Phase 2C — management transactions and audit

Phase 2B is preserved at `8bafa57550f3bb2bf4a1870764800e29e422957e`; work is on `phase-2c`. [Essential Admin mutations](admin-backend-mutations.md) now connect core employee/house/client/NOK/assignment operations with origin/body validation, trusted capabilities, scoped targets, organisation/actor locks, expected-revision conflicts and atomic audit. Original Staff read contracts remain. New employees are Invited without credentials; there is no public password/provisioning endpoint.

Migration `202610250002_admin_audit` adds append-only AuditEvent with tenant/actor foreign keys, primary-contact uniqueness and **role-change** session revocation. Status/password/role changes now reject old cookies even if a later change restores the original state. It was verified in disposable PostgreSQL and applied only to the confirmed fictional Neon development branch. Production was not migrated or reseeded. No dependency change. Core capabilities `admin.employeeManagement`, `admin.houseManagement` and `admin.clientManagement` are enabled for management with stricter per-operation Administrator/account protections; unknown/deferred capabilities remain denied. Current evidence/limits are in [implementation status](implementation-status.md).

Phase 2C verification completed: 393 units, 36 PostgreSQL security/service cases, 25 local/25 Neon authenticated browser passes (two narrow UI skips each), 16 existing Admin core preview cases, and full Chromium coverage of 619 passes/126 intentional skips across the interrupted and exact resumed cases. Lint/types/format/schema/build and 141-route/16-API production isolation pass. Nine configured secrets/ten restricted fixtures are absent from 109 client chunks. No source changes were needed during the regression resume.
