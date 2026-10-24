# Staff UI completion review — Phase 1D.4

This review covers the approved main Staff interface as a fictional development preview. UI completion does not mean backend connection, production authorisation, operational approval or permission to process real client/health information.

## Checkpoint and source

Phase 1D.3 is already committed and published at `cba43ca` on `phase-1d3`, superseding the brief's uncommitted note. Before this phase, lint, strict types, formatting, 120 unit tests, all 60 Notifications browser cases, build and 68 production-isolation checks passed again. Its previous full 435-case run remains documented. New work is isolated on `phase-1d4`. Previous branches, the original archive/extraction, CSS and existing visual evidence are preserved; unrelated duplicate screenshots remain untouched. No reset, discard or remote push is part of this assignment.

Inspected the active Profile and Settings exports in `staff/pages/Other.tsx`, Staff/store fields, source profile/form/card/navigation CSS, current employee, Dashboard/shell, shared photo picker, adapter and module contracts. Unused legacy MyProfileView is not substituted. The original Profile has read-only employment information and an inline phone/address/emergency-contact form; Settings is Coming Soon. Preferred name exists in the source Staff model but has no source Profile edit control.

## A. Staff route inventory

All primary Staff destinations now have their intended source-derived UI. Statuses are independent: ported, UI-matched with documented extensions, tested after final verification; none is backend-connected.

| Route | UI and boundary |
| --- | --- |
| `/login` | Safe source login/recovery presentation; fictional sign-in marker only, production inert. |
| `/shift-check` | Clock-in / My Shifts, three upcoming entries/current-next highlight, shift details, Dashboard continuation; real attendance disabled. |
| `/dashboard` | Shared current employee, house/client/schedule/coworker/notice summaries and Leave shortcut. |
| `/houses` | All current assigned houses. |
| `/houses/[id]?tab=overview|diary|files|concerns` | Assigned House profile, clients, own/contextual concerns, official notices, House Diary and documents. |
| `/clients/[id]?tab=overview|diary|care|charting|files` | Authorised Client profile, Contacts/NOK, notices/own concerns and documentation/gallery tabs. |
| `/clients/[id]/diary/new?draft=…` | Own Client Diary create/draft/submit. |
| `/houses/[id]/diary/new?draft=…` | Separate own House Diary create/draft/submit. |
| `/clients/[id]/records/new?templateId=…&draft=…` | Shared configurable Care Plan/Charting entry and own drafts. |
| Client/House `item`, `sub`, correction queries | Read-only submitted details and separate correction requests, preserving parent/template/version/author context. |
| `/search?q=…` | Scoped house/client search; no sensitive identifiers/contact text in general search. |
| `/roster?tab=roster|team|timesheets` | Shared shifts/calendar, operational Team Schedule and own attendance/corrections. |
| `/leave?action=new` / `?requestId=…` | Own requests, supplied fictional balances, Pending Review creation and read-only decisions. |
| `/notifications?tab=all|client|house|staff|concerns` | Scoped official notices, own reads and concerns; existing detail/context/action queries preserved. |
| `/profile` | Current employee, read-only employment/account information, contact details and shared assigned-house links. |
| `/profile?action=edit` | Inline allowlisted contact editing with validation/discard/session feedback. |
| `/profile?action=photo` | Existing temporary photo picker; provider-owned staff display URL. |
| `/settings` | Intended Coming Soon screen with Dashboard return. |

Profile accepts only its optional `action=edit|photo`; unknown/repeated selectors, other employee query parameters and `/profile/[otherId]` return 404. Staff cannot select a different employee. Existing unknown/unassigned Client/House URLs return 404; unavailable session records use each module's existing generic state. All preview pages and layouts still refuse production even with the opt-in flag enabled. See [route map](route-map.md) for complete query contracts.

## B. Completed modules and shared records

| Phase | Completed UI |
| --- | --- |
| 1A | Source login, Clock-in/My Shifts, Dashboard, shell/navigation and map presentation. |
| 1B | Houses, Client profiles, Contacts/NOK and scoped Search. |
| 1C.1 | Client/House Diary, drafts, submission, history/details and corrections. |
| 1C.2 | Assigned Care Plan categories, versioned configurable assessment forms and record lifecycle. |
| 1C.3 | Charting, repeating editable tables, charts/history and targeted corrections using that same renderer. |
| 1C.4 | Client/House gallery metadata, harmless demonstration downloads, temporary selection and profile-photo picker. |
| 1D.1 | Roster, Team Schedule, Timesheets, own attendance and correction UI. |
| 1D.2 | Leave balances/history, own requests and read-only fictional decisions. |
| 1D.3 | Official notices, employee reads, own concerns and contextual integration. |
| 1D.4 | Own Profile, permitted contact edits, shared temporary staff photo, Coming Soon Settings and final navigation/journey review. |

One StaffSnapshot/provider retains existing stable employee/house/client/shift IDs and all domain arrays. Profile assignments call the same `myHouses` selector used elsewhere. Care Plan and Charting still share templates/versioned records and the renderer. Profile updates change only the current Employee's allowlisted contact fields; historical author IDs, records, corrections, shifts, attendance, leave, notices/read states and attachments remain unchanged by reference. No duplicate employee store, per-page authoritative assignment list or broad adapter rewrite was introduced.

### Profile field and privacy contract

The exact prototype allowlist is `phone`, `address`, `emergency`, matching the source form. Phone requires 7–15 digits, supported punctuation and at most 32 characters; address/emergency remain optional with provisional UI limits of 240/160 characters. These checks do not verify phone ownership or establish organisational policy. Inputs are trimmed; malformed payloads, non-string values and any additional key reject the mutation. Own ID comes from the demo snapshot, not a form target parameter.

Full/preferred name, employee ID, role, work email, account status, start date, organisation/management permissions, house/roster assignments and another employee are not editable. Preferred name is displayed where supplied; no new preferred-name editor was invented. Photo selection is a separate temporary presentation action, not an accepted contact-patch URL or employee-account update.

Employee extends only fields already supported by the exported Staff model: phone, address, emergency, preferred, started and status. Existing employees are reused. Fictional s1 contact values use demonstration numbers/address; s2 has private contact fixtures to exercise filtering. Serialisation now explicitly projects coworkers to the existing operational identity fields and strips private phone/address/emergency/preferred/start/status metadata. The current employee receives their own profile fields. These mock policies are not trusted server permissions.

### Photo lifetime

ProfilePhotoPicker, the shared selection policy and useTemporaryProfilePhoto are reused. StaffDataProvider owns the applied staff URL, updating the same Employee.photo display value so Dashboard, sidebar, mobile menu and Profile agree throughout client navigation. No File or Blob enters StaffSnapshot or attachment metadata. Picker and applied URLs have separate owners; cancellation, replacement and unmount revoke their respective resources. Reload/sign-out/provider remount resets the staff photo. Client/House photos retain the original mounted-profile lifetime. The picker explicitly describes the appropriate lifetime; no localStorage, real upload, public storage URL or permanent save is added.

## C. Known mock limitations and remaining placeholders

| Route/area | Current state | Why / later phase |
| --- | --- | --- |
| `/login`, recovery panel; planned `/forgot-password`, `/reset-password`, `/verify` | Fictional sign-in only; reset/email/OTP services unavailable and standalone recovery routes unimplemented. | Trusted Auth.js/invite/recovery/2FA requirements and backend work. No fake email delivery or production passwords. |
| `/shift-check` | Real Clock In/Out disabled; unavailable/denied/checking visual previews and Retry/Contact Management; demo attendance changes appearance/off-shift form context only. | Approved GPS/eligibility/clock-out policy, trusted identity and persistent attendance services. No successful verified GPS simulation. |
| Diary/Care/Chart forms | In-memory drafts/submissions/corrections, session feedback; submitted values read-only. | Prisma/Neon persistence, immutable reviewed versions, concurrency and audit. |
| Configured legacy `table`, photo/file form fields/cells | Explicit unavailable controls where unsupported; typed repeatingTable controls are implemented. | Confirm remaining template field/storage requirements. No fake upload or hidden success. |
| Client profile Edit profile | Disabled, management-owned. | Desktop Admin CMS and future authorised account/client writes. |
| Galleries and profile photos | Provisional metadata validation, labelled gallery upload simulation, temporary image URLs, safe public examples only; unavailable PDF/unsupported previews/downloads stay labelled. | Private Blob metadata/content authorisation, approved policy/scanning/retention. Existing files cannot be removed by staff. |
| Record correction / Timesheets | Pending Review records and historical approved/rejected fixtures; no staff approval/application of changes. | Authorised management review, preserved originals, durable versions/audit. Entirely missing attendance remains a policy/workflow decision. |
| Leave | Fictional supplied balances, Pending Review requests, historical decisions; pending withdrawal deferred and approved cancellation absent. | Approved overlap/withdrawal/entitlement/partial-day rules and real management/payroll integration. |
| Notifications / concerns | Employee-specific in-memory reads; own session submissions and fictional responses; no publication/review operations. | Management CMS, trusted audiences, persistence, delivery and audit. No push/email/SMS/emergency escalation. |
| `/profile` | Session-only contact changes and temporary photo; account status explicitly a fictional fixture, security services unavailable. | Auth.js identity, server self-service allowlist, approved privacy policy and real employee writes. |
| `/settings` | Intentional Coming Soon with Dashboard return. | Secondary requirements/backend phase, not an unfinished navigation migration. |
| All Staff domain writes | No database, durable audit or real management delivery. | Backend integration, organisation/privacy/security/operations acceptance. |
| `/admin/*` | Phase 1E.1 adds separate desktop core management; operational modules remain placeholders and no Staff Admin navigation is added. | Development-only shared state; the width gate is UX, not authorisation. See Admin contracts. |

Unused original legacy views and local reference source remain preserved. Dormant placeholder helpers are not used as replacements for completed primary Staff screens. There is no new fabricated success or unrelated feature implemented to eliminate these deliberate boundaries.

## D. Visual consistency and UI states

Reused source Profile header/avatar/employer/contact cards, inline form, `cm-profile-head`, `cm-two-col`, `cm-panel`, `cm-dl`, fields, buttons and badges. Settings reuses the exact source heading/Empty presentation. Existing ProfilePhotoPicker, Modal, Avatar, Status, PageHeader and unsaved-change guard remain shared. Typography/palette/CSS/assets are preserved; scoped bootstrap additions handle the employee h2, long text, mobile Edit row and active drawer item.

Intentional differences: existing preview strip, breadcrumbs, preferred-name display, fictional account status/security copy, a header Edit shortcut, explicit assigned-house links/cards, field errors/help and session-only feedback. The original has only the assignment summary, no separate house-card section or photo-selection modal. Source photo selection applies immediately; the migrated picker adds validation/preview/cancel. Profile uses one page-level h1 with a visually matching employee h2. Settings gains a Dashboard return. These additions increase height, especially on mobile; scroll/focus behaviour keeps the inline form reachable.

Shared states remain recognisable: route loading/error/not-found, scoped unavailable record, Empty/search no matches, labelled field errors, session creation success, genuine local mutation failures, Pending Review, submitted read-only details, unsaved-change prompts and explicitly unavailable actions. No extra fake server latency or service-failure toggle was invented. Representative final Dashboard/navigation captures complement Profile/Settings comparisons; prior phase evidence is retained rather than regenerated wholesale. No exact pixel parity or independent design approval is claimed.

## E. Navigation and Staff journeys

Reviewed all nine sidebar destinations, the four mobile bottom destinations plus five menu destinations, header bell/clock/brand, Dashboard cards/shortcuts, profile/house/client links, module tabs, breadcrumbs and Back paths. Assigned houses, client-house links, author IDs and shift-house references use the same records. Existing Client/House context routes remain canonical; no duplicate profile or settings hierarchy was added.

Resolved: Profile and Settings placeholders; missing Staff photo props in sidebar/menu; missing active-page semantics on mobile menu entries; and the optional Next development indicator intercepting the mobile Home button. `devIndicators:false` follows the installed Next guide and leaves compile/runtime errors enabled. The mobile header Edit action now occupies a separate row instead of squeezing the name. No existing module navigation or attendance restriction was replaced.

The added continuous journey covers fictional Login → three My Shifts → Dashboard without clock-in → assigned house → Client/Contacts → Diary create/submit/history with the current author → Care Plan form → Charting form → Gallery → House Diary/Documents → Roster shift → own Timesheets attendance → Leave submission → notice/read state → Client-preselected concern → own Profile edit → Coming Soon Settings. Earlier suites retain full care/chart submission/correction, record-integrity, scope and production/Admin-gate checks. Photo selection/cancel/replace/shared display/cleanup and all primary menus are separately exercised.

## F. Production integration readiness

| Existing boundary | Required future implementation |
| --- | --- |
| Preview gate / mock sign-in | Auth.js trusted sessions, invite/recovery/2FA design, production session/security controls. |
| Scoped pure selectors and transitions | Trusted server organisation/role/house/employee/parent checks on every loader/read/write; negative cross-organisation tests. |
| StaffSnapshot / feature adapters | Server repositories and Prisma/Neon relationships/constraints, stable identity, transactions, pagination and concurrency; retain shared domain IDs. |
| Profile allowlist | Server-owned self identity, approved editable fields/validation, private coworker projection, management-only role/status/assignment writes and audit. |
| Template/record/correction lifecycle | Immutable publication/record versions, management review, durable originals/proposals/decisions and audit. |
| Files/photos | Private Blob object references, authenticated upload/retrieval/removal, approved MIME/size/scanning/retention and image processing. Never put private files in public assets. |
| Notices/concerns/leave/attendance | Real authorised services, policies, management decisions, delivery semantics and reliable error recovery. |
| Session feedback/error UI | Confirm persisted results, handle network failures/retry/concurrency, recover safely and log without sensitive contents. |

## G. Verification and open issues

Verification under isolated Node 22.23.4/pnpm 10.15.1 passed lint (zero warnings), strict types, formatting, 150 unit tests, all 485 Chromium cases (435 retained + 50 new), production build and 74 production-isolation checks. System Node was unchanged. All five required viewport widths passed, including the continuous Staff journey and new Profile/Settings states. The comparison folder contains 90 raw images and 15 paired boards; source integrity checks confirm all 51 reference files and the three original CSS copies are unchanged. Private coworker profile markers are absent from production client chunks.

Firefox smoke is BLOCKED before application execution: bundled Firefox reports `Could not find profile folder`. Both its default temporary directory and canonical `/private/tmp` were attempted; neither launched the browser. No Firefox application verification is claimed. The optional smoke command/config remains available for a compatible host or CI. Full results and limits are recorded in [implementation status](implementation-status.md).

Outstanding production-readiness work: Safari/WebKit and physical iOS/Android testing, broader Firefox coverage, exhaustive accessibility/assistive-technology review, independent design approval, external font/photo/map availability/licence/privacy review, organisational contact/audience/GPS/leave/retention policies, CI/deployment/security/privacy acceptance and all backend services above. No actual physical-device or Safari test is claimed. No real client or health information was introduced.

Recommended next step: review the completed Staff UI and agree the first bounded desktop Admin CMS migration using these same records/contracts. Do not automatically begin Phase 1E, backend integration or deployment.

## Changed files

New `staff/profile/` modules: MyProfile, ProfileEditForm, AssignedHouses, Settings, adapter and types. Existing Employee/snapshot builder/context, shared photo picker, Staff shell/sidebar, Profile/Settings routes, scoped bootstrap CSS and Next dev-indicator configuration are extended. New profile unit and integration/browser tests; optional Firefox configuration/script and generated-output exclusion. Reference/production scripts, README, route/status/migration/file contracts, historical 1D.3 status and comparison evidence are updated. No original CSS/reference asset, existing domain record ID or Admin implementation changes.

## Phase 1E.1 shared-boundary update

The completed Staff screen layouts remain preserved. The existing snapshot provider now lives above Staff/Admin during development so core management edits propagate within the same session. Initial Staff payloads remain scoped; visiting the explicitly opted-in Admin tree adds the broader fictional dataset to that one browser state, which is not a confidentiality boundary. Staff reads still use the scoped projection. Management assignment/status/transfer changes alter current house/client visibility without deleting historical records. Session-aware route checks replace fixed s1 seed reads where those would reject newly assigned or created entities; production refusal and initial invalid-ID scope checks remain. Photo resource ownership is shared by entity across Admin/Staff, using the existing picker/policy and URL lifecycle helper. See [Admin contracts](admin-core-data-management.md) for exact limitations. Staff profile self-service allowlist and real attendance restrictions remain unchanged.

## Phase 1E.2 workforce integration

The desktop Admin now manages the same fictional shifts, attendance corrections and leave requests. Staff layouts/ordinary permissions remain mobile-first and unchanged. Current-session shift edits propagate to My Roster/My Shifts; cancellation excludes eligibility while retaining history. Own Timesheets resolves approved effective attendance while showing original events and review metadata; manual corrections are explicitly not GPS verification. Leave decisions return to own Staff details/history, with no shift or balance mutation and no approved cancellation. The pure operations still enforce development role/relationship checks, not trusted server security. Original event history, own-record projection and production refusal remain. See [workforce contracts](admin-workforce-management.md); earlier “management review deferred” notes describe their historical phase.

## Phase 1E.3 documentation integration

Admin-created Care Plan/Charting forms and Client/House diary categories now flow through the same session snapshot and Staff renderer. Active assignments choose new-entry versions; published records and old drafts retain their exact version definitions. Staff projections omit management drafts while merges preserve them. Deactivation removes new-entry choices and blocks submissions without deleting historical records; current house/client scope still applies. No Staff template-management grant, real file handling, production identity or persistence was introduced. See [documentation-builder contracts](admin-documentation-builder.md).

## Phase 1E.4A correction outcomes

Desktop management now approves/rejects the same Staff documentation requests. Staff layouts and ordinary privileges remain unchanged; there is no Staff approval action. Diary/Care/Chart details and history derive approved effective content with a Corrected indicator and original/revision history, reviewer/time/visible notes and rejected outcomes. Structured requests optionally use original-version typed controls and stable table references. Originals remain raw in the snapshot/projection; current scope still applies. See [record-review contracts](admin-record-review.md). These are session-only demonstrations, not persisted clinical records or trusted review decisions.
