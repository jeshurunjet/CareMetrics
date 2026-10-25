# Phase 2B — Real Staff data integration

## Baseline and scope

Phase 2A is preserved at `a7c5747928f68882b72da1aae34caf60568b7d67`; Phase 1E.5 at `a66b54612898009b4cabd71fbbc55325fb61d204`. The brief's uncommitted Phase 2A assumption was stale: its checkpoint already existed locally and remotely. Phase 2B works on a new `phase-2b` branch. No history was reset, no reference was deleted and no push or deployment is authorised by this phase. Fifty pre-existing duplicate screenshots remain untouched.

This phase connects selected read workflows to the existing Prisma/PostgreSQL/Auth.js foundation. It adds no schema, migration, dependency, frontend domain store, default password or new backend provider. All development records remain fictional.

## Screens and routes

| Route | Database-backed behaviour |
| --- | --- |
| `/shift-check` | Trusted current identity and existing Continue to dashboard; no clock-in required or recorded |
| `/dashboard` | Current employee, authorised house cards and current clients; schedule/attendance/Leave/notifications explicitly unavailable |
| `/houses` | Authorised active houses and active-client counts |
| `/houses/[id]` | Permitted address/phone/email, current clients, house switch and breadcrumbs |
| `/clients/[id]` | Permitted name/preferred name, summary, date of birth, current house and NOK |
| Client Overview NOK anchor | Contact name/relationship/phone/email and primary/emergency indicators; read only |
| `/search?q=...` | Server-scoped house/client search, including quick access, empty results and house-name/address matching |
| `/profile` | Session employee name/role/code/email/status and active assigned-house summary |
| `/settings` | Explicit unavailable state, no preferences persisted |
| `/admin/employees`, `/admin/houses`, `/admin/clients` and `[id]` | Management-only tenant-scoped read directories/details over the same records; contacts included in Client detail |

Existing preview components, CSS and reference source remain. The shared Staff shell, house listing, cards, contacts, source photo placeholder and primitive components now accept read data without calling the mock provider. Read-only profile variants retain source markup/classes while excluding unsupported edit, gallery and documentation modules. The Admin read shell retains the desktop gate, sidebar/topbar/content classes; existing panels, key/value view and paginated management table are reused. Global Admin search and management mutations remain unavailable. Admin Dashboard retains the authenticated foundation entry; it does not expose fabricated operational queues.

No fabricated house manager, NHI, photo, attendance or documentation is inferred from unrelated fixtures. The schema has no house/client photo field; existing Photo unavailable placeholders represent that honestly. Missing NOK renders the established empty state. Unsupported Client/House tabs display Future Development after server authorisation; preview-only child submission routes remain inaccessible.

## Server-only contracts

`src/server/data/staff.ts` exports:

- `getCurrentStaff()`: current authenticated employee DTO plus active assigned-house IDs/names.
- `getStaffOverview()`: safe employee, house summary and client summary DTOs for Dashboard/listing.
- `getHouseProfile(id)`: authorised house and its current active client summaries.
- `getClientProfile(id)`: authorised client profile/current house/NOK. Date of birth becomes a date-only ISO string.
- `searchStaff(input)`: authorised house/client summaries; empty input supports quick access. Query is a trimmed string of at most 120 characters; arrays/oversized values fail safely.

`src/server/data/admin-read.ts` exports management-only records and employee/house/client detail loaders. Every exported protected operation authenticates and authorises itself. Directory records are not an editable frontend store. Details are loaded by route; bulk lists do not include DOB, summaries, NOK, credential material or internal organisation fields. The existing API DTOs remain compatible.

`GET /api/search?q=...` exposes the same safe search contract with private/no-store responses. Duplicate query keys fail as invalid requests. No POST/PATCH/DELETE action is introduced. Existing `/api/me`, house/client and Admin foundation APIs remain server protected.

## Permissions and consistency

Identity comes exclusively from the Auth.js session, then the current active database employee and organisation. Browser employee IDs/roles and preview cookies confer no access. Session-version revocation remains effective.

Staff and Senior Staff require an active assignment to an active house in their organisation. Client queries also require that client's active status and current house to match the scope. Inactive assignments never grant access; client transfers take effect on the next server query. Managers/Administrators follow the established rule permitting active houses/clients across their own organisation. Own Profile lists actual assignments, while management Staff read directories may cover the organisation. Management employee directories require `requireManagement`; Staff never receive unrelated personnel records.

Composite tenant foreign keys preserve relationship consistency. Search scopes remain outside the OR matching terms so a broad or empty query cannot bypass assignment/tenant checks. NOK is fetched only after client authorisation. Invalid IDs and inaccessible IDs produce safe unavailable/not-found screens; inaccessible records do not reveal whether they exist.

## Loading, caching and errors

Protected route groups are dynamic; server components call services on navigation. There is no cross-user cache or persistent client snapshot. Leaf data operations recheck identity/scope independently of layouts; shared layouts provide navigation only. Existing route loading skeletons remain. Search debounces URL navigation and announces pending results.

Unauthenticated/revoked sessions redirect to login. Invalid/inaccessible entities use the established record-unavailable screen. Database/configuration failures return a generic unavailable card or sanitised 503 JSON, never internal errors or preview fixtures. Empty authorised datasets are genuine empty states rather than database failures.

## Mode boundary

`CAREMETRICS_BACKEND_MODE=database` disables preview regardless of the preview flag. The root never supplies the unrestricted mock provider in real mode. The selected routes then use database services only. Deferred mutations remain disabled, unavailable or preview-gated.

The original full Figma interaction suite remains available only through explicit nonproduction preview mode. Local default preview on port 8443 is preserved; tests explicitly select database mode on port 8558. A normal production user cannot opt into the mock adapter. Production isolation still tests the disabled backend and all historical preview routes, plus the new search API.

To run a separate real-data local preview with the existing ignored development environment (leave the normal 8443 preview untouched):

```sh
PORT=8558 AUTH_URL=http://localhost:8558 CAREMETRICS_BACKEND_MODE=database CAREMETRICS_UI_PREVIEW=false NEXT_BUILD_DIR=.next-backend pnpm dev
```

Use Node 22 and the privately provisioned fictional account credentials. No reseed, password regeneration or production configuration change is needed to view this slice. Do not run this alongside the automated backend tests, which reserve port 8558.

## Neon development lifecycle

Existing development branch `phase-2a` (`br-billowing-rice-a78isrig`) in project `fragrant-snow-30323119` was verified ready before tests. Its expiry was extended to **2026-11-23T22:18:28Z / 24 November 2026, 11:18 NZDT**. Local ignored configuration targets this branch, with pooled runtime/direct maintenance connections. A TLS read-only connectivity probe and the already applied `202610250001_initial_foundation` migration were verified. No reseed/migration was necessary on Neon and production was not modified. Recheck lifetime before the next phase; the Git branch and database branch intentionally have different names.

## Verification

Final Node 22 results: lint/strict types/format pass; **393 unit tests**, **18 PostgreSQL service/security tests**, **21 local authenticated browser cases**, **21 actual Neon browser cases**, and **619 full preview cases / 126 intentional narrow-Admin skips** pass. `npm run build` compiled successfully in **3.2s**. Production checks retain **141 blocked preview routes** and **six disabled-backend API probes**; nine configured secret values and ten restricted fixture markers are absent from 98 production client chunks. All 51 reference files and three original CSS copies remain unchanged. Detailed results and remaining limits are recorded in [implementation status](implementation-status.md). Local integration runs create/destroy only a disposable PostgreSQL cluster. Actual Neon browser checks use only the explicitly confirmed fictional development branch, restoring test roles/assignments/status and advancing session versions as expected. Existing security assertions remain; the former deferred `/houses` assertion now positively checks real authorised records and rejects unrelated/preview records.

Representative real-mode images are temporary local review artifacts, not a second screenshot collection. Review identified a missing-photo placeholder filling a Dashboard house card; its height now matches the original image area so house name/address remain readable. Auth browser coverage checks the label stays inside the card. An incomplete preview run was stopped before this correction; only the subsequent complete run is reported as final verification. The original full preview browser regression is run once after stabilising source. Node 22 is required.

## Deferred work and suggested next instruction

No real shift editing, GPS, attendance, Diary/Care writes, private file storage, notifications, Leave, corrections, full Admin CRUD or production deployment. The presence of schema tables is not a connected business feature. Admin global search/filter/edit workflows are not claimed complete. Auth.js remains beta and deployment/security/privacy/operational acceptance from Phase 2A remains outstanding.

Recommend a separately authorised Phase 2C for bounded management mutations over these same employees/houses/clients/contacts/assignments: reviewed input validation, tenant/role checks in each write, audit and session revocation on account/assignment changes, conflict handling and transactional negative tests. Preserve this working read slice before enabling shifts or documentation submissions. Do not start Phase 2C automatically.

## Phase 2C propagation update

The authorised [Admin mutation phase](admin-backend-mutations.md) now maintains the same records used by these read services. Employee-house changes and current-house client transfers apply on the next protected read; NOK and house contact updates appear after refresh/navigation. Deactivation and role changes revoke affected sessions; a role reversal/reactivation does not restore an old cookie. The read DTOs remain free of password hashes and audit/private management content.

Management forms no longer silently depend on preview mutations in database mode. Unimplemented profile/operational/file fields remain disabled. The original opt-in preview and Staff/mobile styling remain preserved. [Implementation status](implementation-status.md) holds current validation and the separate credential-provisioning/scheduling/GPS/documentation limitations; earlier recommendations to authorise Phase 2C are historical.
