# Phase 2C — Essential Admin mutations and persistent audit

## Checkpoint and database target

Phase 2B is preserved locally at **8bafa57550f3bb2bf4a1870764800e29e422957e**, on `phase-2b`. Phase 2C works on `phase-2c`. No history was reset, no reference was added to Git, and no push or production deployment is authorised. Fifty unrelated duplicate screenshots remain untouched. Phase 2A remains `a7c5747928f68882b72da1aae34caf60568b7d67`.

Existing Neon development branch **phase-2a / br-billowing-rice-a78isrig**, project `fragrant-snow-30323119`, was verified ready. Its expiry remains **24 November 2026 at 11:18 NZDT** (`2026-11-23T22:18:28Z`). Before migration, a guarded read verified `.neon`, branch labels, the actual read/write endpoint from CLI API metadata, matching pooled/direct database identity, certificate-verified client TLS, the applied foundation migration, and zero existing duplicate primary contacts. No connection strings or credentials were printed. Neon terminates client TLS at its proxy; client certificate verification is checked on the TLS socket, not inferred from the internal PostgreSQL proxy connection.

Migration **202610250002_admin_audit** was tested in disposable PostgreSQL before application to this development branch. It adds only the audit table/indexes/append-only trigger, at-most-one-primary-contact partial unique index and role-change session revocation. No populated database was reset or reseeded. The production branch was not modified. Prisma/client/adapter stay **7.10.1**; dependencies are unchanged.

## Connected operations

| Domain | Explicit database operations |
| --- | --- |
| Employees | Create Invited record, edit name/code/email and permitted role/status, activate/deactivate eligible accounts, assign/remove houses |
| Houses | Create/edit name/code/full address/phone/email/status and paired latitude/longitude; safe deactivation/reactivation |
| Clients | Create/edit profile/reference/preferred name/DOB/summary/status; one current valid house; separately confirmed transfer |
| NOK | Create/edit contacts, select at most one primary, emergency flags, confirmed removal; stable existing IDs retained |

Existing canonical directories, new/edit routes and detail tabs are used. `EmployeeFormView`, `HouseFormView`, `ClientFormView`, `HousePickerView` and `ContactsEditor` reuse the approved form structure and CSS. Original preview wrappers still use their original adapter. Real routes use narrow management DTOs and explicit commands, not a copied StaffSnapshot or a new authoritative frontend store. Directory filters/table/card pagination remain presentation state.

Real saves show Saving, retain input on validation/conflict/service errors, and navigate/refresh only after a committed response. Failed requests never call preview mutations. Save confirmations describe PostgreSQL. Deactivation, assignment and transfer dialogs explain effects on current access and retained history. Disabled future fields remain visible with an honest explanation.

Unavailable fields are not silently discarded as if saved: employee preferred name/phone/private address/emergency/start date and photos; separate house suburb/description/manager/photo/radius; client NHI/alerts/photo; contact address/notes. These fields are outside the current database model and are disabled in real forms. The full original preview retains them. No fake password, geofence radius, photo or private-file service is supplied.

## Permissions

| Actor | Core management authority |
| --- | --- |
| Administrator | Core employee/house/client/contact/assignment operations; existing role changes, subject to self/last-admin protections |
| Manager | Core houses/clients/contacts and non-Administrator employees/assignments; can create Staff/Senior Staff Invited records; cannot edit Administrator accounts or their assignments and cannot change existing roles |
| Staff / Senior Staff | No Admin mutations, even with forged browser role/organisation/actor fields |
| Unauthenticated/inactive/revoked | No protected operations |

Core capabilities are `admin.employeeManagement`, `admin.houseManagement`, `admin.clientManagement`. Unknown/deferred capabilities still fail closed. Each service resolves trusted identity, takes the organisation/actor locks, rechecks active organisation/account/session version and role inside the transaction, then validates the target and proposal. IDs are requests, never permission grants. All targets/references must belong to the actor's organisation. UI role restrictions are convenience only.

The global unique normalised login-email rule is retained because login does not select an organisation. Employee identifiers, house codes and client references remain unique within the organisation and are normalised to uppercase by the management services. Emails are lowercased. No submitted organisation ID, actor ID, credential/hash or arbitrary field is accepted.

## Explicit HTTP contracts

| Endpoint | Method / operation |
| --- | --- |
| `/api/admin/employees` | POST create |
| `/api/admin/employees/[id]` | PATCH validated edit |
| `/api/admin/employees/[id]/status` | POST account state |
| `/api/admin/employees/[id]/assignments` | PUT reviewed assignment set |
| `/api/admin/houses` | POST create |
| `/api/admin/houses/[id]` | PATCH validated edit/status/location |
| `/api/admin/clients` | POST create, optionally with NOK in the same transaction |
| `/api/admin/clients/[id]` | PATCH validated profile/status, optionally with NOK in the same transaction; cannot silently transfer |
| `/api/admin/clients/[id]/contacts` | PUT validated NOK set plus explicit confirmed removed IDs |
| `/api/admin/clients/[id]/transfer` | POST new house, confirmation and expected revision |

There is no arbitrary-model CRUD, bulk snapshot-write or password endpoint. Mutations require the configured same Origin and URL origin, reject cross-site fetches, accept JSON only and bound the actual streamed body to 32 KiB. Authentication and role/tenant checks remain mandatory in the service, independently of HTTP/UI protections. Responses contain only record ID and committed updatedAt; no raw Prisma employee or credentials.

Safe statuses: 400 input, 401 session, 403 permission/origin, 404 unavailable target, 409 stale/relationship/uniqueness conflict, 503 unexpected database/configuration failure. Response caching is private/no-store. Field errors are mapped to the existing form labels; internal exceptions are not returned.

## Transactions, conflicts and relationships

`src/server/admin/transaction.ts` serialises these essential management commands using an organisation row lock, locks/rechecks the actor, and runs the whole command and audit in one Prisma transaction. This is a deliberately small MVP concurrency boundary. Future scheduling or other mutations affecting these invariants must participate in the same locking/conflict protocol or replace it with an equally tested policy.

Existing mutable-record `updatedAt` is the optimistic revision token. Every edit, status, assignment, NOK and transfer command requires the expected value. Service timestamps advance monotonically by at least one millisecond, including multiple writes in one clock millisecond. A stale command changes neither domain records nor audit. Do not treat an externally edited timestamp as a replacement for this protocol.

Assignment removal checks noncancelled shifts ending after server now, including ongoing shifts. Conflicts reject the entire command. No shift is cancelled or attendance/history deleted. Assignments are activated/deactivated, retaining their stable compound identity.

House deactivation rejects active clients, active assignments or ongoing/future scheduled shifts. The operator must resolve dependencies explicitly; no implicit cascades occur. Client and employee deactivation retain relationships/history. Employee access can be revoked without silently cancelling that employee's scheduled work; the UI directs management to review retained shifts.

Clients require exactly one current house in the organisation. New/active clients require an active house. Existing-client edit rejects a changed house; the transfer command requires review/confirmation and an active destination. Only the Client houseId/current revision changes. Client ID, contact IDs, Diary house/author references, Care records and template/version assignments are not rewritten.

NOK validation requires name/relationship, bounded contact details and boolean flags. Zero primary contacts and multiple emergency contacts are permitted, matching the existing model. The partial unique index enforces at most one primary even outside the application. Switching primary clears old flags inside the same transaction before updating the new selection. Existing contact IDs must belong to the authorised client. New IDs are generated server-side. Every removed contact ID must be explicitly confirmed; the existing UI warns especially for primary/emergency removals. Contact removal is a controlled physical removal of that contact row; the append-only audit retains minimal removal identifiers, not its personal content.

## Revocation and credential activation

A database trigger increments User.sessionVersion on password, status **or role** changes. The update and resulting revocation occur inside the management transaction. Old cookies remain invalid after reactivation or a later role reversal; fresh authentication is required. Current assignment and current client-house scope are checked on the next protected operation, so those access changes do not depend on a stale client cache.

Self-deactivation and self-role changes are blocked. The last active Administrator is retained; organisation serialisation prevents concurrent management operations removing all active administrators. Managers cannot grant themselves Administrator or edit an existing Administrator. A separately reviewed operator process is required for exceptional self/last-admin recovery.

New employees are Invited with no passwordHash. Creating or assigning an employee does not create working login credentials. Activation requires separately provisioned secure credentials, using the Phase 2A Argon2id/operator model. No plaintext password, invitation, reset email or activation token is generated or returned by this phase. Existing account deactivation/reactivation is supported; initial secure provisioning remains a documented limitation.

## Audit schema and limits

`AuditEvent` records server-generated UUID, actor ID, organisation ID, closed action/target vocabulary, target UUID, a JSON object of minimal changes and a database UTC timestamp. Actor membership is enforced by a composite tenant foreign key. Indexes support organisation/time and target lookup. Database triggers reject UPDATE/DELETE.

Summaries contain changed field names, role/status transitions, relationship IDs, counts and provisional-coordinate status. They omit names, emails, phone numbers, DOB/summary content, exact coordinates, passwords/hashes/tokens and database secrets. Multiple related events may represent one transaction (for example employee update plus assignment/role/status changes). Failed transactions leave no success event.

Only the narrow server services append these events; no Staff audit-write or audit-edit API exists. The full Reports & Audit route remains deferred. This is not a complete compliance, security-log, retention or tamper-proof storage solution. Privileged maintenance/direct SQL is outside this management audit boundary; production least-privilege roles, retention/access, monitored backup/export and operator procedures still need review.

## Verification

Final verification passes: lint/types/format/schema; **393 units**, **36 PostgreSQL security/service tests**, **25 local and 25 actual Neon authenticated browser passes** (each with two intentional narrow Admin UI skips), **16 existing Admin core preview tests**, production build, production isolation and bundle/secret checks. Full Chromium coverage is **619 passes / 126 intentional skips**, combined across an interrupted run and the exact 143 failed/unfinished cases, all of which passed on resume without code changes. All 429 source/test/tooling hashes and original reference/CSS remained fixed. Production refuses all 141 historical preview routes and sixteen disabled-backend API probes; nine configured secret values/ten restricted fixtures are absent from 109 client chunks. Details and the interruption accounting are recorded in [implementation status](implementation-status.md). Development used targeted disposable PostgreSQL/security tests and focused form/browser journeys before broad verification. Existing role-change tests now assert the stronger revocation requirement and fresh login, retaining role/assignment/deactivation checks. Historical preview/unit assertions were not weakened.

The authenticated CRUD journey creates and edits an Invited employee, configures a provisional house, creates a client/NOK, assigns a second Staff employee, verifies house/contact changes on Staff mobile, transfers the client, removes access and deactivates an existing account/session. It verifies failed saves do not persist and successful writes have audit events. Additional HTTP tests exercise all ten mutation endpoints against Staff/forged roles, cross-site requests and Manager escalation. Neon verification uses only fictional development records; seed access is restored and owned test houses/clients are archived through authorised APIs, retaining audit/history.

## Next boundary

No real scheduling mutation, GPS request, clock-in/out, attendance write, Diary/Care submission, form publishing, Leave approval, file upload, notification/concern delivery/review, corrections, full reporting or deployment. No Phase 2D starts automatically. Recommend a separately authorised scheduling read/write slice with explicit eligibility/dependency policies before GPS attendance; location accuracy/distance/time/clock-out policies still require organisational decisions.
