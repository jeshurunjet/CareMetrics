# Implementation status — Phase 1E.1

Desktop Admin foundations and core Employee/House/Client management are ported as fictional development previews. They use the same typed domain and in-memory session as Staff. No UI is backend-connected or production-ready. See [Admin contracts](admin-core-data-management.md), [Staff review](staff-ui-completion-review.md), [route map](route-map.md) and the archived [Phase 1D.4 status](history/phase-1d4-status.md).

## Git checkpoint

Completed Phase 1D.4 is preserved at local **b1a0344** on `phase-1d4`. Its Node 22 lint/types/format, 150 units, all 50 Profile/integration cases, build and 74 production-isolation checks passed before that checkpoint; its previous complete 485-case result remains documented. New work is on local `phase-1e1`. Prior branches, original reference/CSS, earlier tests/evidence and unrelated duplicate screenshots are preserved. No reset/discard or remote push. Current phase changes remain uncommitted.

| Area | Ported UI / development limit |
| --- | --- |
| Admin shell | Source sidebar/topbar, collapse, current section/breadcrumbs, core-entity search, review link and labelled account-role disclosure. Desktop gate remains UX only. |
| Dashboard | Eight shared-data totals; today's shift/attendance projection, linked employees/houses, pending queues and representative submission activity. No roster editing, approvals or audit service. |
| Employees | Directory/search/role/house/status filters/pagination, create/edit, overview, multi-house assignments, account status/role display and reversible deactivation. No account provisioning/invitation/password services. |
| Houses | Cards/list/search/status/pagination, create/edit, overview, employee/client relationships, fictional location/map and provisional radius. No GPS verification/geocoding/geofencing. |
| Clients | Directory/filter/pagination, create/edit, overview, stable Contacts/NOK and confirmed transfer. Sensitive identifiers absent from general rows/search. Documentation tabs show bounded shared summaries only. |
| Roles | Administrator and Manager core management; Manager cannot grant/edit/deactivate Administrator accounts or change their assignments. Staff/Senior Staff management mutations reject. All are development demonstrations, not authentication. |
| Relationships | Valid multi-house employee assignments; current/future-shift dependency removal blocked. One current client house; transfer preserves IDs, history, template versions, files and attendance. |
| Staff propagation | Shared employee contacts/photos, assigned houses/access, edited house information, created clients, NOK and transfers update current projected Staff views during client navigation. |
| Photos | Existing picker/policy reused; mounted form previews and entity-keyed provider URL ownership revoke on cancellation/replacement/reset/unmount. No real upload or permanent storage. |
| Future Admin modules | Explicit placeholders for roster/attendance management, leave review, documentation/template building, files, publication/concerns, reports/audit and settings. |

## Verification

Verification uses isolated **Node 22.23.4 / pnpm 10.15.1**, without changing system-wide Node. The existing user preview continues on its pre-existing host runtime.

| Check | Result |
| --- | --- |
| Lint / strict TypeScript / formatting | PASS, zero lint warnings |
| Unit tests | PASS, 203 across 12 files (150 retained + 53 new) |
| Complete five-width Chromium regression | PASS, 525 tests, including all 485 previous Staff cases; 45 intentional skips for desktop management at narrow widths; 10.4 minutes |
| Final six-width Admin suite | PASS, 57 tests across 375/390/768/1280/1440/1600px; 45 intentional narrow management skips; includes final source-state capture waits and Admin presentation corrections |
| Production build / isolation | PASS, 92 preview routes refused in production even with the preview flag enabled; production login inert |
| Visual evidence | 96 raw PNGs and 18 paired boards, reviewed at all six widths; no collected page errors or document-level overflow in migrated captures |
| Existing local preview | PASS, HTTP 200 on 13 core Admin URLs plus Staff Dashboard/Profile; existing host runtime |
| Source / client-bundle integrity | PASS, all 51 reference files and three original CSS copies unchanged; private fixture markers absent from final production client chunks |

Existing notification tests caught a concern-attachment projection regression during the first full attempt. It was fixed using the existing parent-attachment policy and covered by a new unit test; all five affected browser cases and the restarted complete regression pass. The first interrupted run is not counted as passing. After the complete run, only Admin presentation and capture-readiness details changed; the complete six-width Admin suite, static checks, build and isolation checks passed again. No shared Staff/domain logic changed after that full pass.

No previous passing test was weakened or removed. New tests cover core entities/validation/role negatives, shared propagation, assignments/dependencies, transfers/history, contacts/removal/primary flags, pagination/filtering, unavailable IDs, refresh/Back, unsaved forms, source comparisons and narrow gating. The full suite retains existing diary/care/chart/file/roster/attendance/leave/notification integrity, disabled real clock-in and production isolation checks.

## Remaining limitations and next step

Everything remains fictional and session-only. Reload/logout resets edits, new IDs, role selection and temporary photos. Once Admin is opened, the browser contains the broader fictional dataset: UI role/scoped views are not a confidentiality or production permission boundary. Current-house access to historical client documentation is a prototype policy awaiting organisational approval. Optional NHI checks are the export's format demonstration, not verification of a health identifier.

Production Auth.js identity, trusted server organisation/role/house checks, Prisma/Neon persistence, invitations/recovery, private Blob storage, real GPS/attendance, management decisions, notification delivery, durable audit, concurrency/recovery and deployment remain unimplemented. Broader browsers, real devices, exhaustive accessibility, external asset review, independent design acceptance and organisational privacy/security/operational approval remain outstanding. Firefox's earlier local pre-launch profile-folder error is not a passing application result; Safari/physical devices were not tested.

After review, agree one bounded operational Admin migration using these same contracts, with roster/attendance the likely next slice. Do not automatically begin Phase 1E.2, backend integration or deployment.
