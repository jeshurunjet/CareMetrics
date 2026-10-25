# Historical implementation status — Phase 2E

Event-only browser location now connects to trusted server geofence/eligibility checks, PostgreSQL clock-in, exact retry handling and minimal transactional audit. Production activation is **deliberately disabled** because organisational GPS/eligibility/evidence policies are unapproved. [GPS clock-in contracts](../gps-clock-in-backend.md) describe configuration, schema, privacy, tests, physical-device limits and Phase 2F prerequisites. [Phase 2D historical status](phase-2d-status.md) and the unchanged [scheduling handover](../shift-backend-integration.md) preserve the previous iteration.

## Git and preservation

Phase 2D was already committed and pushed at **470dcaa485803165e8f351e7d2a893082c79e351** on `phase-2d-complete`; the brief's uncommitted assumption was stale. Its existing complete checkpoint was verified and **phase-2e** created from it. The completed Phase 2E checkpoint is on **phase-2e-complete**, created from `phase-2e` at the user’s subsequent request to push this iteration before Phase 2F. Phase 2C remains **b005307792f2fac46e7d513ae8435edf4d79a601**; older branches remain intact. No reset, reference deletion or deployment. Only the completed Phase 2E Git checkpoint is authorised for pushing. Fifty pre-existing duplicate screenshots are untouched and excluded.

## Connected functionality

- Existing mobile Staff My Shifts/detail controls show a purpose explanation, then request one current position only on explicit user action. High accuracy, maximumAge zero and bounded capture timeout are requested; no watchPosition or Dashboard capture exists.
- A narrow same-origin/bounded-JSON POST checks the active Auth.js account/org/session version, own shift, current assignment, active house, noncancelled schedule, explicit policy, exact approved test house configuration, receipt-time eligibility, finite coordinates/accuracy, freshness/future skew and conservative boundary rule. Browser roles/employee/house/limits cannot override authority.
- Tenant-scoped server policies have no implicit values. Only explicitly acknowledged fictional development test policies are supported. NODE_ENV or VERCEL_ENV production always blocks activation, including with test settings supplied. Missing/invalid/unapproved configuration directs Staff to Contact Management.
- Clock-in persists server receipt time, supporting measurement time/accuracy, house/shift/employee association, labelled test verification, immutable policy snapshot and request identity. Raw staff latitude/longitude is not stored or returned.
- Shared management lock ordering, per-shift/request uniqueness and a single-open-attendance partial index prevent duplicates/conflicts. Exact request retry reads the committed event without another measurement/audit; altered requests conflict. Audit failure rolls back attendance. Verified evidence cannot be overwritten/deleted.
- Own clock-in state survives refresh and a fresh authenticated device/session. Unrelated Staff cannot retrieve it. Source cards/headers/modals/styles remain; continuing to Dashboard never requires clock-in. Authorised Admin sees basic attendance-history status and existing schedule edit/cancel protection.
- Failure states explain permission/unavailable/insecure/timeout/accuracy/freshness/boundary/configuration/ownership/duplicate/service problems. No manual Staff bypass, mock fallback, fake Clock Out or inferred payroll hours is supplied.

An explicit active-attendance projection keeps an open clock-in prominent on My Shifts/Dashboard after the scheduled end, without inventing a clock-out. A controlled-time database test verifies the original event/time remains and clockOut stays null.

## Neon and schema

Existing development **phase-2a / br-billowing-rice-a78isrig** was verified ready, with matching pooled/direct endpoint/database identity, verified client TLS, the exact three prior migrations and intact scheduling/audit before writes. Expiry remains **24 November 2026 at 11:18 NZDT**.

Migration **202610250004_gps_clock_in** was exercised in disposable PostgreSQL, then applied only to verified development. It extends AttendanceRecord with nullable GPS event metadata, same-tenant House FK, unique request/open-record constraints, complete-evidence checks and immutability/house-match triggers, and permits the minimal attendance audit action. Existing legacy records are not falsely backfilled. No reset/reseed or production modification.

GPS browser tests use a separate fictional organisation/house with explicit test-only configuration. Generated test accounts are deactivated; attendance/shift/audit history is retained. The original seed organisation stays unconfigured for GPS and its existing no-fake-attendance assertion remains zero, explicitly scoped to that organisation. Destructive rollback/concurrency tests require a disposable local database. Normal app environment is unchanged.

## Verification

Node 22.23.4, Prisma 7.10.1 and the existing dependency lockfile are retained. Required automated verification passed; physical-device acceptance and organisational approvals remain outstanding.

| Check | Current result |
| --- | --- |
| Lint / strict TypeScript / formatting | Passed; zero lint warnings |
| Prisma validation | Passed |
| Unit tests | 441 passed / 18 files (48 focused GPS cases) |
| Disposable PostgreSQL migration/repeat seed/security | 91 passed / 4 files (43 GPS service/security cases) |
| Focused GPS browser, 390px | 5 local and 5 actual Neon passes; location/permission signals mocked |
| Complete authenticated browser suite | 44 local / 44 actual Neon passes, each with 4 intentional narrow Admin skips; 375/390/1280px |
| Full original Chromium preview | 619 passed / 126 intentional narrow Admin skips in one uninterrupted 17.3-minute run; 375/390/768/1280/1440px |
| `npm run build` | Passed; compiled successfully in 4.6s |
| Production isolation | 141 preview routes refused; 11 read/auth and 14 mutation API probes failed closed |
| Production client bundles | Nine configured secrets and 10 restricted fixture markers absent from 115 chunks |
| Final focused Neon verification | 5 mobile GPS cases passed after the read refinement; final 390px confirmation review also passed |
| Preservation | 457 authored hashes verified; 51 reference files and three original CSS copies unchanged; dependencies/lockfile and original unit/preview assertions unchanged |

The full preview run had no source/test/tooling changes during execution. Subsequent bounded database-mode refinements kept an open clock-in visible after the schedule ended, improved confirmation readability and corrected outdated unavailable notices. Original preview branches/CSS/assertions stayed unchanged. Unit/types/lint/format/schema, all local authenticated/service checks, focused Neon GPS/visual checks, production build/isolation and bundle scans were rerun as relevant; the full preview suite was not repeated. No unresolved implementation or automated-check blocker remains.

The acceptance flow verifies purpose before permission, one capture, committed clock-in, refresh, another login/device, scoped own confirmation, unrelated-Staff denial, no Dashboard capture, no Clock Out, double taps and a response lost after commit followed by exact retry. Denied/poor/outside cases create neither attendance nor success audit. Initial fixture-loading/type issues were corrected during targeted checks. One temporary 390px confirmation screenshot was inspected after a persisted refresh; no new large screenshot collection is created.

## Physical acceptance and remaining limits

`Permissions-Policy: geolocation=(self)` is explicitly configured and verified by browser HTTP tests; capture refuses insecure contexts. Localhost and Chromium mocked coordinates are **not actual phone GPS acceptance**. No secure hosted staging or physical Android device test was performed. Physical permissions, accuracy, network/lifecycle handling and any future PWA/TWA Android permission delegation remain outstanding. No PWA/APK packaging or deployment is implemented.

Production GPS values, house approval, policy governance, privacy/evidence retention/dispute procedures and deployment operations remain unapproved. Browser location can be spoofed and is not conclusive proof of presence. Clock-out, full timesheets/approval, payroll, corrections, Leave, Diary/Care submissions, private files, delivery and template publishing remain unavailable in database mode. Original development previews remain labelled simulations.

Recommended next assignment: **Phase 2F**, separately approved, for clock-out policy/service with current trusted scope, preserved immutable clock-in evidence, concurrency/idempotency and audit. There is no automatic clock-out or workaround to the single-open-record rule. Approve policies and complete physical HTTPS/Android acceptance before production activation; Phase 2F has not been started.

Phase 2E checkpoint: **862c074d8d21aa4025807d11b9dd5dd468be9162**, pushed on `phase-2e-complete` before Phase 2F.
