# Admin core data management — Phase 1E.1

This is a fictional development preview, not a production management service. No Auth.js sessions, Prisma/Neon database, invitations, GPS verification, private uploads, approvals, delivery, durable audit or deployment is connected.

## Checkpoint and source

Completed Staff Phase 1D.4 was checked under isolated Node 22.23.4/pnpm 10.15.1: lint, strict types, formatting, 150 units, all 50 Profile/integration browser cases, build and 74 production-isolation checks. Its prior complete 485-case result remains documented. Local checkpoint **b1a0344** preserves that work on `phase-1d4`; this phase uses `phase-1e1`. No remote push, reset, discarded reference or duplicate screenshot removal.

Inspected `admin/AdminApp.tsx`, `core.tsx`, `pages/Dashboard.tsx`, `pages/People.tsx`, `pages/Places.tsx`, source location presentation, shared store/UI and prior Staff contracts. The unreachable legacy administration views are not substitutes. Original reference files and original global/Staff/Admin CSS are retained. Source-derived components reuse the `ad-` sidebar/topbar, PageHead, Panel, Stat, SubTabs, KV, DataTable, Filters, Pill, picker, card, contact editor and form classes. Existing Avatar, Btn, Icon, Modal, FormField, SearchInput, Select, Pagination, image policy/photo picker and SSR-safe house map remain shared. Scoped additions are in `styles/admin-migration.css`.

## Layout and navigation

Canonical routes remain `/admin/dashboard`, `/admin/employees`, `/admin/houses`, `/admin/clients`, their `/new`, `/[id]`, `/[id]/edit` paths and entity `?tab=` detail states. `/admin` redirects to its Dashboard. Sidebar section matching covers details/forms; collapse, header core-entity search, review link, account disclosure, breadcrumbs, Back and direct refresh are supported. URL encoding and stable entity IDs replace the source's navigation stack.

The source CSS shows the desktop-only notice below 1024px. It is verified at 375/390/768px; main layouts target 1280/1440/1600px. The width gate is UX, not security. Staff navigation has no Admin menu entry. Existing Login's explicit development Administration button opens the preview. Fresh Admin direct entry starts restricted until the explicit development opt-in. Reload resets the role/records; seeded deep links can be reopened after opt-in.

Operational sidebar destinations retain separate labelled placeholders: Rosters & Attendance, Leave Management, Care Documentation, Files & Galleries, Notifications & Concerns, Reports & Audit and Settings. They do not redirect to unrelated screens or provide approval/publication/deletion editors.

## Role demonstrations

Administrator and Manager can manage core employees, houses, clients, contacts and valid assignments. Administrator can grant Administrator and edit/deactivate Administrator employee records. Manager cannot grant that role, edit an Administrator account, deactivate one or change its assignments. Staff and Senior Staff receive restricted Admin content and cannot call any management mutation successfully. Senior job titles do not automatically grant Admin access.

The header disclosure labels its role selector **Development preview only** and **no trusted session**. Staff preview links select an existing fictional employee, not a real authenticated user. The selected management demonstration role is retained for returning to Admin through browser history. These browser values are intentionally editable demonstration state. Hiding a control is not authorisation; every pure mutation rechecks the role and relevant target. All Admin server pages/layouts still refuse production even if the preview flag is set. Invalid seeded IDs/unknown tabs have generic not-found handling; a syntactically valid session UUID lost on reload has a generic unavailable state after opt-in.

The single fictional organisation is identified in the shared snapshot; there is no real organisation membership or tenant-isolation service. Before production, derive identity/role/organisation/house scope from a trusted server session for every read/write. Cross-organisation negative tests and database constraints remain required.

## One domain and propagation

`StaffSnapshot` remains the domain shape. The existing seed builder exposes an explicit full-domain option for the Admin layout; its normal Staff read remains scoped. No Admin database, second authoritative fixture, browser storage database or mock API was added. The existing provider now sits at the common root during opted-in development, preserving one in-memory state across Staff/Admin client navigation. Login/sign-out and reload restore fixtures; no durable persistence is implied.

Initial Staff requests receive the existing scoped projection. Broader fictional data is supplied only through the gated Admin route tree, then merged once into that same session. Existing Staff edits survive the merge. Two management employees use original actor IDs `a1`/`m1`; existing Staff, house, client and shift IDs are retained. Earlier descriptive notification publisher/reviewer IDs remain descriptive metadata; no trusted identity migration is claimed.

`projectStaffSnapshot` extracts and reuses the prior filtering logic. It removes private coworker contact/account fields and restricted NHI from Staff projections. It scopes houses, clients, notices, records, own leave/attendance/corrections and file parents using the current employee/assignments. Inactive employees/houses/clients lose current Staff visibility without losing domain history. A scoped Staff mutation merges by stable IDs/composite relationships into the broader state, preserving excluded records. Care-template assignments use `(clientId,templateId)`; house assignments use `(employeeId,houseId)`; read state uses `(notificationId,employeeId)`; leave balances use `(employeeId,typeId)`. Unchanged updates return the current state, avoiding notification effects looping.

After visiting Admin, the browser holds the broader fictional dataset. Staff projections and role switching are **not** a confidentiality boundary, and switching roles does not securely erase that data. This preview must never hold real personnel/client/health information. Future server repositories must return only authorised records to each authenticated client.

### Session-aware route scope

Server pages retain the production gate and malformed query validation. Staff client/house layouts and care/roster/notification scope boundaries use the same current projected snapshot, including during initial SSR. This permits session-created clients, new assignments and transfers to navigate consistently instead of being rejected against an old fixed fixture. Initial unrelated/invalid URLs still produce not-found; in-session boundaries recheck current scope. These are development checks, not authenticated server policy. The older `record-loader.ts` reference is retained but its fixed-fixture reads are no longer used by these routes.

## Employee management

Directory: avatar, employee/name/email/ID, role, houses, status, actions; name/email/ID search, role/house/status filtering and shared table pagination. Private address/emergency contacts do not appear in rows. Empty/no-match/filter/unavailable states use source components.

Create/edit: first/last/preferred name, employee ID, email, phone/address/emergency, start date, role, status and house assignments. IDs/emails are unique after trimming/case-folding; names, contact/date formats, field lengths, role/status and foreign IDs are validated. Unsupported payload keys and malformed types reject the mutation. Unassigned employees are permitted, matching the export; they see no houses/clients until assigned. New domain IDs are UUIDs. There are no passwords or invitation sends; Invited is a fictional account state only.

Details implement Overview, House Assignments and Account & Permissions. Roster/Attendance/Leave tabs show bounded shared-record counts and future-module links. Edit, role changes and reversible deactivation/reactivation use the same adapter. Deactivation changes the fictional status only; it does not invalidate credentials/sessions. History, assignments, shifts and author IDs remain intact. Permanent account deletion/reset/invitation workflows are unavailable.

Employee photo selection reuses the earlier picker and policy. Pending form URLs are owned/revoked by the existing hook; applied URLs are owned by the shared provider until replacement/logout/unmount. Cancel does not save the selected file. No File/Blob contents enter the snapshot, localStorage or an attachment store. The same Employee.photo is displayed in Staff Profile/Dashboard/sidebar/menu.

## Assignment dependency policy

One employee can have multiple houses; each assignment has existing employee and house IDs. A searchable source-style selector is reused from Employee Details and House Employees. Additions/removals validate targets and role restrictions. Before removal, the adapter checks non-cancelled shifts whose end is after the snapshot's current time, including an ongoing shift. Conflicting removal is blocked with: “This employee has scheduled shifts at this house. Review the roster before removing the assignment.” The form and adapter apply the same rule, including assignment changes through Employee Edit.

Non-conflicting removal withdraws current Staff house/client visibility. No automatic cancellation, reassignment, shift deletion, attendance rewrite or documentation-author change occurs. Inactive house visibility is separately filtered. House manager remains the export's descriptive display string; a trusted manager-ID relation is a future persistence migration.

## House management

Directory retains Cards/List presentation, search/status filtering, entity links, client/employee counts derived from shared relationships and pagination. Details implement Overview, Employees, Clients and Location. Employees can be assigned through the shared selector; clients can be created for the selected house or transferred explicitly from another house. Diary/Files/Notifications tabs show read-only counts and future module links.

Create/edit includes name, unique code, address, suburb/city, phone/email, description, manager display, status, photo and location fields. Coordinates must be a finite valid latitude/longitude pair or both blank. Checks use basic global coordinate ranges; they do not establish an organisation-approved geographic boundary. Blank remains locationSet=false; no arbitrary verified location is invented. Positive optional radius is explicitly provisional, with no default organisation-approved value. The source map presentation reuses the existing SSR-safe house-only map. There is no device-position request, geocoder, geofencing, verified address, real attendance or clock-out policy choice. GPS-related source success claims are replaced by unavailable/configuration text.

Assigned Staff views use the same edited house name/address/contact/photo in Dashboard, Houses, Profile and Search during navigation. Inactive houses are hidden from current Staff scope; records remain in the shared management dataset.

## Clients, Contacts/NOK and transfers

Directory shows avatar/name/preferred name, reference, house, status and last submitted documentation activity. Search/house/status filters and pagination use the source table. NHI, DOB and contact details are absent from general rows and header search results.

Create/edit implements first/last/preferred name, optional DOB, unique reference, optional restricted prototype NHI field, summary/alerts, status, temporary photo and contacts. Exactly one existing active house is required. DOB is a valid date no later than the NZ snapshot date. Optional NHI uses only the original export's demonstration regex; it is not identifier validation/verification or a clinical standard. No sensitive identifier is required.

Contacts use the same ClientContact objects/IDs as Staff. Name and relationship are required; optional phone/email/address/notes are validated/bounded. Existing missing phone details remain representable. **At most one primary contact** is permitted; selecting one clears other primary flags. Zero primary and multiple emergency contacts are allowed. Removal requires confirmation, with extra primary/emergency warning, and takes effect only when the form is saved. Adding/editing/removing contacts is immediately reflected in the same client's Staff Contacts/NOK view during the development session.

Existing-client Edit does not silently change house. The separate House Assignment tab or House “Add existing client” dialog shows current/new houses, warns about audience changes and requires Review then Confirm Transfer. Exactly one current house changes on the same client object; diary/care records, template versions/assignments, attachments, shift/attendance data and author IDs are untouched. Staff assigned only to the old house lose current access; new-house staff gain access; staff in both retain it. The preview follows the client's current house for historical client-document visibility; final historical access/retention policy needs organisational approval.

Client Details fully implements Overview, Contacts/NOK and House Assignment. Diary, Care Plan, Charting, files and notices show read-only counts/assigned template summaries from the same collections. Activity explains that durable audit is unavailable. No second care store, builder, review or file deletion operation exists.

## Feedback, accessibility and visual findings

Forms retain source panels/grids/fields/buttons. Required labels, explicit error summaries/field errors, no-match/empty/unavailable states, honest session confirmation/failure feedback, status text, source-styled confirmation dialogs and shared unsaved navigation/Back/Cancel warnings cover the management workflows. Existing Modal supplies Escape, focus containment and restoration. Table rows support Enter; action buttons do not trigger row navigation. Tabs/buttons/links use semantic roles; tables have labelled scroll regions.

Source links replace stack buttons while retaining source nav sizing/active marker. Long table values wrap appropriately; operational table columns scroll within their panel instead of squeezing names/times. The desktop notice uses the same typography with an h2 to prevent a hidden h1 becoming the desktop route announcement. Source CSS remains unchanged. Significant additions are honest preview copy, fields explicitly required by this brief, validation, restricted states, stable contacts, confirmed transfer/dependency policy and bounded future tabs. Exact pixel parity, independent design approval, exhaustive accessibility and real-device compatibility are not claimed.

The test renderer adapts the same fictional full snapshot for the untouched original Admin source, alongside its existing Staff renderer. Original source invitation/GPS/delete/review controls remain visible only as reference evidence; they are not reactivated in Next. Captures use frozen time, NZ timezone, source remote fonts and deterministic external image/map stubs. No font binaries are copied. Final screenshot inventory and command results are recorded in implementation status and the final results below.

## Verification and future work

New pure tests cover validation, duplicate/unknown targets, roles, assignment dependencies, employee status, contacts, exact-one-house/client transfer, history preservation, shared counts, projections and scoped merge. Browser tests cover core management flows and Admin–Staff scenarios A–F, navigation/refresh, role previews, unsaved forms, keyboard/modal interactions, responsive gate and source comparisons. All existing Staff tests remain in the complete regression suite; no passing assertion is removed to accommodate Admin work.

Production still needs trusted Auth.js identity, server organisation/role/house policies on each operation, Prisma/Neon persistence/constraints/transactions, private Blob workflows, approved identifier/location/retention/assignment policies, concurrency/recovery, durable audit and organisational privacy/security/operational acceptance. Broader browser/physical-device/exhaustive accessibility/design acceptance remain outstanding. Firefox's previously documented pre-launch profile-folder error is not a passing browser result. No backend service, later operational Admin module or deployment begins automatically.

### Regression correction during final verification

Existing Notifications tests detected that re-projecting every shared update omitted newly submitted concerns' supporting-file metadata. The projection now calls the same `getParentAttachments` policy for both official notices and own concerns, retaining only explicitly associated authorised metadata. A new unit test covers projection/merge/other-author exclusion; all five existing browser cases pass after the correction. No selected file contents are retained, uploaded or made downloadable. The first complete run was stopped after the deterministic failure; it is not reported as a passing run. No old test was weakened.

## Changed file inventory

| Group | Files |
| --- | --- |
| Admin shared UI | `modules/admin/ui/{core,AdminAccess,AdminHeader,Dashboard,Form,FutureModule,PhotoSelection,SessionFeedback,StaffPreviewLink}.tsx` and `modules/admin/navigation.ts` |
| Admin domain | `modules/admin/data/{adapter,types,route-loader}.ts` |
| Employees | `EmployeeDirectory`, `EmployeeForm`, `EmployeeDetail`, `HousePicker`, `AssignHouses` under `modules/admin/employees/` |
| Houses | `HouseDirectory`, `HouseForm`, `HouseDetail`, `HouseLocation` under `modules/admin/houses/` |
| Clients | `ClientDirectory`, `ClientForm`, `ClientDetail`, `ContactsEditor`, `TransferClient` under `modules/admin/clients/` |
| Routes | Admin root redirect/error, existing dashboard/directories/future placeholders and new entity create/detail/edit pages; Staff house/client scope layouts and existing profile/diary/assessment/roster/notification route composition |
| Shared snapshot | `modules/staff/data/{context.tsx,types.ts,permissions.ts,projection.ts,development-mock-adapter.ts,selectors.ts}`; focused role checks in existing files/profile/notification adapters |
| Shared navigation/lifetimes | Root/Staff/Admin layouts, `components/layout/{AdminShell,StaffShell}.tsx`, `modules/auth/ui/LoginPreview.tsx`, existing `files/ProfilePhotoPicker.tsx`; `modules/preview/{context,merge,StaffScopeGuard,StaffCareScopeGuard,StaffRouteScopeGuard,AssessmentEntryRoute}` |
| Styles | New `styles/admin-migration.css` only; original CSS and Staff screen markup are retained |
| Tests/tooling | New `tests/unit/admin.test.ts`, `tests/e2e/admin-core.spec.ts`, `tests/e2e/admin-visual.spec.ts`, `playwright.admin.config.ts`; package scripts/output exclusion and reference/production verification scripts |
| Documentation | This contract, README, route map, implementation status, migration notes, Staff completion review, file architecture, archived Phase 1D.4 status and Phase 1E.1 comparison evidence |

All module/style/component paths above are relative to `src/` unless rooted under `tests/`, `docs/` or the repository tooling. No dependency/lockfile change, reference deletion, original CSS replacement or prior test edit is part of this phase.

## Final results

Node 22.23.4/pnpm 10.15.1 passes lint (zero warnings), strict types, formatting, all 203 units, the complete 525-pass/45-intentional-skip browser suite, and the final six-width Admin suite (57 passed/45 intentional narrow management skips). All 485 previous Staff cases remain in the full run. The final Admin suite repeats the workflows after source-fidelity corrections and strengthens capture waits so the correct route/form/image is present before each screenshot. Final build and all 92 production-isolation checks pass. Source integrity confirms 51 original reference files and three CSS copies unchanged, with private fixture markers absent from production client chunks. Evidence comprises 96 raw PNGs and 18 reviewed paired boards. No dependency/lockfile, prior test or source asset was changed. No phase 1E.1 commit or push was made.

Known prototype historical-access limit: current Staff selectors continue to require current house assignments for relevant documentation/scheduling contexts. Historical rows remain in the shared domain even when no longer visible to that staff member. A production policy for historical access independent of current assignments must be agreed and implemented on the server.

## Phase 1E.2 operational extension

Phase 1E.1 is preserved at checkpoint `9cf2104` on `phase-1e1`. New work on `phase-1e2` implements Roster/Attendance/Leave management over this same snapshot/provider, with no change to the core permission/relationship/photo contracts. Employee operational tabs now list their shared records and link into canonical workforce review routes. Dashboard attendance and pending workforce links resolve the same records. Only the two corresponding future modules are replaced; documentation, files, notices/concerns, reports and settings remain placeholders. See [workforce contracts](admin-workforce-management.md) for typed scheduling/review transitions, original/effective attendance and unchanged roster-on-leave-approval policy.

## Phase 1E.3 documentation extension

Completed workforce is checkpointed locally at `3f7b147`; `phase-1e3` adds documentation management on the same snapshot/provider. CareTemplate gains an optional draft/archive/configuration metadata and published version metadata; DiaryCategory gains description/metadata and submitted diary names are retained. Shared role/organisation checks protect every pure mutation. Staff projections omit drafts without deleting them during scoped merges, and historical care reads are separated from active new-entry assignments. Existing Employee/House/Client/Manager-account/workforce contracts remain. See [documentation-builder contracts](admin-documentation-builder.md); no production service or Phase 1E.4 approval was added.
