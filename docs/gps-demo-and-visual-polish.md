# GPS recording demo and presentation polish

> **GPS/presentation follow-up — Stages A–D complete (27 October 2026):** the approved staging web update and QStash Free cleanup are live. A real scheduled delivery erased expired synthetic coordinates while preserving attendance/audit. The installed RedMagic APK1.0.1/build2 passed genuine GPS clock-in, exact PostgreSQL/evidence comparison, live map, refresh, clock-out, permission denial and presentation checks. Recording-only mode remains pinned to the fictional organisation; this is not house verification or organisational production approval. The separately approved shift cancellation/replacement is audited; other original records/credentials are preserved. No new source push or APK/signing change. See [full handover](gps-demo-and-visual-polish.md#completion-and-operating-handover).

The following Stage A/B sections describe historical checkpoints; the current Stage C section above takes precedence.

Stage A local implementation is implemented; final verification results are recorded below. No live migration, profile rewrite, new GPS activation, deployment or APK signing is authorised by this stage. The user explicitly authorised the initial Git push: prior iteration is preserved at 109451741b38021bb5a6e7ce415b40eb1d26db34 on phase-2j-complete; current local branch gps-demo-and-visual-polish.

## Reviewed boundary

Existing house-verification test policies keep their production lockout. New GPS_LOCATION_RECORDED_DEMO is separate: active authenticated account, own eligible assigned shift, correct organisation, active house/assignment, fresh accurate one-time position, idempotency/concurrency and atomic audit remain mandatory; only house-coordinate/distance rejection is absent. It records reported location, never verification at the house. Clock-out uses an explicit demo no-location configuration, without modifying legacy policy decisions or clinical documentation exemptions.

Activation requires both an operator-controlled fictional-only organisation marker and server configuration bound to the dedicated staging project/origin/database. Ordinary organisational deployment and browser-supplied flags cannot enable it. No software can determine whether an operator types real information into a fictional environment; this deployment remains prohibited for real care/employee information, and no public organisation-classification control is supplied.

GPS limits have no runtime defaults. Proposed demo settings reuse existing explicitly documented test inputs: maximum accuracy30m, age60000ms, future skew0ms, early window600000ms, late window3600000ms (relative to shift start and strictly before end). These are fictional demonstration settings, not organisational production approval. Stage B/C review must include the exact configured values and an eligible shift; no automatic rewriting of old shifts.

## Data and retention design

A narrow ninth migration adds an operator-only fictional-organisation marker, local house-image key and a separate attendance-linked precise location evidence table. Existing immutable attendance/Diary/Care/template/audit rows are not backfilled or rewritten. Demo evidence is required atomically for new demo attendance. Coordinates are immutable until their mandatory expiry-only erasure; non-sensitive attendance metadata remains.

Precise coordinates expire168hours after measurement. Every evidence read checks server expiry; owner-only or same-organisation management access, private/no-store JSON, no ordinary history/audit/URL/analytics coordinates. A restricted SQL purge function clears only expired demo coordinates, with a separate minimum-privilege credential and authenticated job interface. Disposable PostgreSQL integration tests verify physical clearing through an execute-only role and exact preservation of attendance and audit rows.

Hosted purge is not operational yet. Official Vercel documentation (reviewed27October2026) says Hobby cron once/day with ±59minute precision; that is not sufficient for a short-period purge. Neon pg_cron runs only on active compute and is not reliable across free scale-to-zero. No paid upgrade, always-on compute, extension or third-party scheduler is authorised automatically. Scheduler/frequency/backup-history limitations and verification remain an explicit deployment gate. Access expiry alone is not described as deletion from the database or provider backups.

## Map privacy

Use existing client-only Leaflet only after an authorised viewer requests a map and sees a tile-provider privacy explanation. Exact coordinates stay in the private API/UI and never appear in map-provider query parameters. OSM tile requests necessarily expose an approximate tile area; visible attribution, origin-only referrer, standard browser User-Agent/caching, no bulk/offline tile caching. Map failure never reverses committed attendance. Expired evidence removes coordinates/map and shows the required retention message.

## Presentation and safe update

Local deterministic illustrated SVG avatars, stable record IDs, existing layout/aspect ratios and initials fallback. Distinct verified/licensed residential photographs downloaded/optimised locally; source/creator/licence and illustrative-use disclosure in demo-image-credits.md. Natural fictional names use an explicit allowlisted mapping; display labels/image metadata only, no login/ID/credential/assignment/history rewriting. Fresh seeding and populated-data polish are separate paths; populated databases are never reset/reseeded. Dry-run and preservation proofs precede any Stage B update.

## Verification and activation

Implemented: targeted policy/security/retention/database tests, presentation and real-auth browser checks. Final build/isolation/regression results are recorded below. Current working signed APK1.0.1/build2, key, Jet backup, reference/CSS and academic archive remain preserved. Hosted web changes should not require an APK rebuild; no redeployment/signing/push of this new work without the relevant approval. Actual Android GPS success is not claimed until live demo configuration, automatic deletion and phone acceptance are verified.

Sources: https://vercel.com/docs/cron-jobs/usage-and-pricing ; https://neon.com/docs/extensions/pg_cron ; https://operations.osmfoundation.org/policies/tiles/ ; https://unsplash.com/license .

## Concrete schema and activation contract

Migration `202610270009_gps_recording_demo` is additive. It passed disposable PostgreSQL and Neon clone rehearsal and was applied to fictional staging in Stage B. It adds:

- `Organisation.isFictionalDemo`, default false, unavailable through normal Admin inputs.
- `House.imageKey`, nullable, restricted to three allowlisted local photographs.
- `AttendanceLocationEvidence`, composite organisation/attendance linkage; coordinates with range/pair constraints; exact measurement+168-hour expiry; purge timestamp.
- Existing immutable AttendanceRecord evidence gains the separate `GPS_LOCATION_RECORDED_DEMO` label. Existing house-verification labels/semantics and eight migrations remain unchanged. New demo rows require linked evidence at transaction commit; no incomplete attendance/evidence commit is possible.
- Coordinates cannot be edited, deleted early or restored after purge. Only null/null plus database-generated purge time is accepted after expiry. Attendance itself and audit remain immutable. Separate explicit `NO_LOCATION_REQUIRED_DEMO` clock-out label is valid only for the new demo clock-in label.
- `purge_expired_demo_locations()` has a fixed search path and no PUBLIC execution privilege. Its fixed SQL erases up to 500 expired demo evidence rows for fictional-marked organisations, using row locks and SKIP LOCKED. No arbitrary SQL/record IDs are accepted.

A database trigger prevents turning `isFictionalDemo` off while any precise coordinates remain. Retention operations must keep it true until all retained coordinates have been erased. Automatic review rejected removing this scope guard; it remains present. Retirement must first disable new recording while retaining the fictional marker, cleanup credentials, server acknowledgements and a working cleanup deployment. Let existing coordinates expire and be purged, verify that none remain, and only then retire classification/configuration safely. Turning off the job or unmarking the organisation prematurely does not erase stored coordinates. Read-time expiry continues to hide them, but that alone is not physical deletion.

`GET /api/jobs/purge-location-evidence` requires a valid QStash signature (or explicit operator maintenance refresh) plus a strong `CRON_SECRET` in its Bearer header, uses constant-time digest comparison, rejects query tokens and returns only a count. Missing configuration/database errors fail closed generically. A separate `caremetrics_location_purger` login must have CONNECT/USAGE and EXECUTE on this function, **no ordinary attendance/evidence table privileges**. Its verified-TLS URL must match the application's database target and fixed role name. No scheduler/role/password was provisioned on Neon during Stage A. Job credentials must remain outside Git and client bundles.

A reviewed scheduler must invoke the job often enough, retry failures, drain batches and alert on backlog; prove it against an expired fictional fixture and unchanged attendance/audit hashes. Vercel Hobby's daily job and sleeping-compute pg_cron do not establish seven-day physical-deletion operation. Stage C provisions the separately approved QStash Free mechanism; automatic physical deletion must pass **before enabling real-phone recording**. Periodic purge has a normal polling lag; outages, retries and exhausted quotas can extend it. Do not claim an unconditional upper bound or exact-second physical deletion. Provider backup/PITR retention is separate: live-row erasure does not immediately erase retained provider backups. Verify the actual Neon plan/restore history and applicable retention before activation.

Hosted activation is pinned to Vercel project `prj_5f4HqMGoSablRWqH8HQGs4rvlwU1`, origin `https://caremetrics-staging.vercel.app`, Neon database `caremetrics_staging` on the reviewed staging endpoint, branch label `staging`, and organisation `20000000-0000-4000-8000-000000000001`. Both server acknowledgements (`CAREMETRICS_DEPLOYMENT_KIND=fictional-demo`, `CAREMETRICS_DEMO_DATA_ACK=fictional-records-only`) and the database marker are required. Ordinary deployments fail closed even if a client submits a forged mode flag. Automated tests have a separate localhost-only, non-production `local-test` guard. Legacy fixture acknowledgements remain forbidden in hosted production.

Proposed explicit policy JSON for Stage C review (same limits as existing fictional development fixtures; deployed only after verified Stage C cleanup):

```json
{"mode":"GPS_LOCATION_RECORDED_DEMO","organisationId":"20000000-0000-4000-8000-000000000001","version":"demo-academic-v1","approval":"fictional-demo","enabled":true,"maxAccuracyMetres":30,"maxAgeMs":60000,"maxFutureSkewMs":0,"earlyWindowMs":600000,"lateWindowMs":3600000,"retentionDays":7,"clockOutMode":"NO_LOCATION_REQUIRED"}
```

The early window is ten minutes before scheduled start; late window is one hour after start, strictly before shift end. No distance is assessed in this mode. No policy values originate in a query, local storage or browser flag. A currently eligible assigned fictional shift must be created through authorised scheduling; old shift dates are not rewritten by deployment or polish.

## Collection, evidence access and map behaviour

The existing `getCurrentPosition` wrapper requests one fresh fix (`maximumAge:0`, high accuracy) only after the employee chooses Clock In and accepts its explanation. It never uses watchPosition or an automatic Dashboard effect. Permission denial displays exactly: “Location permission is required to record GPS-assisted attendance. Please enable location access and try again.” Success displays “Clocked in — GPS location recorded.” Browser-reported GPS/Wi-Fi/network location is spoofable and is not proof of physical presence; production geofence policy remains Future Development.

Precise evidence is fetched only on “View GPS location”, through authenticated private/no-store endpoints `/api/attendance/[id]/location` and `/api/admin/attendance/[id]/location`. Own employee or authorised same-org management only; malformed IDs, unrelated staff/management and anonymous requests fail closed. A shared PostgreSQL HMAC bucket limits an authenticated actor to 60 evidence reads/minute (429 thereafter), reusing the existing counter infrastructure without storing plaintext identity/location. Ordinary history and audits contain no coordinates.

The view shows employee/house, server clock-in, measurement time, reported accuracy, expiry and coordinates. It loads Leaflet/OSM tiles only after the separate “Load location map” action and privacy explanation. The pin is a static local SVG; attribution remains visible. Tile URLs contain integer map tile indices, not exact latitude/longitude query parameters. Referrer is origin-only, normal HTTP tile caching is respected, and there is no service-worker/offline tile cache. Approximate tile-area disclosure and the viewer's network address are inherent in third-party mapping; the coordinates-only option is available without it. Failed/blocked tiles retain the correctly committed attendance.

Every location read checks server expiry, and the mounted client erases coordinates/unmounts its map when its server-derived remaining duration ends. Returning from a backgrounded view triggers an authenticated reload. Expired views show: “Detailed GPS location is no longer available because the retention period has expired.” No browser storage is used for evidence. Information an authorised viewer previously copied or captured cannot be recalled.

## Exact presentation plan and populated-data procedure

`prisma/demo-polish-plan.ts` is the complete allowlist: **6 employees, 4 clients, 4 contacts and 3 houses**. Read-only staging inventory confirmed those IDs/guards/current labels; no live dry-run/apply was performed. Mappings:

| Existing label | New fictional label |
| --- | --- |
| Avery Example | Avery Thompson |
| Morgan Fiction | Morgan Bennett |
| Robin Sample | Robin Walker |
| Casey Example | Casey Mitchell |
| Alex Fiction | Alex Sullivan |
| Fictional HTTPS f8b96d28 (employee) | Jordan Morris |
| Sam Example | Sam Parker |
| Lee Sample | Lee Wilson |
| Drew Fiction | Drew Collins |
| Fictional HTTPS f8b96d28 (client) | Olivia Bennett |
| Fictional NOK for Sam / Lee / Drew | Taylor Parker / Jamie Wilson / Riley Collins |
| Fictional staging NOK | Ethan Bennett |
| Harbour Example House | Harbour House → house-1 |
| Meadow Sample House | Meadow House → house-2 |
| Fictional HTTPS House f8b96d28 | Kowhai House → house-3 |

All login emails, passwords/hashes, roles/status/session versions, IDs/codes/references, addresses, assignments, contacts' relationships, historical author IDs/timestamps, templates/versions, submissions, attendance and audits are preserved. SQL updates only exact display-name fields, the three house image keys and the operator-only fictional classification. Current author display labels resolve from the newly named profiles; immutable author IDs remain unchanged. Unknown records are not renamed; changed/unexpected guard values abort the transaction. No runtime build/deploy/registration path imports this script.

After **separate Stage B approval** and migration review/application against verified fictional staging:

1. Run `node --import tsx scripts/polish-demo-data.mjs /Users/jeshurun/.caremetrics/staging/target.json` (default dry-run). Review all 17 rows and preservation counts/hashes.
2. Only after that report is reviewed, run the same command with `--apply` and private operator acknowledgement `CAREMETRICS_DEMO_POLISH_ACK=approved-fictional-staging-polish`.
3. The serializable transaction compares full-table protected-field hashes/counts before/after and rolls back on any unintended change. SQL preserves updatedAt timestamps and never rewrites history. Repeating it is idempotent.
4. Re-run the dry-run and historical author/history/session checks. Securely retain operator reports; do not commit private maintenance credentials.

Fresh seed creation uses polished names, exact stable IDs, the fictional marker and first two house image keys. Existing upserts retain `update:{}`; **never run seeding against the populated staging database**. Existing third house and Admin-created profiles are handled exclusively by the explicit polish plan. Stable local avatar mappings are presentation metadata, not access decisions. Staff client cards, profiles/search, employee identity/profile, Admin directories/details/header and portrait-bearing roster cards use existing component positions. Initials/unavailable-image fallbacks remain. [Image credits](demo-image-credits.md) document creators, verified licences and crops. Combined three 1200×720 WebPs are about 424KiB; each illustration is under 1KiB; assets are same-origin and contain no real identity information.

## Stage A evidence and remaining acceptance

Local PostgreSQL tests use an owned temporary cluster, apply all nine migrations, seed twice and destroy only that cluster. The new tests exercise far-away/current position acceptance without house coordinates, missing/invalid/stale/future/inaccurate location rejection, cancelled/early/late/ended/other-owner/other-org/inactive/revoked/unassigned/inactive-house rejection, duplicate/exact retry and conflicting retry, atomic evidence/audit rollback, own/management/cross-tenant evidence access, expiry boundary, execute-only purge, physical coordinate nulling, preserved attendance/audits, early-erasure/edit/restore denial and evidence-required commit constraints. Existing house-verification and clock-out tests still pass.

The exact polish rehearsal creates only four extra disposable fixture records, proves dry-run makes no change, applies twice and compares all protected table hashes; an unexpected identity aborts. It removes only those temporary unreferenced fixture records. Hosted records are untouched.

Focused real-auth browser checks cover 390px Staff login→My Shifts→Dashboard without clock-in, one simulated current-position request, far-away demo commit, fresh evidence read, explicit map consent and tile-failure handling, refresh, clock-out, avatars/photos, visible house name/address and no Dashboard horizontal overflow. Admin at 1280px verifies distinct house photos/details and client portrait. Automated coordinates and blocked tile responses are fixtures, **not actual GPS or successful external tile delivery**. Physical GPS/permission-success/map pin accuracy on REDMAGIC is pending Stage D; previous device permission-denial and APK acceptance remain historical Phase 2J evidence.

The installed TWA reads the same HTTPS origin, so hosted-only changes are expected to work without a wrapper rebuild. This remains a compatibility expectation until phone verification. No new APK was built/signed; the existing 1.0.1/build2 checksum, signing identity, application ID and encrypted Jet backup are preserved.

## Local working environment

The root `.env.local` still points to the earlier development database with eight migrations; it was not overwritten, migrated or reseeded. Do not point the new schema-dependent source at that old database and expect it to work. The reproducible Stage A path is the owned disposable local cluster below; a normal long-lived connected development session needs its own isolated database with all nine migrations. Missing schema/configuration fails closed rather than falling back to prototype data.

```sh
# Node 22.18+ / <23; PostgreSQL initdb/pg_ctl/createdb on PATH
CAREMETRICS_TEST_SERVICES_ONLY=true pnpm test:backend:local
CAREMETRICS_TEST_DEMO_GPS=true CAREMETRICS_BACKEND_TEST_GREP='demo polish|Admin photographs' pnpm test:backend:local
```

These commands create only a temporary localhost database, generate private random test credentials, run migrations/twice-seeding/services and optionally real-auth browsers, then remove their own cluster. They do not use or modify the root environment's Neon database. A generic all-browser run should omit the demo flag; the focused new demo suite intentionally requires it.

## Stage A verification — 27 October 2026

| Check | Result |
| --- | --- |
| `pnpm lint` | Pass, zero ESLint warnings/errors |
| `pnpm typecheck` | Pass, regenerated Prisma/Next route types and strict TypeScript |
| `pnpm format:check` | Pass, 520 authored code files |
| `pnpm db:validate` | Pass |
| `pnpm test` | **545 passed**, 24 files |
| Disposable nine-migration PostgreSQL / twice-seed / services | **289 passed**, 9 files |
| Focused real-auth demo browser suite | **2 passed, 4 skipped**: 390px Staff and 1280px Admin; other viewport cases deliberately gated |
| Shared functional preview regression, once | **544 passed, 126 skipped**, widths 375/390/768/1280/1440; `CAREMETRICS_SKIP_REFERENCE=true pnpm test:e2e --grep-invert 'capture\|source compar\|visual comparison'`; screenshot-comparison cases excluded rather than regenerating source collections |
| `pnpm build` | Pass, Next.js 16.3.8 webpack production build |
| `pnpm test:production` | Pass: 141 preview routes refused, 27 read/auth and 17 mutation API probes fail closed; 20 unknown/deferred APIs JSON404/no-store; manifest/icons/association/security headers pass |
| Source/client secret checks | 713 authored text files clear of 9 private values; 147 built client assets clear of 10 distinct private values; values never displayed |
| Staging preservation | Read-only snapshots: all 15 table counts/full-row hashes unchanged, including credentials, assignments, history, templates and audits |
| Academic/APK/CSS preservation | All 465 academic manifest hashes unchanged; original three CSS copies byte-identical; working APK SHA256 unchanged |
| Git whitespace | `git diff --check` passes |
| New hosted deployment / physical Android GPS | **Not performed / pending approval and retention operation** |

Staging remains Neon project `twilight-credit-01101322`, branch `staging` / `br-plain-paper-a70wmny8`, database `caremetrics_staging`, with **8 migrations, 6 users, 3 houses, 4 clients, 4 contacts, 5 employee-house assignments, 3 shifts, 2 Diary entries, 2 Care records, 1 template/version/assignment, 11 audit events and 0 attendance records**. There is no historical precise GPS evidence in this staging dataset to hash. No production database was modified. Live names are still their old labels until approved Stage B; the new labels currently exist only in fresh local tests and the explicit update plan.

Initial checks found stale seed-label assertions, a composite-key snapshot ordering error, browser selectors targeting hidden desktop elements/normalized URLs, a formatter issue with inline multi-field TypeScript types and a duplicate attendance-dialog key. These were corrected and the relevant checks passed afterwards. The final preview run logged one Next development “destination stream closed early” message during navigation without a failed test; backend runs retain the existing pg8 overlapping-query deprecation warning. These are not physical-device proof or production-readiness acceptance. Final browser expiry display uses an explicitly mocked expired API response; real database expiry/purge is independently exercised by the PostgreSQL tests.

### Next approvals

Stage B proposal: verify the exact fictional staging target again, apply only the reviewed ninth migration, produce/review the default dry-run for the 17 exact presentation records, then apply only those mapped labels/image keys and the operator fictional marker with protected-field hashes/counts verified. No reset/reseed, credential/role/ID/history rewrite, new paid resource, hosted deployment or GPS activation is included.

Stage C remains separate: choose and verify a suitable authenticated purge scheduler and minimum-privilege credential; review its execution lag/backlog/backup limits; set the exact proposed server policy and dedicated-demo environment only after that works; deploy to the existing stable origin and reverify Auth.js/permissions/data privacy. Then Stage D can collect actual phone GPS and verify persistence/map/clock-out/denial on REDMAGIC10Pro. No APK rebuild is presently indicated by the web-only implementation, but actual compatibility is not yet claimed.


## Stage B fictional staging integration results

The user's “I have top up my credit, we can continue the task at hand” reply followed the explicit Stage B proposal. It was treated as approval for that bounded migration/presentation operation, not approval for paid services, a new deployment, GPS activation or APK signing.

Target reverified using Neon CLI and direct TLS database reads:

- Existing project `twilight-credit-01101322` / `caremetrics-staging`, Free, Sydney, PostgreSQL18.
- Existing branch `staging` / `br-plain-paper-a70wmny8`; direct endpoint remains `ep-silent-scene-a79j4tw3.ap-southeast-2.aws.neon.tech`; database `caremetrics_staging`.
- All 15 original table counts/full-row hashes matched the Stage A preservation snapshot before mutation; checksums of all original eight migration files matched the applied records.
- Created only one temporary rehearsal branch, `gps-demo-stageb-rehearsal` / `br-holy-moon-a7svhqgq`, from the fictional staging dataset. Endpoint `ep-ancient-math-a746phth.ap-southeast-2.aws.neon.tech`, fixed minimum0.25CU, inherited account auto-suspend. Expiration **2026-10-27T23:53:00Z**. No project/plan upgrade, no app environment change. It contains only the existing fictional dataset; credentials were stored privately and never printed.

The reviewed ninth migration was applied first to that child. Every original data/credential/history hash remained unchanged before the polish. The exact 17-row dry-run/apply/repeat rehearsal preserved all protected fields/counts and was idempotent. No new GPS attendance was inserted during the rehearsal.

Before staging migration, a private custom-format `pg_dump` backup was written, SHA256-receipted and its141-line restore index parsed successfully. The first dump failed because libpq's default `~/.postgresql/root.crt` was absent; it produced an empty backup and the migration did not run. The successful retry uses the installed trusted CA bundle with **sslmode=verify-full**. The failed empty file is retained separately; the successful backup is `~/.caremetrics/staging/gps-demo-stageb/staging-before-gps-demo-v2.dump`, owner-only. This is a verified export/checksum/index, **not a claim that a full backup restore was rehearsed**. The Neon child migration/polish rehearsal is separately verified.

Prisma then applied only `202610270009_gps_recording_demo` to staging. The same original rows and old migration checksums remained unchanged after additive schema changes. `AttendanceLocationEvidence` was empty. The populated database was not seeded/reset.

The staging polish default dry-run exactly matched the rehearsed17 mappings and all protected-field snapshots. The first intended apply command omitted `--apply` and consequently remained a harmless dry-run; its assertion caught this. The corrected explicit `--apply` transaction completed. Afterward all17 rows reported `alreadyApplied=true`, and all16 protected table counts/hashes matched. Only display names, three image keys and the operator fictional marker changed. No passwords/emails/roles/status/session versions, IDs/references, timestamps/relationships, submissions/templates/versions or audits changed.

Actual hosted checks against the **existing** website then passed:

1. Anonymous `/api/me`401.
2. Original Robin Staff and Avery Admin login credentials accepted; secure/HttpOnly/SameSiteLax Auth.js cookies; unchanged IDs/emails; display labels Robin Walker/Avery Thompson.
3. Staff Login→My Shifts→Dashboard without clock-in; natural house/client/NOK labels resolve from current records.
4. Unrelated client404 and Staff access to Admin403.
5. Existing Diary/Care history readable; both original author IDs join to Robin Walker, with original record hashes/timestamps preserved.
6. Admin Employee Directory and existing Diary/Care history readable.
7. GPS clock-in remains `available:false`, `POLICY_UNAVAILABLE`. The new mode is not activated.
8. All9 completed migrations present, precise evidence0, attendance0, Diary2, Care2, audit11. Purge function is SECURITY DEFINER with no PUBLIC EXECUTE.
9. Post-login domain/auth/history/assignment snapshots still match. The tests change only the expected existing LoginAttempt throttle counters; they do not call logout/revoke or change User.sessionVersion.

Current counts: users6, houses3, clients4, contacts4, assignments5, shifts3, Diary2, Care2, template1/version1/assignment1, audit11, attendance0, location-evidence0, migrations9. All17 mapped names/image keys are applied. The old website immediately reads the new database display labels; the new illustrated-avatar/photo/map components are not hosted yet.

Vercel inspection confirms the unchanged READY deployment `dpl_6yHqi8fcW9MgshGbyMmBARUhysJ1` on the same public origin. Root `.env.local`/`.neon`, earlier development data, source reference/CSS, academic folder/ZIP, APK, signing identity and Jet backup were not changed. No new source was pushed. The current Git work remains local on `gps-demo-and-visual-polish`, based on pushed `phase-2j-complete` / `1094517`.

Private receipts are under `~/.caremetrics/staging/gps-demo-stageb/`: clone/migration receipts and logs, backup receipt, staging dry-run/applied/after-auth reports and `hosted-verification.json`. They are owner-only, outside source and never bundled. Avoid committing the backup or credentials.

### Historical Stage B scheduler proposal, not yet provisioned at that checkpoint

The original brief requires separate approval before deployment. A five-minute authenticated poll via **QStash Free** would reuse the implemented GET purge endpoint and expiry-only database role. Current official Free allowance is1,000 deliveries/day;288 initial polls/day with at most two retries each is864 delivery attempts/day, leaving136 for other checks **only if no other account workload consumes that allowance**. Verify the actual account plan/quota and stop before paid service/upgrade/charges. No account, schedule, role or credentials were provisioned by Stage B.

The scheduler would receive only the fixed cleanup URL, a cleanup-only bearer secret and count/error responses. It must never receive coordinates, employee identities, database URLs or database passwords. Database credentials stay on Vercel in a separate least-privilege connection. QStash retries count towards usage; configuration must explicitly cap retries at2. Free service has no uptime SLA. Normal physical deletion is at the next five-minute poll after seven-day expiry, plus dispatch/retry delay; outages or exhausted quota can delay physical deletion further. Read-time expiry remains exact and must never be represented as immediate database/backup erasure. This operational limitation is included in the Stage C approval request.

Sources reviewed27October2026: [QStash pricing](https://upstash.com/pricing/qstash), [QStash schedule configuration](https://upstash.com/docs/qstash/features/schedules). No Vercel/Neon paid upgrade was authorised by the user's Codex-credit top-up. Neon Functions/Triggers are not available in the current Sydney project region according to the Neon skill; no new cross-region project is being created as a substitute.


## Stage C hosted retention verification

The user explicitly approved “Stage C with QStash Free” and confirmed the dashboard Free plan. No paid upgrade, DNS change, Git push, APK rebuild or signing change is included. The same public origin remains https://caremetrics-staging.vercel.app.

### Deployed implementation

The reviewed tenth migration, `202610270010_retention_budget_gate`, adds only a fixed aggregate expiry function. It was rehearsed on the existing fictional Neon child and then applied to staging; original domain/history/credential hashes remained unchanged. The dedicated `caremetrics_location_purger` login can execute only the expiry aggregate and expiry-only purge functions. Direct account/attendance/coordinate reads, arbitrary writes and privileged role flags are denied. The fictional organisation guard remains mandatory.

A five-minute database query would prevent Neon Free's fixed five-minute idle suspension. The job therefore uses Vercel Runtime Cache for **non-identifying aggregate expiry/time metadata only**, with a one-hour TTL. Normal polls reuse that metadata; a due expiry triggers the restricted purge and invalidates it. Newly collected evidence expires seven days later, so a normal fresh measurement cannot expire unseen inside that cache interval. Explicitly configured measurement-age limits preserve this bound. Cache eviction may increase database calls; workload/free-quota estimates are not availability or billing guarantees.

The cleanup GET route requires a strong bearer secret and verifies actual QStash signatures, including body, time and exact destination URL, with current/next signing keys. Operator-only forced metadata refresh additionally requires `x-caremetrics-retention-refresh: 1`; it is not a Staff permission bypass. Unsigned ordinary calls and anonymous access are rejected. Responses are private/no-store and contain only a purge count. `@upstash/qstash` 2.12.1 is pinned for the official Receiver; the operator QStash token is never installed in the app environment.

Source snapshot: 659 files, SHA-256 manifest digest `d0cf5f6d441a249ac5b3b78f96bfb6d7d0325fbb641cabd6b3c7b1060d5a6260`. Initial new deployment `dpl_7cQmkX6WAmoC2T37fWyCsvAjtoeQ` passed hosted Staff/Admin login, mobile photo/avatar, historical Diary/Care, scope denial, no-overflow and cleanup maintenance checks. Signed-cleanup configuration deployment `dpl_6D1YF7gzERGwBCsnHQP8wa7NzQVC` is READY on the same alias. After automatic deletion passed, the exact demo policy was added and deployment `dpl_7ZhF7Y2FDFX32pn3YJ4BbSD77JLe` became READY on the same alias (52-second Vercel build). Recording-only policy is now active only for the pinned fictional organisation. The original `dpl_6yHqi8fcW9MgshGbyMmBARUhysJ1` remains the prior rollback iteration.

### Schedule and verification

EU schedule `caremetrics-staging-location-retention`: GET every five minutes (`*/5 * * * *`), two retries, 30-second timeout, request headers/body redacted from provider logs. With one schedule, 288 initial polls/day and at most two retries each use at most864 attempts/day, before acceptance requests/other workload, under the published1,000/day allowance. Initial account inspection found no schedules. A separately published, zero-retry signed acceptance delivery reached DELIVERED. Scheduler secrets are stored owner-only outside the repository and in scoped sensitive Vercel variables; no values are recorded here.

For automatic erasure verification, an inactive, explicitly SYNTHETIC test organisation was created in the already isolated fictional staging database. It has an inactive account with no password, inactive house, synthetic shift/attendance/audit and synthetic 0,0 coordinates, never represented as phone GPS. Its measurement is seven days before a near-future expiry. A maintenance refresh **before** expiry cached the upcoming deadline and purged zero rows. The next scheduled delivery after expiry must clear coordinates; no manual purge is used to claim automatic success. Original application rows/credentials and synthetic attendance/audit hashes are separately checked. This test metadata is retained instead of deleting immutable history. **Automatic deletion passed:** expiry `2026-10-27T01:10:01.799Z`; physical coordinate NULLing `2026-10-27T01:15:00.795Z`, on the successful scheduled delivery. No manual after-expiry purge was called. Both coordinates are NULL, purge time is after expiry, and synthetic attendance/audit hashes match. Actual Staff access to this other-organisation fixture returns404.

### Current verification and remaining work

- Unit tests:551 pass across25 files. Disposable PostgreSQL:289 pass across9 files with all10 migrations and repeat seeding.
- Lint, strict TypeScript, formatting523 files, Prisma validation, production build and production HTTP isolation pass. The exact isolated upload snapshot also builds successfully.
- Final upload scan:659 source hashes and147 fresh production client assets;19 private values absent (values withheld).
- Existing full functional preview result remains544 pass/126 gated skips; focused new real-auth browser suite2 pass/4 gated skips. No unnecessary full rerun after server-only cleanup changes.
- Public Digital Asset Links, the stable origin and existing 1.0.1/build2 APK remain unchanged. The RedMagic is now connected/authorised; physical success/map/persistence/clock-out acceptance remains pending. Actual denied permission handling passed independently.

Physical coordinate deletion normally occurs at a poll after expiry, plus dispatch/retry lag; outages or exhausted quotas can delay it. Reads enforce exact seven-day expiry independently. Provider backups/PITR are separate and are not instantly erased by coordinate NULLing. This fictional academic demonstration is not approved organisational attendance or real-care-data processing.


## Stage D physical Android acceptance — completed, with earlier checkpoints below

Connected REDMAGIC10Pro / Android16, existing APK1.0.1/build2, Brave renderer Chromium155.0.8059.85. Initial USB debugging required owner approval. The first launch showed a browser toolbar; Android association remained verified and the public association file matched the installed certificate/package. Closing only the CareMetrics custom tab and relaunching restored secure standalone presentation without a native/package/key change.

Actual374px Dashboard and Client Profile checks pass: Robin/Sam display names, distinct local SVG portraits, loaded1200px house photograph, fictional-record banner and no horizontal overflow. Original465 academic hashes, signed APK checksum,51 export source files and three CSS copies were reverified unchanged. Current717 authored files and147 fresh client assets pass secret checks against19 private values.

Robin is the only active Staff account. The existing08:00–16:00 shift was outside the explicit one-hour late window; other Staff accounts remain INVITED. The user explicitly chose audited cancellation/replacement instead of changing policy or waiting until15:50. Authenticated Avery Admin API cancelled only shift `20000000-0000-4000-8000-000000000051`, retaining its ID/dates and cancellation history, and created Robin/Harbour14:15–16:00 Pacific/Auckland with an academic test note. Two ordinary audit entries were added. No invited account was activated and no credential, house assignment or policy limit was altered.

The preservation comparison initially detected the intentionally approved shift/audit delta. Reconciliation verifies all original rows/hashes after accounting for only that cancellation’s status/update timestamp, one newly added shift and its two audits. This is a read-only comparison; it does not restore/rewrite cancelled history. The original attendance/Diary/Care/templates/accounts/relationships remain preserved.

Fresh actual-phone login reached eligible My Shifts. Existing genuinely denied site permission was exercised by tapping Clock In then Use current location. The actual browser method returned permission error1, the exact required denial message appeared, one getCurrentPosition call occurred, no position was returned and no watchPosition ran. PostgreSQL confirms no attendance for that shift. Test instrumentation only observes and forwards original browser methods; it does not fabricate coordinates, override permission or change application/server policy.

At this earlier checkpoint, permission reset and genuine collection were pending. The owner subsequently confirmed the reset; final physical results follow.


## Completion and operating handover

**Stages A–D are complete for the focused fictional academic demonstration.** Live origin: https://caremetrics-staging.vercel.app. Current deployment: `dpl_7ZhF7Y2FDFX32pn3YJ4BbSD77JLe`. It is the reviewed659-file source snapshot and approved server-only demo environment; local handovers were updated after upload. No APK rebuild was required: installed1.0.1/build2 works with the hosted changes and its checksum/signing identity/package are unchanged. No new source commit/push was performed. Work remains on `gps-demo-and-visual-polish`, based on preserved/pushed `phase-2j-complete` / `1094517`.

### Genuine Android result

The owner reset location permission; the next request observed browser permission granted. The agent used the actual Clock In → Use current location UI on the real RedMagic, forwarding original browser methods without mocked positions or permission overrides. One actual measurement returned with reported accuracy approximately13.24m, within the explicit30m demo limit. Server confirmation displayed exactly “Clocked in — GPS location recorded.”

- Server clock-in: `2026-10-27T01:21:40.232Z` (14:21:40 NZDT).
- Clock-out: `2026-10-27T01:28:13.024Z` (14:28:13 NZDT).
- Exact measurement-based expiry: `2026-11-03T01:21:37.921Z`. Coordinates are intentionally omitted from this handover, chat, source and ordinary logs. Private receipts are owner-only outside the repository/upload.
- Original phone latitude, longitude, accuracy and measurement timestamp exactly match PostgreSQL and the authorised private own-evidence response. Expiry is exactly168 hours after measurement. The new record is explicitly `GPS_LOCATION_RECORDED_DEMO`, not verified at the house.
- Actual location-details consent reveals the retained coordinates/accuracy/times. Map is initially absent. Explicit Load location map renders one pin with real loaded OpenStreetMap tiles and attribution, without horizontal overflow. No location screenshot was taken.
- Refresh preserves the same attendance ID and exact evidence; map consent resets instead of loading third-party tiles automatically.
- The actual phone Clock Out → Confirm clock out UI committed `NO_LOCATION_REQUIRED_DEMO`. Original clock-in/evidence fields remain identical, with exactly one clock-in and one clock-out audit. Normal own/Admin attendance history and audit summaries contain no coordinates.
- One getCurrentPosition and zero watchPosition calls were observed through initial collection/map use. An initial refresh observer did not install because the test helper had not enabled the CDP Page domain; the real clock-out had already committed before that observer assertion failed. The helper was corrected and independently verified a fresh monitored reload and Dashboard with zero further location/watch calls. **Do not claim that failed observer directly counted the earlier clock-out action**; its no-location policy/code and unchanged evidence were checked separately. No duplicate clock-out was submitted.
- The earlier genuine denied permission test showed the exact required message, error1, one request, no returned position, no watcher and zero PostgreSQL attendance.
- Final phone screen is Dashboard in secure standalone mode; temporary observation scripts were removed/restored. The actual wrapper/provider/identity remain unchanged.

Only one physical device/provider was accepted; this is not an all-Android/browser compatibility claim. Browser GPS can be spoofed and does not establish physical presence. House geofence enforcement, approved organisational scheduling/attendance policy and real-care privacy/security approval remain Future Development.

### Hosted permissions and preservation

Final real Admin login sees the exact retained evidence in the existing1280px desktop details drawer and the completed attendance. Anonymous own/Admin location reads return401; the actual Staff session receives403 at the Admin location endpoint; Admin access to the separate synthetic organisation returns404. Earlier Staff unrelated-client404 and other security checks remain passing.

All10 applied migration checksums match source. Original organisation counts: users6, houses3, clients4, contacts4, assignments5, shifts4, attendance1, evidence1, Diary2, Care2, template1/version1/assignment1, audit15. Relative to the original dataset: one explicitly approved cancellation, one new shift, one genuine completed attendance/evidence and four audit additions. The old shift ID/dates/history are retained. All original protected rows/full-row hashes match after accounting only for those authorised deltas. Original credentials, roles, IDs, relationships, Diary/Care records and immutable published version are preserved. Login throttle counters legitimately changed during real-login tests.

The inactive synthetic retention tenant is separate from these counts and inaccessible to normal Staff/Admin scope. Its test attendance/audit metadata remain; both synthetic coordinates were physically cleared by the scheduled job. Do not represent that synthetic fixture as physical GPS.

Latest final checks:551 unit tests/25 files;289 database tests/9 files with10 migrations; lint, strict typecheck, Prisma validation, format523 files, production build and HTTP isolation all pass. Shared functional preview remains544 pass/126 gated skips; focused real-auth presentation browser suite2 pass/4 gated skips. Additional hosted and physical checks above pass. The source snapshot builds independently and Vercel's final build completed in52 seconds.717 current authored files,659 upload hashes and147 fresh client assets passed scans against21 private credential/actual-coordinate values (withheld). All465 academic hashes,51 original export files, three CSS copies and the signed APK checksum remain unchanged.

### Operations and safe rollback

QStash EU Free schedule `caremetrics-staging-location-retention` remains active at five-minute intervals, two retries,30-second timeout. Signed scheduled deliveries continued successfully after GPS activation, with no recent errors in the inspected provider events. The account had no pre-existing schedules and the owner confirmed Free. Token stays operator-only; Vercel holds the cleanup bearer, current/next signature keys and restricted database connection as sensitive server variables. No billing upgrade, DNS change or signing operation occurred.

Inspect Upstash schedule delivery states/DLQ and Neon/Vercel free usage during the demonstration. No separate automated alert/incident-response service or availability SLA is established. Cache eviction, heavy traffic, quotas, outages and retries can affect resource use/deletion delay. Read-time expiry is enforced on every evidence read; physical erasure normally follows the next poll. Provider PITR/backups are separate and not instantly erased by SQL NULLing. The seven-day path was tested locally and through a near-expiry hosted synthetic fixture; it was not verified by waiting seven real days for the new phone record.

If recording needs to stop, use the GPS-disabled **cleanup-capable** deployment `dpl_6D1YF7gzERGwBCsnHQP8wa7NzQVC` or an equivalent reviewed configuration. Keep its pinned demo acknowledgements, role credentials, signing keys, fictional marker and QStash schedule until all retained coordinates have expired/been purged. **The historical Phase2J deployment lacks this cleanup route; switching the live alias to it would break scheduled erasure.** Do not treat preservation of that old iteration as a safe unattended retention rollback. Do not remove the fictional scope guard or erase precise evidence early to work around it.

Root `.env.local`/`.neon` still target the older development database; they were not overwritten or migrated. For local development, continue using the disposable test workflow or explicitly provision/migrate a separate development branch through all10 migrations. No populated database reset/reseed, real-care-data import, academic repackaging, reference rewrite, APK overwrite, key rotation or USB-backup modification was performed.

Recommended next step: review this focused demo checkpoint and create/push its Git checkpoint only when requested; rehearse the installed app and monitor the live retention schedule. Resume broader backend/production work under a separately bounded brief.
