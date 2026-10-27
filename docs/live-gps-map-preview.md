# Foreground live GPS map before clock-in

Status: deployed and physically accepted after explicit approval, 27 October 2026. Earlier local-only statements below describe the pre-approval checkpoint; final hosted/native results follow. The signed APK/identity and existing data remain preserved.

## Checkpoint and scope

Completed GPS/presentation/retention work is preserved in local commit `6f3faaa` on `gps-demo-and-visual-polish`. New branch `live-gps-map-preview` inherits the full application. The older pushed `phase-2j-complete` / `1094517` and earlier branches remain intact. Reference/private files and the50 pre-existing duplicate comparison screenshots were excluded from the checkpoint. No Git push is performed.

This brief intentionally adds a user-started **foreground** watch; earlier “one-time only” documentation describes the preceding deployed iteration. Background tracking remains prohibited. No schema, migration, dependency, house photograph, profile/avatar/name, clock-out service or QStash configuration changes are needed.

## Components and data flow

- `StaffSchedule.tsx`: replaces the existing map placeholder with the approved panel in the same two-column/mobile-first layout. Its single hook instance shares the in-memory reading with the highlighted shift's `ClockInControl`. Opening a shift-details overlay disables/stops that main preview; the overlay retains its existing one-shot clock-in flow. No additional watcher is created there.
- `LiveLocationPanel.tsx`: Your Current Location, initial explanation, Show Live Location, status, coordinates, reported accuracy, last-update time (Pacific/Auckland with seconds), Stop and Recenter. Accuracy display is rounded only for readability; raw accuracy remains unchanged for validation/submission. Stop discards preview coordinates and unmounts the map. The action is disabled when there is no eligible highlighted clock-in or an attendance is already recorded; the panel explains that state and preserves Continue to Dashboard.
- `foreground-location.ts`: a testable browser-tab singleton watch coordinator and location-quality helper. A controller is created without requesting location. Explicit Start uses `watchPosition` with high accuracy, `maximumAge:0`, timeout15seconds. It copies only latitude/longitude/accuracy/measurement time, updates the latest sample, ignores older/out-of-session callbacks and prevents multiple active watches. Native callbacks do not invoke an API or database operation. Returned watcher ID0, synchronous errors and late callbacks are handled.
- `useLiveLocation.ts`: React ownership, permission lifecycle, visibility/page/route cleanup, offline state and a UI-only freshness clock. The one-second clock never requests GPS. A hidden/backgrounded view, pagehide, navigation, unmount, offline event, revoked permission or unrecoverable/timeout error clears the watch and preview. Returning online/visible never restarts it automatically.
- Staff logout and shared `SignOut.tsx` stop the active watch immediately, before the Auth.js request/redirect, even if logout is slow or fails. Logout/route disposal also removes permission listeners. No local/session storage or offline GPS cache is introduced.
- `RecordedLocationMap.tsx`: reuses existing client-only Leaflet, pin, OSM tiles, attribution and referrer policy. The live marker receives updated positions. The first fix establishes map centre; later fixes do not reset a manually panned/zoomed view. Only Recenter pans back to the latest position and preserves zoom. A memoised preview map does not rerender for the UI freshness clock or accuracy-only updates. Recorded attendance maps retain their existing behaviour and separate consent.

Map failure leaves coordinates/accuracy visible. No marker or tile request occurs before an actual valid reading after explicit Start. The panel explains approximate-area disclosure to OSM before Start; exact coordinates are not placed in map-provider query parameters, app URLs or analytics, and there is no bulk/offline tile caching. A live preview necessarily makes foreground location observations; it is not house verification.

## Clock-in and server boundary

`clockInState` exposes only the existing server-configured accuracy/age/future-skew limits as optional `positionPolicy` display/validation hints for an eligible shift. They are not security authority or new policy defaults. No new environment variable is required.

Clock In retains its confirmation step. It snapshots a valid, fresh preview sample; stale/poor/missing samples request one fresh position instead. The fresh sample is checked against the same hints. Invalid readings display an error without posting attendance. The server independently validates session/account, organisation, shift ownership/assignment/house, eligibility, accuracy, measurement age, concurrency and policy exactly as before. Recording-only fictional mode still skips house distance only; legacy house-verification production lockout is unchanged.

Only the accepted event is posted through the existing attendance endpoint and atomic attendance/evidence/audit transaction. Successful confirmation stops/clears the preview;401/403 also stop it. The original accepted request ID and position remain fixed for an uncertain-network retry, preserving exact idempotency rather than recapturing a different request. A pending browser one-shot cannot be cancelled through clearWatch; hidden/unmounted results are ignored before creating a new POST. An already sent attendance transaction may finish after navigation and is recovered through the existing idempotency/history path.

Existing precise evidence remains immutable until measurement+168hour erasure. Private evidence reads, expiry enforcement, original attendance history/map, no-location demo clock-out and the operational QStash job are unchanged. The live preview itself persists **zero** coordinates or attendance rows.

## Verification

All automated locations are fictional fixtures, not physical GPS acceptance.

- Lint and strict TypeScript pass.
- 562 unit tests /26 files pass, including11 new foreground/quality cases for singleton ownership, explicit start, callback generations, watcher ID0, errors, restart, invalid readings and exact accuracy/freshness boundaries.
- 289 PostgreSQL service/security tests /9 files pass in an owned disposable localhost cluster, with all10 migrations and repeat seeding. Existing duplicate/conflicting requests, server permission/eligibility/policy validation, physical expiry erasure and immutable attendance/audit protections pass.
- Focused authenticated browser suite:5 passed /10 intentional viewport gates skipped. New390px preview flows plus the existing recording-evidence/presentation workflow and1280px Admin photos/privacy flow pass. New cases cover no request on load; one watch; marker/accuracy/timestamp updates; manual pan retention/Recenter; Stop and discarded UI coordinates; no preview database writes; navigation/overlay/background/offline cleanup; grant-to-prompt permission revocation; denied/timeout states; immediate pre-signout cleanup; stale/poor reading rejection and fresh fallback; reuse of a fresh preview without an extra one-shot; one committed evidence/audit; successful watcher cleanup; original recorded map and clock-out; disabled no-eligible state.
- Production build and HTTP isolation pass from an isolated source copy outside the cloud-synced Desktop build directory. Public association/manifest/security headers,141 preview refusals,27 read/auth and17 mutation denials, and20 unknown/deferred JSON404 probes pass.
- One additional focused390px visual/overflow check passed and its single mocked-location screen was inspected. No large screenshot collection was regenerated.

The browser hidden/offline conditions are deterministic fixtures, not real Android background/radio proof. The Next development server again logged “destination stream closed early” during the deliberately interrupted/offline navigation without a failed test; existing pg8 overlapping-query and NO_COLOR/FORCE_COLOR warnings remain. No production-runtime failure is inferred or concealed. Initial test harness issues (Playwright fixture argument syntax and formatter handling of inline multi-field types) were corrected before the successful checks.

## Deployment and physical acceptance gate

The existing live deployment remains `dpl_7ZhF7Y2FDFX32pn3YJ4BbSD77JLe` at https://caremetrics-staging.vercel.app. Its genuine one-time physical GPS acceptance remains historical evidence, not proof of this new foreground preview.

The user's brief explicitly says: “Do not redeploy Vercel or push Git changes automatically.” Only after approval should this tested web version be deployed to the same origin and accepted on the RedMagic: Start/marker updates, manual pan/Recenter, Stop, Home/background/navigation/logout cleanup, explicit restart, no preview writes, one genuine clock-in, retained map and clock-out. A currently eligible fictional Robin shift may need to be added through authenticated Admin scheduling; retain old shifts/attendance and existing policy values. Never use mocked phone coordinates as physical proof.

No APK rebuild is expected for this hosted-only change, but actual compatibility of the new preview remains pending the approved hosted update. Preserve `nz.co.caremetrics.staff`, APK1.0.1/build2, the original signing identity and encrypted Jet backup. The academic465-file submission/ZIP and original export/CSS remain protected. Keep the live retention job and cleanup-capable rollback described in `gps-demo-and-visual-polish.md`; the new preview does not replace that operating plan.

## Final local result

Final lint, strict TypeScript,562 units, formatting528 authored code files, isolated production build and HTTP isolation all pass. Focused browser acceptance remains5 pass/10 deliberate viewport gates; an additional390px visual/overflow run passes1/1. The one screenshot uses fictional automated positions and deliberately blocked tile responses to verify the fallback; it is not a phone/GPS screenshot or a claim of successful live tile delivery in this new flow.

The fresh production build's runtime source hashes match the working tree. All723 authored files and147 fresh client assets were scanned against21 private credential/previous-actual-coordinate values, with no matches; automated `__liveGPS` hooks are absent from client assets. Photos, avatars, styles and all existing migrations match checkpoint6f3faaa. Academic465 hashes, original51 export files, three original CSS copies and the signed APK checksum remain unchanged. Generated Next type paths were restored by final typecheck; no generated-file diff remains. Git whitespace checks pass.

No local blocker remains. Hosted deployment/new physical acceptance are intentionally pending the supplied brief's approval gate. No existing Neon data, runtime environment, schedule, signing material or backup was changed. New foreground positions have not been collected from the actual phone during this task.

Reference behaviour reviewed against primary documentation: [MDN watchPosition/clearWatch lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition) and [React Leaflet MapContainer immutability/useMap](https://react-leaflet.js.org/docs/api-map/). The implementation uses explicit Recenter because changing MapContainer props does not move an existing map.


## Approved hosting and actual Android results

The owner approved “staging deployment and Android test”, including one new eligible fictional Robin shift through Admin if needed. No Git push or APK/signing change was included. The tested source was deployed to the existing Vercel project/team, keeping current server environment and retention services. READY deployment: **`dpl_DjLX6fMRUDRoGqgSwpA9q3R9t52T`**, stable origin https://caremetrics-staging.vercel.app, Node22/basic build. The prior READY deployment `dpl_7ZhF7Y2FDFX32pn3YJ4BbSD77JLe` was verified before deployment and remains the previous live-version rollback. Both include the cleanup route; keep the retirement/cleanup safeguards in the earlier GPS handover.

Before any business mutation, a protected whole-dataset hash snapshot was saved privately. Passwords, roles, names, IDs, assignments and business/history rows were included; only User sessionVersion/updatedAt were separately permitted for the requested normal logout test. Authenticated Avery Admin created one new Robin/Harbour shift, **20:53–21:53 Pacific/Auckland on27October**, with an explicit academic acceptance note. No existing shift was cancelled, rescheduled or deleted in this follow-up. The phone's old session had expired; real Auth.js login renewed it using the unchanged account/password.

### Genuine physical matrix

Actual REDMAGIC10Pro / Android16, Brave / Chromium155.0.8059.85, existing APK1.0.1/build2 and package `nz.co.caremetrics.staff`. All positions in this matrix came from original native browser callbacks, not simulated coordinates or permission overrides. Test observers forwarded the actual browser methods; lifecycle receipts contain only counts/flags/accuracy metadata. They kept no preview coordinate history. Only the accepted attendance payload was privately retained for matching evidence.

| Check | Actual result |
| --- | --- |
| Fresh login → My Shifts | Passed; Current Location section shown; no watch/one-shot on load |
| Explicit Show Live Location | One genuine native watch; marker/current coordinates/accuracy/time rendered |
| Multiple updates | Multiple real callbacks, updated UI; no second simultaneous watcher |
| Map | One pin, real OSM tiles and attribution, standalone374px layout, no horizontal overflow |
| Manual pan/Recenter | Pan remained through a later real fix; Recenter returned to latest position |
| Stop | Native clearWatch observed; marker/preview discarded |
| Actual Home/background | Document became hidden and native watch cleared immediately |
| Return to app | TWA recreated its document; no marker/watch auto-resumed; explicit restart required |
| Navigate to Dashboard | Active watch cleared |
| Actual Sign Out | Native watch cleared before the real Auth.js signout request; Login reached |
| Preview-only database writes | Zero new AttendanceRecord/AttendanceLocationEvidence across all preview/lifecycle/logout tests |
| Genuine Clock In | Reused a fresh watch reading, approximately16.2m raw reported accuracy; zero additional one-shot requests |
| Commit | Exact accepted native coordinates/accuracy/timestamp match PostgreSQL; one attendance/evidence and one clock-in audit; watch stops |
| Seven-day expiry | Exact measurement+168hours; unchanged read/purge design |
| Recorded details/map | Exact retained coordinates and real map tiles available through existing authorised controls |
| Reload | Same attendance/evidence; recorded-map consent resets; no watch or one-shot on load |
| Clock Out | Existing no-location demo policy committed; immutable original evidence retained; one clock-out audit; zero new GPS calls |
| Final cleanup | Temporary observers removed, original native geolocation methods restored; Dashboard/standalone verified |

Acceptance combines resumed checks, not a single uninterrupted run. The first Home/resume helper assumed its observer survived a native document recreation; it was corrected to wait for the new document and verify the explicit restart state. Another helper initially tapped an off-screen/animating drawer action; stable in-viewport native hit testing completed the genuine logout check. The application was not changed or redeployed to bypass either helper issue. No preview screenshots/trajectory were saved. Permission-denied/revoked/timeout/poor/stale/offline branches remain proven by automated tests; this physical run used genuinely granted permission and does not claim every failure condition was recreated on the phone.

### Preservation, hosting security and operations

Existing protected business/account rows match the before snapshot. Normal logout session revocation metadata is permitted and separately disclosed. Exact additions in the original organisation are **one shift, one completed real attendance/evidence and three audit events** (shift create, clock-in, clock-out). Original-org totals now: shifts5, attendance2, evidence2, audit18; other core data remains users6/houses3/clients4/contacts4/assignments5/Diary2/Care2/template1/version1/assignment1. The separate inactive synthetic retention tenant remains outside these totals.

Final actual hosted checks pass: anonymous own/Admin location401, Staff Admin-location403, genuine Admin same-org exact evidence and completed record/details, other-org404, and ordinary history/audit without coordinates. Existing QStash schedule remains active every five minutes, with successful signed deliveries after this deployment and no recent inspected errors. No schema, environment, policy limit, dependency, scheduler, paid-service or organisation-classification changes were made. The prior hosted automatic physical purge proof remains valid; the new phone evidence itself has not been aged seven real days. Backups/outage/quota limits remain as previously documented.

Current authored/runtime and147 fresh client assets pass scans against23 private credential/accepted-coordinate values; temporary automated/physical test hooks are absent from deployed-source client assets. The tested build's runtime source hashes match the working tree. Public photographs/avatars/styles/migrations, original51 export files, three CSS copies, academic465 hashes and APK SHA256 `95ec353d66afc5d87a54e416b720ccdea05e546b2203bf38c502efdc086a03e3` are preserved. No keystore/USB-backup access or rebuild was needed; this new hosted UI is accepted with the existing signed APK.

Private operator receipts live under `~/.caremetrics/staging/live-map-preview/`, owner-only and outside source/upload. They include preservation hashes, approved shift intent/result, non-coordinate lifecycle summaries, accepted-event-only private comparison and hosted access checks. The operator did not reset/reseed populated databases or activate invited accounts.

The feature is saved on its separate local Git branch with the original GPS checkpoint retained; **no Git push**. New unrelated `milestone2/` files and the pre-existing comparison-image duplicates are outside this checkpoint's scope and remain untouched. No required implementation/deployment/device blocker remains for this focused demo. Production geofence/organisational approval, broader device support and other deferred application features remain outside this change.
