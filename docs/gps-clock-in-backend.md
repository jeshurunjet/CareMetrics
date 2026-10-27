# Phase 2E — Event-only GPS clock-in

> **GPS/presentation follow-up — Stages A–D complete (27 October 2026):** the approved staging web update and QStash Free cleanup are live. A real scheduled delivery erased expired synthetic coordinates while preserving attendance/audit. The installed RedMagic APK1.0.1/build2 passed genuine GPS clock-in, exact PostgreSQL/evidence comparison, live map, refresh, clock-out, permission denial and presentation checks. Recording-only mode remains pinned to the fictional organisation; this is not house verification or organisational production approval. The separately approved shift cancellation/replacement is audited; other original records/credentials are preserved. No new source push or APK/signing change. See [full handover](gps-demo-and-visual-polish.md#completion-and-operating-handover).

> **Historical Stage B checkpoint — (27 October 2026):** after the user's continuation approval, the reviewed ninth migration and17 allowlisted name/image updates were applied to the existing fictional Neon staging branch. Temporary clone rehearsal, private backup, original/protected hashes, idempotency, hosted Staff/Admin logins and retained Diary/Care author/history checks pass. The website code remains on the prior deployment; GPS, scheduler provisioning, Stage C deployment and actual phone GPS remain pending separate approval. No new source push or APK/signing change. [Stage B handover](gps-demo-and-visual-polish.md#stage-b-fictional-staging-integration-results).


> **Historical Stage A checkpoint ( 27 October 2026):** local implementation is on `gps-demo-and-visual-polish`, after the explicitly requested push of `phase-2j-complete` at `109451741b38021bb5a6e7ce415b40eb1d26db34`. New recording-only policy, nine-migration local schema, expiry/purge/evidence UI, local illustrated avatars/licensed photos and exact fictional-name polish script are implemented/tested locally. **No new Neon migration/data rewrite, hosted deployment, GPS activation, Git push or APK rebuild.** Stage B/C approvals and a verified automatic purge scheduler are still required; genuine Android GPS acceptance remains pending. See [GPS demo and visual polish](gps-demo-and-visual-polish.md) for exact scope, policy, mappings, tests and limitations. Earlier Phase 2J status below describes the unchanged deployed iteration.


This connects one-time browser location to an authenticated, server-validated PostgreSQL clock-in. It is a development-tested implementation, **not approved production attendance or physical Android GPS acceptance**. Production activation is deliberately locked off. Clock-out, payroll, timesheets and corrections are not implemented.

## Phase 2F continuation

The opening limitations describe the Phase 2E checkpoint. [Phase 2F](clock-out-attendance-backend.md) adds separately configured development-only clock-out, own history and management read access. Existing GPS validation and production lockout remain intact; no clock-out location is captured under the explicit no-location test policy.

## Checkpoint and database

Phase 2D was already committed/pushed at **470dcaa485803165e8f351e7d2a893082c79e351** on `phase-2d-complete`; the new brief's uncommitted assumption was stale. That existing complete checkpoint was retained and `phase-2e` created from it, without an empty replacement commit. Phase 2C remains `b005307792f2fac46e7d513ae8435edf4d79a601`. The user subsequently authorised pushing the completed Phase 2E checkpoint on `phase-2e-complete` before starting Phase 2F. No application deployment is authorised.

Only Neon **phase-2a / br-billowing-rice-a78isrig**, project `fragrant-snow-30323119`, is used. Ready state, matching actual pooled/direct endpoints/database, certificate-verified client TLS, the exact three existing migrations, retained Phase 2D scheduling/audit and absence of conflicting legacy open attendance were verified before migration. Migration 004 was first tested in disposable PostgreSQL, then applied to development without resetting/reseeding populated data. Production was untouched. Expiry remains **24 November 2026 at 11:18 NZDT**.

## Service and UI modules

| Module | Responsibility |
| --- | --- |
| `modules/attendance/geo.ts` | Finite coordinate validation, Haversine distance in metres |
| `server/attendance/policy.ts` | Strict, server-controlled tenant policy parsing and production lockout |
| `server/attendance/validation.ts` | Narrow request schema, eligibility, accuracy/freshness/boundary checks and safe reason codes |
| `server/attendance/clock-in.ts` | Trusted identity, transaction locks/rechecks, persistence, exact retries and audit |
| `server/attendance/state.ts` | Safe own confirmation and availability; no raw location DTO |
| `modules/attendance/browser.ts` | One `getCurrentPosition` call per capture, controlled error messages |
| `modules/attendance/ClockInControl.tsx` | Purpose dialog, user request, pending/error/retry and committed confirmation |

Staff My Shifts and own Roster details reuse the existing shell, cards, modal, buttons, banners, CSS and fonts. Dashboard/roster cards show the persisted own clock-in time where present; Admin has only existing authorised basic attendance-history status, with schedule changes protected. An open clock-in remains prominent on My Shifts/Dashboard after its scheduled end; this does not infer clock-out. There is no new full attendance store in React, private-location directory or timesheet module. Continue to Dashboard remains available without clock-in. Original preview interactions stay separately isolated.

## Narrow HTTP contract

`POST /api/attendance/clock-in` accepts JSON containing exactly:

```ts
{
  shiftId: string;       // UUID; ownership is checked on server
  requestId: string;     // cryptographically random UUID for this attempt/retry
  latitude: number;
  longitude: number;
  accuracyMetres: number;
  measuredAt: number;    // browser position timestamp, Unix milliseconds
}
```

Employee/org/role/house/house coordinates, policy limits and success are never supplied by the browser. Unknown/missing fields, strings masquerading as numbers, NaN/Infinity, out-of-range coordinates and invalid timestamps fail validation. The shared bounded JSON guard was extracted from the existing management HTTP helper without changing its origin/body rules: exact configured URL/POST Origin, cross-site rejection, JSON-only and actual streamed 32 KiB maximum. It is not sufficient to hide the button.

Every operation independently resolves the active Auth.js account, organisation and session version. It locks the organisation then actor in the same order as scheduling and Phase 2C management, rechecks trusted identity inside the transaction, binds Shift to the employee/tenant, and verifies current assignment, active house, noncancelled shift, configuration, eligibility, measurement and absence of incompatible attendance. Role/account administration is never granted through clock-in. Managers using Staff screens still need their own shift and current assignment.

Success follows transaction commit: `{ attendance, replayed }`. Own confirmation includes stable attendance/shift/house IDs, authoritative clock-in time, measurement time, reported accuracy, policy version and labelled verification result. It excludes coordinates, request digest, whole policy and unrelated records. `GET /api/attendance/clock-in?shiftId=UUID` returns the same scoped availability/confirmation. It rejects duplicate/unknown query parameters and applies current own-employee/active-house assignment checks. Staff schedule APIs use that same safe evidence projection; no raw Prisma object is returned.

Responses are private/no-store. Safe error statuses: 400 malformed/measurement failure, 401 inactive/revoked/anonymous, 403 origin/capability violation, 404 missing or inaccessible shift/house, 409 duplicate/open attendance/cancelled/ineligible conflict, 503 missing configuration or unexpected service failure. Reason codes include INVALID_INPUT, INVALID_LOCATION, POLICY_UNAVAILABLE, HOUSE_UNCONFIGURED, INELIGIBLE_SHIFT, POOR_ACCURACY, STALE_MEASUREMENT, FUTURE_MEASUREMENT, OUTSIDE_BOUNDARY, EXISTING_ATTENDANCE, ACTIVE_ATTENDANCE and REQUEST_CONFLICT. No distance or precise house location is returned in an error. The UI explains rejection and Contact Management; failures do not trigger mock fallback or success.

## Organisation-scoped policy: unapproved production stays disabled

There is no existing policy approval model. A small explicit server-controlled environment configuration is used, keyed by organisation UUID, rather than treating provisional house fields as organisational approval:

- `CAREMETRICS_GPS_POLICIES`: JSON array of complete policy objects.
- `CAREMETRICS_GPS_TEST_POLICY_ACK=fictional-development-only`: deliberate test acknowledgement.
- Only nonproduction `phase-2a` or the disposable `local-test` context is accepted.
- `NODE_ENV=production` **or** `VERCEL_ENV=production` always disables clock-in policy, even if every test flag/value is supplied.
- Only `approval: test-only`, `enabled: true` and a `test-…` version are supported in Phase 2E. An `approved` string cannot activate production. Formal production policy activation needs separately reviewed implementation and organisational approval.

Missing/malformed/partial/disabled/unapproved policy, duplicate tenant/house IDs, unknown keys/rules, invalid numeric settings or unknown tenant return unavailable. Required settings have **no fallback values**. Normal `.env.local` is unchanged; `.env.example` contains blank configuration. Policies are read on the server, not from cookies, UI state, request fields or NEXT_PUBLIC variables. `attendance.gpsClockIn` capability also fails closed without valid policy; unknown/deferred capabilities remain denied.

Each policy specifies maximum distance/accuracy, maximum measurement age and future skew, early and late eligibility windows, boundary rule, version and explicitly reviewed houses. A house approval binds its ID to exact configured latitude/longitude; absent/null/out-of-range/changed coordinates or an inactive house block new clock-in. Decimal coordinates are converted to finite numbers on the server. Address strings never determine location and no geocoding service is called. House coordinate editing remains management-only. The test binding is not a claim of real house approval.

**All production values/decisions remain unapproved:** distance, accuracy, age/future skew, early/late window, uncertainty rule, approved house survey/configuration, policy version/approval governance, retention/access/dispute handling and clock-out policy. Before production, replace/extend this test-only gate through reviewed, versioned organisation policy management and operational controls; do not remove it simply to make a test pass.

### Explicit fictional fixture values

Only test runners load `tests/fixtures/gps-policy.json`, covering a separate fictional browser-test organisation/house. These values are **test inputs, not CareMetrics organisational policy**:

| Setting | Test-only value |
| --- | --- |
| Distance / maximum accuracy | 500 m / 30 m |
| Measurement age / future skew | 60,000 ms / 0 ms |
| Early / late window | 600,000 ms / 3,600,000 ms |
| Boundary rule | Entire reported accuracy circle inside |
| Version | `test-phase-2e-v1` |

Service tests use their own generated fictional tenant. Existing seed organisation has no enabled GPS policy. Test runners supply fixtures only after nonproduction/development guards; nothing is automatically loaded into the normal app or production. Dedicated generated browser accounts are deactivated after tests; recorded attendance, related shifts and audit remain. No simulated clock-out/delete is used for cleanup. Destructive SQL/concurrency/rollback tests explicitly require the disposable local database. The original core browser journey still asserts zero attendance in **its own seed organisation**, allowing real GPS test records in a separate tenant without weakening the no-fake-attendance expectation.

## Distance, accuracy and eligibility

Haversine uses the IUGG mean Earth radius of 6,371,008.8 metres (a mathematical constant, not a geofence). It validates all coordinates, handles identical/local/antipodal/dateline cases and clamps floating-point intermediate values to [0,1]. Distances remain unrounded for acceptance.

The conservative test rule accepts only `distance + reportedAccuracy <= configuredDistance`, and only if accuracy also meets its own configured maximum. A point inside the boundary whose reported accuracy circle extends outside is rejected. Accuracy is an estimate, so this numeric rule does not establish the true physical position or certainty of presence. No silent point-only allowance or favourable rounding is used.

Server receipt time is captured at service entry after bounded body decoding, before authentication/locking. It is the authoritative `clockIn` time; the device cannot choose recorded attendance time. Measurement age and future skew use this receipt instant. The browser timestamp is supporting evidence only.

Eligibility uses UTC instants: receipt must be at or after `startsAt - earlyWindow`, at or before `startsAt + lateWindow`, and strictly before `endsAt`. An overnight shift is not a calendar-date special case; elapsed time naturally handles year/month changes and both Pacific/Auckland DST transitions. Presentation remains NZ local. No rest, break, payroll or weekly-hours policy is invented. A valid schedule alone is not attendance evidence.

## Persistence, locking and retries

Migration `202610250004_gps_clock_in` extends the existing AttendanceRecord with nullable house relation, measurement time, reported accuracy, verification, policy version/snapshot and request ID/digest. Existing legacy attendance is retained without fabricated evidence/backfill. New GPS records contain all required evidence and a same-tenant House FK; an insert/update trigger checks that the house matches the Shift. Raw employee latitude/longitude, altitude, heading, speed, address traces and distance are **not stored**.

Because raw positions are not retained, a historical geofence cannot be independently recomputed from AttendanceRecord. Approval/configuration archival, dispute evidence and retention remain preproduction decisions; this phase retains a labelled test validation result and request identity only.

The existing unique shift key prevents repeat attendance for the same shift. A unique request UUID, shared organisation/actor locks and a partial unique index permitting at most one open clock-in per tenant/employee handle concurrent requests and incompatible attendance, including direct writers. Current related-record validation and scheduling changes participate in the same organisation-lock protocol. Future direct writers must maintain these invariants; privileged maintenance is not an application bypass feature.

An exact same request ID and payload returns the original committed result with `replayed: true`, without another audit or location measurement. It still rechecks current account/session, own shift, active assignment/house and noncancelled shift. Once committed, an exact retry is an authorised read, so it does not reapply expiry/window/new-policy checks or create a second event. Changed payload, another request ID for an existing shift, reuse on another shift or incompatible open attendance produces a conflict. The digest is keyed HMAC-SHA256 of canonical request fields, using the existing server secret; it is for payload identity, **not cryptographic proof of location**. Secret rotation/session revocation can require refreshing recorded state rather than replaying an old attempt.

The browser retains an uncertain payload only in component memory. A lost response offers Retry previous request, reusing that exact payload/key before taking another position. Refresh or another authenticated device reads committed PostgreSQL state. If no event committed and a retry fails freshness, request a new measurement; never assume the first attempt succeeded. Navigating away does not guarantee cancellation of a transaction already sent; check the database-backed state on return. An unmounted component discards a still-pending capture before submission.

Attendance and minimal `attendance.clocked_in` audit commit in the same transaction. Audit records tenant/trusted actor/attendance/shift/house/policy/label, without coordinates or accuracy details. Audit failure rolls back attendance. Verified clock-in evidence cannot be updated/deleted by ordinary writes; a database trigger preserves ID/ownership/clock-in/evidence/creation fields. Clock-out is excluded from this immutable tuple solely to allow a separately reviewed Phase 2F implementation; no clock-out route/control is supplied now. Existing scheduling services block edits/cancellation when attendance references a shift.

## Browser purpose, security and privacy

After the user taps Clock In, a purpose dialog explains the one-time collection and retained metadata. Only Use current location calls `navigator.geolocation.getCurrentPosition`, with `enableHighAccuracy: true`, `maximumAge: 0` and a finite 15-second capture timeout. That timeout is an engineering request bound, not an organisational attendance policy. Server limits remain authoritative. No `watchPosition`, automatic Dashboard capture, timer-based collection, localStorage location cache, coordinate URL/query, external geocoder, analytics payload or application GPS logging is introduced. The map area deliberately shows no live device position.

Permission denied, unsupported/insecure origin, location services unavailable and timeout use controlled explanations. Poor accuracy/stale/future/outside/window/configuration/ownership failures do not persist attendance. There is no Staff GPS bypass or self-approved manual clock-in. The browser only shows Clocked In after a valid committed response or persisted server read. Clock Out is never simulated.

The [browser API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) can use GPS, Wi-Fi or network positioning; accuracy varies and reported positions can be manipulated. These checks do not prove presence or replace organisational dispute procedures. HTTPS, explicit purpose/permission, privacy review, retention/access/deletion procedures, least-privilege runtime roles and operator policy/configuration management still require deployment acceptance. This phase minimises evidence; it does not approve a retention period or implement a retention/deletion service.

## HTTPS, PWA/TWA and physical-device acceptance

Next.js explicitly serves `Permissions-Policy: geolocation=(self)` and browser tests verify the actual header. Per the [Geolocation Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/geolocation), this permits the application origin while excluding arbitrary cross-origin frames. The capture helper refuses insecure contexts. Localhost's secure-context exception is useful for tests and does not prove phone/LAN or hosted HTTPS behaviour.

No PWA manifest/service worker, Digital Asset Links or Android wrapper/package currently exists in the tracked app. A future installed PWA still needs HTTPS/origin permission and device acceptance. A TWA may additionally need Android/browser permission delegation and wrapper/service configuration; see [Chromium permission delegation](https://chromium.googlesource.com/chromium/src/+/HEAD/chrome/android/java/src/org/chromium/chrome/browser/browserservices/permissiondelegation/README.md) and [Chrome TWA overview](https://developer.chrome.com/docs/android/trusted-web-activity). These are packaging-phase prerequisites, not changes implemented here. Attendance POSTs must not be queued/replayed by a future offline service worker without a separately reviewed freshness/retry design.

**Outstanding:** secure hosted staging, physical Android permission/accuracy/freshness/network/lifecycle acceptance, other physical devices and Safari/Firefox. Browser tests use explicitly mocked coordinates/permission errors and a development-only policy. They are automated evidence, never a claim of actual Android GPS success. No APK or deployment was produced.

## Verification and Phase 2F handover

Final automated results: 441 units, 91 database/security cases, 44 local and 44 Neon authenticated browser passes (four intentional skips each), final focused Neon GPS checks, 619 full preview passes/126 intentional skips, lint/types/format/schema/build, 141-route/25-API production isolation and secret/bundle scans passed. See [implementation status](implementation-status.md) for exact scope and physical acceptance still outstanding. Focused unit/service/browser checks precede the single complete original Chromium preview regression. Original reference/assets/CSS and previous branches are preserved; source is frozen during final browser verification.

Phase 2F must separately define and approve clock-out location/eligibility/freshness and incomplete-attendance policy. Preserve immutable clock-in evidence and append the correctly authorised server event/decision, with current identity/shift/assignment checks, concurrency, idempotent retries and audit. At most one open record remains an enforced invariant; this phase cannot clock a worker into another shift while the previous record is open. Do not invent an automatic clock-out or manual correction to work around it. Production GPS activation, timesheet approval, payroll and correction review remain separate approvals. Phase 2F is not started automatically.

## Recording-only fictional demo follow-up

The original geofence test capability above remains restrictive and cannot be enabled in organisational production. The separate local `GPS_LOCATION_RECORDED_DEMO` path now persists one reported position without house-distance rejection, retaining all identity/assignment/shift/accuracy/freshness/atomicity/idempotency controls. Its evidence table has seven-day read expiry, protected expiry-only erasure, restricted purge SQL/job and an organisation-classification safeguard. Own/same-org management evidence endpoints and explicit-consent map UI are implemented. Unit545, PostgreSQL289 and focused authenticated browser flows pass; hosted activation/automatic deletion and actual REDMAGIC GPS remain pending. [Full policy, migration, retention, tests and approvals](gps-demo-and-visual-polish.md).
