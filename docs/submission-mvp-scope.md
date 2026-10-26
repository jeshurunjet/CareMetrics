# Frozen submission MVP scope — Phase 1E.5

This preserves the approved submission boundary. Phases 2A–2H now connect real Auth.js sessions, authorised Staff core reads, essential Admin employee/house/client/NOK/assignment management and a minimal persistent mutation-audit ledger using fictional development data. Phase 2D connects shared PostgreSQL scheduling, Admin create/edit/cancel and own Staff My Shifts/Roster/Dashboard. Phase 2E adds event-only, server-validated clock-in with explicit development test policies; Phase 2F adds persistent clock-out under an explicit development-only no-location test policy, own attendance history and management read access. Phase 2G connects Client Diary submission/history and minimal management read access. Phase 2H connects assigned Care Plans, exact-version submissions/history and minimal management reads. Production attendance activation and other documentation submissions remain unavailable. See [Care Plan contracts](care-plan-backend.md). See [Diary contracts](client-diary-backend.md). See [clock-out contracts](clock-out-attendance-backend.md). See [GPS policy and privacy contract](gps-clock-in-backend.md). See [shift service contracts](shift-backend-integration.md). See [UI freeze and backend handover](ui-freeze-and-backend-handover.md) for contracts, replacement boundaries, policies and verification.

Phase 2I adds online-only manifest/icon readiness, trusted launch, consistent server-authenticated deferred pages and an HTTPS/Android handover. No deployment, APK or production attendance activation. See [readiness and final capability inventory](android-pwa-readiness.md).

Phase 2J implements approved fictional HTTPS staging at https://caremetrics-staging.vercel.app with separate Vercel/Neon projects and the [deployment/Android acceptance runbook](deployment-and-android-acceptance.md). Approved signed APK, encrypted USB restore and real Digital Asset Links checks now pass; core physical acceptance now passes for repaired APK1.0.1 on one REDMAGIC/Android16/Brave combination; remaining scenarios and distribution decisions are documented in the runbook. Production attendance remains disabled.

## Submission services to implement

| Staff | Essential Admin |
| --- | --- |
| Real Auth.js login and authenticated sessions | Account/employee administration needed for access |
| Responsive navigation, Dashboard, assigned Houses | Employee-to-house assignments |
| Authorised Client Profiles and NOK | House details and configured GPS coordinates |
| Actual assigned shifts / My Shifts | Client/NOK management |
| Mobile browser GPS clock-in, clock-out and recorded attendance | Shift creation/editing/assignment/cancellation and basic attendance viewing |
| Persistent Client Diary submission and newest-first history | Predefined seeded Care Plan templates and client assignments |
| Persistent Care Plan forms and exact-version history | Minimum configuration needed by those Staff workflows |

Keep Login → My Shifts → Dashboard, including continuing without clock-in. Clocking in must not become an application-access prerequisite. Server permissions apply independently to every read/write.

Diary and Care Plan drafts are a backend scope decision before implementation. Prefer preserving the existing draft experience with author-owned persistent drafts; if deferred, explicitly disable draft actions in submission mode rather than simulating a successful save. Submitted originals remain immutable. Off-shift rules must use real attendance and an approved policy.

## Preserve UI; defer backend functionality

Advanced Charting; real Client/House Galleries and private uploads; full Leave workflows; **attendance correction approval**; **full care-record correction management**; visual form-template builder publishing; official notification delivery; concern review; advanced Reports/Audit; House Diary persistence and other nonessential management. These interfaces remain in the repository and remain available as labelled development demonstrations. Profile editing/photo persistence and Settings/account-security features beyond essential authentication are also deferred unless separately approved.

Submission must show deferred actions as unavailable/Future Development, not as successful services. Basic attendance viewing does not enable correction approval. Seeded templates and essential assignments do not enable live builder publication. Immutable originals do not imply that the full correction workflow is in this MVP.

## Capability boundary

The handover defines a proposed central capability table using dotted module names. No runtime capability implementation or production feature locking was added in Phase 1E.5. Subsequent phases now enforce trusted core read/management capabilities on the server; unknown and deferred operations remain denied. The next backend phase must enforce availability and identity/organisation/role/house/parent access on the server, with the UI deriving availability from that authority. Unknown capabilities fail closed; hidden navigation and decorative locks cannot grant or enforce access. Development-preview tests keep their existing opt-in environment.

## GPS decisions before activation

Approve/version the permitted distance, accuracy, location freshness, clock-in eligibility window, receipt/measurement time handling and clock-out location requirements. No numeric policy is chosen here. Browser location is spoofable; collect event-only evidence with HTTPS, permission and a privacy notice, not continuous tracking. Denied/unavailable/inaccurate/stale/outside/configuration-missing requests must not produce a successful GPS event or an automatic bypass; provide retry/contact-management feedback.

## Services still absent

Secure initial credential/invite/recovery flows; approved production attendance policy/activation; private Vercel Blob storage/scanning/retention; full audit reporting/retention/compliance tooling; actual delivery; deployment/operations. Core sessions, Prisma/Neon persistence/constraints/transactions, management writes and minimal mutation audit now exist; see [current status](implementation-status.md). Preview passwords/roles, deferred mock saves, file handling and timestamps remain demonstrations. Reload/logout resets preview session mutations; backend-connected submissions persist. Public demonstration assets are not private storage.

Use fictional seed data throughout development. Before real information, organisational privacy/security reviewers must approve access, policy, retention, hosting/residency, backups/recovery, incident handling, external resources and operational readiness. Phase 1E.5 does not begin Phase 2 or deployment.
