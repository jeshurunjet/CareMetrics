# Phase 1E.5 — UI freeze and backend handover

Phase 2G update: [Persistent Client Diary](client-diary-backend.md) now connects submission, current-client-scoped history/detail and a minimal Admin read view. Drafts, corrections, uploads and Care Plans remain deferred in database mode. Attendance is covered by [Phase 2F](clock-out-attendance-backend.md); production attendance remains disabled. The historical sections below are superseded only within these implemented slices.

Historical Phase 2D update: real shared scheduling is now connected; [shift backend integration](shift-backend-integration.md) and [current status](implementation-status.md) supersede historical scheduling deferrals below. GPS and attendance remain unavailable.

## 1. Freeze and final inventory

Branch: `phase-1e5`, based on completed Phase 1E.4B checkpoint **0de1bbbb8bdd1b372b8ce1672a14a15806282513**. The brief's uncommitted-4B note was superseded by the earlier authorised commit/push. Phase 1E.4A remains at `9fb28d99ae7406640162b09b1e91aa5382833b5e`; earlier branches are preserved. No new push is part of this phase.

This is a documentation and verification freeze. No runtime, adapter, styling, dependency, configuration or test implementation was changed. Original reference files, original CSS and existing visual evidence are preserved; fifty pre-existing untracked duplicate screenshots are outside this change.

The [final route classification](route-map.md#phase-1e5-final-route-classification) accounts for every registered page family and its subviews. Staff includes Login/My Shifts/Dashboard, Houses/Clients/NOK/Search, Client/House Diary, Care Plan/Charting, Galleries, Roster/Timesheets, Leave, Notifications/Concerns, Profile and Settings. Desktop Admin includes Dashboard, Employees/Houses/Clients, assignments/contacts/transfers/location, workforce/attendance/corrections/leave, categories/configurable templates/versions/assignments, submitted records/corrections, Files, Notices/Concerns and Reports/Audit. Admin Settings remains a routed FutureModule placeholder. Staff Settings is Coming Soon. Recovery/reset/verification routes are planned but unregistered.

## 2. Staff/Admin integration review

Existing navigation adapters map real paths and contextual query parameters. Staff's nine primary destinations retain active states and mobile navigation; Admin's concern detail retains Notifications navigation context. URL-backed tabs/drawers, breadcrumbs/Back, refresh, invalid IDs and unavailable access states are exercised by established browser coverage. The original Admin width gate remains below 1024px; this is presentation, not authorisation.

The continuous Staff integration test follows fictional Login → My Shifts → Dashboard without clock-in → House → Client/NOK → Diary/new/submit/history, then representative Care Plan, repeating-table Charting, House Diary, Galleries, Roster/Timesheets, Leave, Notifications/Concerns, Profile and Settings. Existing Admin suites exercise employee create/edit/assignment/deactivation; house/location; client/NOK/transfer; shifts create/edit/cancel; attendance/leave review; categories; publish/version/assign templates; submitted-record corrections; file logical removal; notice publication and concern review. These interact through the same root development provider, not independent Staff/Admin fixtures.

Shared IDs and current assignments determine context. Employee IDs stay stable; employees can belong to multiple houses; each client has one current house. Shifts reference employees/houses and attendance references the same shift/employee. Published versions and submitted originals are retained; approved corrections append revisions. Transfers change current scope without erasing historical records. Existing negative fixtures intentionally exercise restricted, legacy and invalid records; they must not become production seed records simply to copy the preview wholesale.

## 3. Defects and intentional limitations

No new material integration defect was confirmed in this freeze review. No speculative refactor or new feature was added. The material handover ambiguity was corrected: attendance correction approval and full care-record correction management are explicitly **deferred backend features**, despite their completed development UI.

Real clock-in/out, secure uploads, account recovery/security, delivery, exports and unsupported field actions remain unavailable. Current attendance location labels (`fictional-verified`/`fictional-unverified`) and `demoAttendance` are not GPS evidence. Draft/submission/review/publication/file-removal messages refer to development-session changes only. Profile photo objects and mock download examples are temporary/public demonstrations.

The Admin browser contains broader fictional data after opt-in. Staff projections omit restricted contacts, colleague private data and internal concern notes, but browser projections and role switching are not confidentiality controls. The snapshot clock is a UI fixture, not a trusted event clock. Minor source differences and contained table scrolling are documented in existing visual indices; no redesign or cosmetic rewrite was undertaken. Settings and unregistered authentication recovery remain intentional gaps.

## 4. Submission boundary

[The frozen MVP](submission-mvp-scope.md) enables later real Staff authentication, assigned houses/clients/NOK, actual shifts, GPS clock-in/clock-out/attendance, Client Diary and Care Plan persistence/history. Essential Admin supports accounts, assignments, house coordinates, clients/NOK, scheduling, basic attendance and predefined template assignments. The currently registered 43 page files are grouped by module in the route inventory.

All other completed UI is preserved for future development. In particular advanced Charting, private Galleries/uploads, full Leave, both correction approval workflows, live visual builder publishing, delivery, concern review, advanced Reports/Audit, House Diary persistence and nonessential management are deferred. Submission availability is not activated in this UI-freeze phase.

## 5. Mock-to-backend replacement map

| Boundary | Current implementation / consumers | Next backend replacement |
| --- | --- | --- |
| Authentication/session | `modules/auth/mock-session.ts`, Login preview and `usePreviewSession`; browser marker/role selector | Auth.js server session, employee/account mapping, session lifecycle; never trust marker/role/employee ID from browser |
| Employee/house access | `developmentMockAdapter.getSnapshot`, selectors `myHouses`, shared `useStaffData`; Dashboard/HouseList/Profile | Server-scoped employee/assignment/house DTO queries; no full snapshot serialisation |
| Client/NOK retrieval | `data/queries.ts` getClient/getClientContacts/getClientsByHouse/search; ClientProfile/Contacts/Search | Parent-authorised client/contact queries with role-appropriate fields and bounded search |
| Shifts/scheduling | selectors `myShifts`, roster queries; Admin workforce `saveShift`/`cancelShift` | Scoped shift reads and transactional scheduling with overlap/timezone/current-assignment checks |
| GPS attendance | ClockIn's disabled real controls, `demoAttendance`, fictional attendance | New server attendance service/event model; no current real GPS write to promote |
| Diary/history | diary adapter `getHistory`/`getDiaryEntry`/`getCategories`/`saveDiary`/`queryDiaryHistory`; Diary forms/history/details | Authorised categories, author-owned draft decision, immutable submission and cursor history services |
| Care templates | care adapter `getAssignedCareTemplates`/`getAssignedCareTemplate`/`getReadableCareTemplate` | Published exact-version/assignment reads, seeded approved templates; keep shared form renderer |
| Care submissions/history | `saveCareRecord`/`getCareRecords`/`getCareRecord`/`queryCareHistory` | Server schema validation, durable answers/exact version, immutable history and optional author drafts |
| Essential Admin CRUD | core adapter `saveEmployee`/`assignHouses`/`setEmployeeStatus`/`saveHouse`/`saveClient`/`saveContacts`/`transferClient`; documentation `assignTemplate` | Trusted management operations/DTOs with organisation/scope checks, constraints, concurrency and safe account provisioning |
| Capabilities/production guards | `lib/preview.ts`, `lib/require-preview.ts`; page and layout gates | Keep development isolation; separately introduce server capability policy with UI-derived availability for authenticated submission routes |

Staff screens currently call `useStaffData` and `useUpdateStaffData` directly. Admin's `useAdmin` reads/updates the same provider through `usePreviewSession`. Root/layout code supplies fictional snapshots and `projection.ts`/`merge.ts` preserve preview continuity. Replace these at route/module boundaries incrementally with scoped reads and explicit commands; retain presentation, fields, tables and navigation. Do not send a whole organisation snapshot to production browsers or rebuild the frontend around a speculative generic repository layer. Deferred mutation adapters remain development-only until separately authorised.

## 6. Required entities and relationships

Use one organisation-scoped model: Organisation; Account/Auth.js session linked to Employee and role; House; EmployeeHouseAssignment (unique employee/house); Client (one current house); NOK/contact; Shift (employee/house, UTC start/end, cancellation); Attendance and append-only attendance events; DiaryCategory; DiaryEntry; CareTemplate and immutable PublishedTemplateVersion; ClientTemplateAssignment; CareRecord with exact version; optional author Draft. Add server-generated IDs, created/updated/submitted timestamps and concurrency versions where mutable.

Retain compatible future models for correction requests/revisions, attachment metadata/private objects, notices/read states, concerns/review events, leave and durable audit. Their current TypeScript shape is a migration reference, not an approved database schema. Organisation ownership is currently only partially represented by the single fictional organisation: every production relationship/query must be tenant scoped, with cross-organisation links rejected. Stable composite uniqueness and foreign keys must prevent duplicate assignments, mismatched attendance and missing version references. Do not treat display names such as house manager/assignedBy or legacy uploader strings as trusted account IDs.

## 7. Authentication and authorisation

Use Auth.js with trusted server identity mapped to an active employee/account/organisation. Define management roles and scope with the organisation before activation. Every server page/query/command must enforce session, organisation, role, current employee-house assignment, active client/house and exact parent-record access. Client, house, employee and template IDs in URLs are requests, never permission grants. Apply the same rules to history and direct routes, not just menu visibility; deny unknown/inactive/out-of-scope records safely.

Production must never accept preview passwords, sessionStorage markers, browser role switching, `meId` or a full client snapshot as authority. Keep server secrets out of client bundles; validate inputs and return minimal DTOs. Sensitive responses require appropriate cache isolation. Protect mutation endpoints against cross-site requests and replay, rate-limit authentication and expensive writes, and handle logout/revocation/account deactivation. Do not enable an inert demonstration login as if it were an authenticated submission build.

## 8. GPS attendance contract and policy decisions

Proposed clock-in command: `{ shiftId, latitude, longitude, accuracyMetres, measuredAt, idempotencyKey }`. Names are a handover proposal, not an implemented endpoint. Server derives authenticated employee/organisation, assigned house ID and configured house coordinates from trusted records; if supplied by the browser, employee/house IDs are cross-checked hints only. Server records receipt time independently of the device timestamp.

Validate an active authenticated employee; actual assigned, noncancelled eligible shift; current employee-house relationship; approved clock-in time window; configured house coordinates/policy; finite latitude/longitude in global ranges; nonnegative finite accuracy; measurement freshness and permitted clock skew; approved accuracy limit; computed distance within approved threshold. Recheck in a transaction and use uniqueness/idempotency to prevent concurrent duplicate clock-ins, clock-out without clock-in, repeated/conflicting events or more than one active attendance where policy forbids it. Do not infer eligibility from the visible three-row My Shifts list alone.

Successful response follows the database commit and includes attendance/event IDs, employee/shift/house association, event kind, server receipt/recorded timestamps, verification result and permitted evidence metadata/policy version. Keep browser measurement time distinct from server time. Repeated idempotent requests return the same committed result; stale/conflicting requests get an actionable error, not a second success. Avoid returning precise coordinates unnecessarily.

Denied/unavailable/inaccurate/stale/outside-boundary/configuration-missing location must produce no successful GPS-verified event. Show understandable feedback with retry where appropriate and contact-management guidance; never silently bypass GPS or manufacture an attendance event. Management exception workflows require separate approval and are not this submission's correction-approval feature.

**Unresolved before activation:** organisation-approved radius/distance calculation, maximum accuracy, freshness/clock skew, eligible clock-in window including overnight/DST/early/late events, missing house configuration handling, conflict rules, location retention/access and clock-out requirements. No numeric threshold is approved by this document. Existing provisional house geofence values do not establish production policy. Clock-out service and UI must wait for an approved location/eligibility policy rather than silently treating location as optional.

Collect location only for verification events, with HTTPS, browser permission and an understandable privacy notice; no continuous tracking. Ordinary browser location is spoofable and cannot prove physical presence. Minimise stored evidence, define access/retention/deletion, avoid coordinates in logs/analytics and review incident handling. This phase makes no real geolocation request and records no real attendance.

## 9. Diary and Care Plan service contracts

**Client Diary:** authorise current client/house and category scope server-side. Accept client/category ID, title/content, observation/covered event time, optional off-shift reason and idempotency token; derive author, organisation, house context and created/submitted timestamps on server. Snapshot category name where required for history. Validate lengths/content, category activity, NZ date conversion and state transitions. Store UTC instants, distinguish observation time from created/submitted time, and reject ambiguous/nonexistent NZ DST input rather than guessing. Newest-first history uses deterministic submitted/created timestamp plus ID ordering and a stable cursor, with permissions reapplied on every page/detail request.

Existing drafts must either become author-owned durable drafts with validated updates/version conflicts, or be explicitly unavailable in submission mode following a documented scope decision. A draft is never another author's editable record. Submitting atomically transitions the authorised draft or creates one immutable submitted original. Retries must not duplicate entries. Determine off-shift reason requirements from **persisted actual attendance and approved policy**, never `demoAttendance` or the existence of a scheduled shift alone.

**Care Plan:** read active client-template assignments and the exact published immutable version. Accept client/template/version, structured answers, covered time, off-shift reason and idempotency token; derive author/timestamps/server ID. Validate assignment and version eligibility at commit; return a clear stale-version/conflict response if publication/assignment changed. Historical reads fetch the recorded version, never silently substitute latest. Predefined templates can be seeded and management can assign them while builder publication remains deferred.

Preserve the generic configurable renderer and its field/section rules, options, conditions, required/visible semantics, numeric/date/time constraints and `repeatingTable` model with stable row and field IDs. Validate the same schema on the server, including hidden/unknown answers and row constraints; unsupported or attachment fields remain unavailable rather than accepted with fake success. Charting UI remains preserved even though advanced Charting is deferred. Versioned seeded forms must retain compatibility with historical row/value rendering.

For both services: transactionally persist originals and related metadata, generate IDs/timestamps on the server, enforce parent/tenant scope and optimistic concurrency, and return success only after commit. Failed requests retain user input and expose retry/error states. Submitted originals are immutable; correction request/revision management remains a future backend capability. Retention/correction policy is still needed before real information.

## 10. Seed and migration approach

Do not import the browser snapshot or reference export directly into a database. Build explicit fictional, deterministic server seed data for one development organisation: accounts/employees, houses/assignments, clients/NOK, shifts, approved predefined published Care Plan versions/assignments and a small valid history. Keep privacy-negative/legacy fixtures in tests only. Map display-name actors to valid IDs or exclude those rows; never fabricate identity to satisfy a foreign key.

Retain exact version/field/row identifiers when seeding representative history. Version seed scripts, make them repeatable in isolated environments, validate foreign keys/uniqueness and exercise transfers without erasing historical records. No production data import, Prisma schema, database migration or seed implementation is introduced here. Backups, restoration and real-data migration need separate review.

## 11. Proposed central capability plan

No capability runtime/configuration currently exists. The following dotted module names follow the brief and existing module vocabulary; they are a contract for a small server-owned availability map, not a new abstraction added this phase. Capability enabled does not replace identity/role/organisation/house checks. Unknown capabilities fail closed. Server routes, reads and writes enforce the same plan; the UI consumes permitted availability/reasons. Development demonstrations stay explicitly isolated from submission mode.

| Proposed capability | Submission backend target |
| --- | --- |
| `staff.assignedData` | Enable authorised dashboard/houses/clients/NOK |
| `attendance.gpsClockIn` | Enable after approved GPS policy and persisted events |
| `attendance.clockOut` | Enable after approved clock-out policy |
| `care.clientDiary` | Enable validated persistent submission/history |
| `care.assessments` | Enable predefined Care Plan submission/history |
| `admin.employeeManagement`, `admin.houseManagement`, `admin.clientManagement` | Enable essential authorised accounts/core records |
| `admin.shiftManagement`, `admin.attendanceViewing` | Enable scheduling/basic viewing |
| `admin.templateAssignments` | Enable predefined published versions/assignments |
| `care.charting`, `care.houseDiary` | Future development backend |
| `attendance.correctionReview`, `care.correctionReview` | Future development backend |
| `admin.templatePublishing` | Future development backend |
| `files.privateUploads`, `files.privateRetrieval` | Future development backend |
| `leave.management`, `notifications.delivery`, `concerns.review` | Future development backend |
| `admin.advancedReports`, `admin.auditDashboard` | Future development backend |

Authentication/session validation is mandatory infrastructure, not a switch a browser can enable. Gate deferred routes/actions with explanatory unavailable states in the submission build; preserve development UI and tests. Do not implement runtime gates until backend integration is separately authorised.

## 12. Security and privacy acceptance

Use fictional information only. Before real health/client data, obtain organisational review of NZ privacy obligations, hosting/residency/contracts, role policy, retention, correction/access requests, operational audit, backups/recovery, incident response, accessibility and device support. This document does not supply legal acceptance.

Keep Neon credentials, Auth.js secrets and Blob tokens server-side with environment separation. Later file services require private authorised retrieval, exact parent checks, type/size/scanning controls, safe filenames, retention and no public object URLs. Existing public assets and logical removal are not that service. Review external font/photo/map requests and prevent sensitive payloads reaching third parties, logs or analytics. Implement necessary operational security logging without claiming the current metadata-only audit preview is durable audit.

## 13. Verification and visual evidence

Final Phase 1E.5 results are recorded in [implementation status](implementation-status.md). Fresh Node 22 lint/types/format, **389 units**, full five-width Chromium (**619 passed / 126 intentional skips**), six-width Admin (**186 passed / 126 intentional skips**), production build and isolation (**141 preview URLs refused**, inert login) all passed. Each complete browser suite ran once, on frozen application source with no runtime/test/config changes. All **354 source/test/tooling hashes**, **51 reference files** and **three original CSS copies** remain unchanged; ten restricted fixture markers are absent from 90 production client chunks. See status for widths, durations and skip rationale.

Reuse [Staff navigation/profile evidence](ui-comparisons/phase-1d4/README.md), [core Admin evidence](ui-comparisons/phase-1e1/README.md), and existing Diary/Care Plan/Charting/4B comparisons. The final status lists representative reviewed files rather than creating another image collection. These demonstrate source fidelity and functional Chromium behaviour, not independent design approval or complete accessibility acceptance.

Firefox remains blocked before launch by its profile-folder error. Safari and physical-device testing are unverified. Exhaustive accessibility, security testing and production operational acceptance remain outstanding. Narrow Chromium viewports are not physical mobile-device acceptance.

## 14. Recommended first backend instruction

Separately authorise a small Auth.js + Prisma/Neon vertical slice using fictional data: trusted account/employee/organisation sessions, current house assignments and authorised house/client/NOK reads behind existing screens. Establish negative cross-tenant/role/house tests, safe DTOs and central server capabilities before enabling submissions. Keep the existing development preview isolated and previous branches intact. After that foundation, approve GPS/clock-out policies and implement real shifts/attendance, then persistent Client Diary and seeded-version Care Plan submissions/history with transaction/idempotency tests. Do not begin Phase 2 automatically.

## Phase 2A implementation update

The freeze above records Phase 1E.5's historical state. [Backend foundation](backend-foundation.md) now implements Prisma/PostgreSQL, database-backed Auth.js credentials/JWT sessions, active server identity/capabilities and scoped house/client/NOK read services. It documents the current dependencies, actual Neon development setup, migration/seed, permissions, real versus preview modes and checks. Production never trusts preview roles; in explicit database mode the mock provider is disabled and deferred pages remain unavailable. Real entry views are bounded foundation pages; the complete business frontend is not yet connected.

The submission scope is unchanged. No GPS/attendance write, Diary/Care submission backend or deferred management service is implied. The subsequent authorised Phase 2B read integration is recorded below.

## Phase 2B implementation update

[Staff data integration](staff-data-integration.md) connects the essential Staff read slice and bounded management directories/details to the existing trusted services. The same database records drive Dashboard, Houses, House/Client Profile, NOK, Search and own Profile. Existing Staff shell/cards/contacts/listing and Admin panel/table primitives are reused; no CSS/reference redesign or new frontend domain store. Missing photographs use established unavailable placeholders. Deferred business writes and management mutations remain unavailable in real mode; preview retains its isolated nonproduction interactions.

Phase 2A is preserved at `a7c5747`; working branch is `phase-2b`. Neon development expiry was extended to 24 November 2026, 11:18 NZDT. See [implementation status](implementation-status.md) for final verification. A separately authorised management mutation phase is recommended; GPS, attendance and documentation submissions remain future development.

## Phase 2C implementation update

[Essential Admin mutations](admin-backend-mutations.md) now provide trusted, transactionally audited employee/house/client/NOK/assignment management. Existing forms/pickers and original CSS are reused. Role/status changes revoke sessions; relationship and stale-revision conflicts reject the whole write. Invited employee creation does not provision credentials. The preview is preserved and operational/care/file writes remain deferred. Phase 2B checkpoint is `8bafa57550f3bb2bf4a1870764800e29e422957e`; working branch is `phase-2c`, with no push or production deployment. See [current status](implementation-status.md) for verification and remaining safeguards.
