# Phase 2I — Android/PWA readiness and deployment handover

This is an online-only, fictional-data deployment candidate, not physical Android acceptance or approval to process real care information. No hosting, DNS change, APK, signing key, asset-links file, push, schema migration or Phase 2J execution was performed.

## 1. Checkpoint and preserved material

Phase 2H was checked against its 512-file frozen source manifest, then committed locally on `phase-2h`: **bbe9863c6655463133fe0bfcf5c79b18e0fc8e6f**. Work was developed on `phase-2i`; the subsequently authorised GitHub checkpoint uses `phase-2i-complete`. Earlier branches remain. Reference source is excluded from Git as previously requested; 50 pre-existing duplicate screenshots are untouched. The academic `CareMetrics-Submission` folder and `CareMetrics-Source-Code.zip` remain separately frozen under a 465-file SHA-256/inventory manifest. Original CSS and Figma reference are unchanged. [Archived Phase 2H status](history/phase-2h-status.md) retains the previous report.

## 2. Manifest and artwork

Next.js 16.3.8 App Router metadata conventions are used in `src/app/manifest.ts` and root layout metadata. Public URL: **`/manifest.webmanifest`**. Stable `id`, `start_url` and scope are `/`; display is standalone, language en-NZ, app/launcher name CareMetrics, theme `#1a6b7a`, background `#f4f6f9`. No session identifiers or selected client URLs enter the manifest. A single origin includes Staff and Admin; Admin remains desktop-gated.

`public/icons/caremetrics.svg` adapts the existing approved pulse path from `src/components/Icon.tsx` / LoginView and existing brand colour. Four PNGs provide 192/512 sizes for `any` and `maskable` purposes. Both purposes intentionally use the same solid canvas and inset mark, within the maskable central safe circle. Dimensions, PNG signatures and HTTP paths are tested. Root icon/apple metadata references the 192 icon. `node scripts/generate-app-icons.mjs` reproduces PNGs using the existing Next-installed sharp dependency; no new dependency or stock branding. No fonts were copied.

Viewport metadata retains device width, initial scale 1 and zoom accessibility, adds the brand theme and requests `interactive-widget=resizes-content` where supported. No broad CSS/layout changes were made.

## 3. Installability decision

No service worker, fetch handler, caching library, install-prompt library, push subscription or background sync is introduced. Chromium documents menu installation without a fetch service worker; automatic promotion varies by browser/version and engagement. This is manifest readiness for an online application, not a guaranteed install prompt, Lighthouse score or tested WebAPK/TWA install. A hosted HTTPS origin and physical browser acceptance are still required. Native offline browser failure is expected on a cold offline launch.

Sources reviewed 26 October 2026: [Chrome installability changes](https://developer.chrome.com/blog/update-install-criteria), installed Next.js PWA/manifest/headers guides, [Android TWA overview](https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities), and [Android TWA quick start](https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2). The older Chrome article distinguishes menu installation from prompt experiments; do not use it to promise automatic promotion on every current Android device.

## 4. Launch and authenticated sessions

The root server entry checks current Auth.js/database identity. Signed-out users reach Login; active Staff/Senior reach My Shifts; active management reach Admin Dashboard. The existing successful Login → My Shifts → Dashboard sequence remains, including Continue without clock-in. Management signing in through Login can use the existing Administration link. Root launch does not accept browser roles, callback URLs or local-storage identity.

Auth.js retains an eight-hour JWT session with HttpOnly, SameSite=Lax cookies; HTTPS configuration enables secure cookies and secure cookie names. Every protected operation rechecks account/organisation state and session version. Logout increments the employee session version, invalidating copied old sessions. Same-origin Auth.js handlers validate AUTH_URL and POST Origin, preserve CSRF handling, and discard browser proxy-host metadata. `trustHost: true` remains bounded by those existing checks; this phase does not loosen them. Expired/revoked page access returns Login and APIs return 401. Database failures return unavailable, not preview data.

Normal mobile navigation/refresh and a fresh browser context with existing cookies are automated checks. Installed standalone launch, actual process restart, browser cookie sharing and Android Back/external-link handling remain device tests. TWA uses a browser, not a bundled database or a static copy of Next.js.

## 5. Online-only and cache safety

Authenticated layouts are dynamic. API/auth responses retain private/no-store. Global response headers add `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` and `Permissions-Policy: geolocation=(self), camera=(), microphone=()`. Next dev can override page cache headers to `no-cache, must-revalidate`; production probes require `no-store`. Next immutable public framework chunks are not protected data. Public manifest/icons contain branding only.

In database mode, server HTML starts document-shielded, including streamed siblings. OnlineOnly unmasks Login after hydration; protected documents first make a fresh no-store /api/me check. Offline events hide application content and show an unavailable state; reconnection reloads. Synchronous page-exit shielding and persisted pageshow checks prevent offline Back from revealing the previous client after logout in automation. The initial document shield also covers restored HTML whose scripts cannot load offline. JavaScript and a connection are required, with a non-sensitive noscript explanation. This supplements HTTP policy; it cannot erase screenshots, all browser memory or information a person already saw. No Cache Storage, IndexedDB, local-storage form persistence, offline care data or queued submissions is added. Existing isolated preview sessionStorage opt-in remains development-only.

Offline during submission does not mean the server rolled back: a request may have committed before disconnection. The unavailable state explicitly instructs checking history before retrying. Reconnection is a fresh request, not automatic mutation replay. Existing online uncertain-response retries preserve their exact idempotency key while mounted. Unsaved nonpersistent forms may be lost during a network reconnection reload. Offline support remains Future Development; do not enable Next offline action retries or service-worker caching as an APK shortcut.

## 6. Final route/capability inventory

This supersedes early UI-only classifications in [route map](route-map.md). All 43 registered page files were inspected; existing API handlers expose only implemented services. Page groups below include every registered family, with subviews distinguished so adjacent completed features remain usable.

| Route family | Database-mode availability |
| --- | --- |
| `/`, `/login` | Trusted launch redirect, real Login/sign-out; recovery/registration remain unavailable |
| `/shift-check`, `/dashboard` | My Shifts, own schedule/context, Dashboard; clock-in/out only under explicit server policy; dashboard access never requires attendance |
| `/houses`, `/houses/[id]` | Assigned houses, overview/current clients; House Diary, Files, notices/concerns tabs deferred |
| `/houses/[id]/diary/new` | Authenticated Future Development, no house record loaded or write enabled |
| `/clients/[id]` | Authorised overview/NOK, real Client Diary and Care Plan history/details; Charting/Gallery deferred |
| `/clients/[id]/diary/new`, `/clients/[id]/records/new` | Existing real Diary/assigned Care forms; unsupported draft/correction/upload actions disabled |
| `/search` | Authorised house/client search |
| `/roster` | Own/team schedule and own attendance history (`timesheets`); correction/full approval unavailable |
| `/profile`, `/settings` | Own profile read; editing/photo/account settings unavailable; Settings Future Development |
| `/leave`, `/notifications` | Authenticated Future Development; no operational service |
| `/admin`, `/admin/dashboard` | Management entry and implemented management links; no synthetic dashboard metrics |
| `/admin/employees`, `/new`, `/[id]`, `/[id]/edit` | Real directory/details/create/edit/status/house assignments with role restrictions; credential provisioning/recovery and advanced workforce tabs deferred |
| `/admin/houses`, `/new`, `/[id]`, `/[id]/edit` | Real details/create/edit/coordinates/relationships; advanced Diary/Files/notices tabs deferred |
| `/admin/clients`, `/new`, `/[id]`, `/[id]/edit` | Real details/create/edit/NOK/transfer; read-only Diary and exact-version Care on client tabs; advanced Charting/files/notices/activity deferred |
| `/admin/roster` | Real scheduling create/edit/cancel and attendance viewing; `timesheets` is read-only attendance, not approval; `corrections` Future Development |
| `/admin/leave`, `/admin/files`, `/admin/settings`, `/admin/reports` | Management-authenticated Future Development |
| `/admin/documentation`, `/templates/[id]`, `/records/[id]`, `/corrections/[id]` under documentation | Legacy full builder/review directories Future Development; existing real client-tab Diary/Care reads remain available |
| `/admin/notifications`, `/new`, `/[id]/edit`, `/admin/concerns/[id]` | Management-authenticated Future Development |

Payroll has no registered real page/API. Gallery removal, uploads, official delivery, advanced reports/audit UI and correction approvals have no real mutation service. Full preview interfaces are retained unchanged in explicit development preview. Real-mode generic deferred pages resolve no guessed record data, making their displayed message independent of guessed IDs.

## 7. Server gates

Existing `requireCapability` is the central server-controlled allowlist: assigned data, Diary, Care, management core/scheduling/attendance/record reads, Administrator account administration, and separately policy-gated attendance. Unknown/deferred capabilities deny. Server services still enforce current tenant, role, house, client and mutation rules; a capability alone does not grant record access.

`deferredPage` independently authenticates Staff or management and renders the existing styled Future Development component before executing preview-only page code. Nested real tabs keep their authorised parent loaders. Admin remains desktop-oriented; the viewport gate is not authority. Its disabled group is labelled Templates & corrections so the working client-tab Diary/Care reads are not labelled unavailable. No disabled Server Actions exist to invoke (`use server` mutation exports are absent); real mutations are narrow API handlers. Tests directly attempt deferred POST/PATCH/DELETE endpoints and confirm rejection/no audit write. Preview flags, query roles, cookies and browser storage cannot enable real permissions. Existing production-isolation tests remain intact.

## 8. Deployment environment and HTTPS prerequisites

No deployment target is configured by this phase. Use Vercel's server-rendered Next.js/Node runtime with Prisma 7.10.1, pg adapter, existing lockfile and Node 22.23.4 (or separately verified compatible Node22). `npm run build` generates Prisma then builds Next; never `output: export`. Vercel runtime pool attachment already exists. Do not package server credentials into Android.

| Setting | Hosted-candidate requirement |
| --- | --- |
| `CAREMETRICS_BACKEND_MODE` | `database` |
| `CAREMETRICS_UI_PREVIEW` | `false`; production preview is refused regardless |
| `AUTH_URL` | Exact canonical HTTPS origin, no path/query/userinfo; validate final Vercel forwarded-origin behaviour against that origin |
| `AUTH_SECRET` | Unique server-only random secret, at least 32 characters; plan rotation/session invalidation |
| `DATABASE_URL` | Dedicated reviewed environment's pooled Neon URL with verified TLS; runtime only |
| `DATABASE_URL_UNPOOLED` | Same environment's direct URL for reviewed migration job; not a public/client variable |
| `DIRECT_URL` | Legacy direct alias only if needed; do not mix environments |
| `NEON_BRANCH_NAME` | Explicit reviewed target identification, never `phase-2a`/`local-test` in production |
| Seed settings, generated credential paths, GPS/clock-out test acknowledgements/policies | Absent in hosting; never copy development `.env.local` wholesale |
| Blob token | No file service enabled; do not provision merely for packaging |

Production backend configuration now rejects known fictional branch names, seed confirmations/credential paths and attendance test acknowledgements. This is a fail-closed tripwire, not cryptographic proof of branch identity: verify actual pooled/direct endpoints and intended branch in the deployment process. Environment labels alone cannot prove a database is safe. Never add secrets under `NEXT_PUBLIC_`.

Separate Vercel development/preview/production environment values and Neon branches. Review backups, least-privilege runtime/migration roles and data/residency arrangements. Review migration checksums on the target before any authorised apply; no migrations are added here. Final canonical domain, TLS, HSTS, proxy/session response headers, framework cache behaviour and external asset policies must be checked on the real origin. No HSTS preload/subdomain policy or broad CSP is invented here; CSP must account for Next scripts, fonts and map resources before enforcement. Existing Google Fonts/map requests require privacy/licence/availability review.

Geolocation requires a secure context (HTTPS; localhost is a development exception), browser/site permission and server policy. `Permissions-Policy` allows only this origin. HTTP LAN access from a phone is not hosted GPS acceptance. Never disable origin/CSRF checks, remove secure cookies or add a mock location bypass to make packaging succeed.

## 9. Attendance decisions remain outstanding

Production clock-in/out remain disabled under both NODE_ENV and VERCEL_ENV production. No radius, accuracy, freshness, clock-in window, boundary uncertainty, retention or clock-out location requirement was selected. The development test acknowledgement is not organisational approval. Event-only `getCurrentPosition`, server distance/accuracy/timestamp/ownership validation, request idempotency and no raw coordinate columns are preserved. No continuous tracking or additional Android background permission is requested. Existing development test policies run only in guarded isolated tests.

## 10. Phase 2J Android packaging plan — instructions only

First obtain explicit deployment/packaging authorisation and a stable reviewed HTTPS origin. Suggested application ID **`nz.co.caremetrics.staff`** is provisional and must be confirmed for ownership/uniqueness before generating a project. Name CareMetrics; Staff is primary; Admin remains desktop-only. Use increasing Android versionCode and human-readable versionName, recorded alongside Git release hash and deployed web release; web updates and APK versioning are distinct.

Use the final origin's `/manifest.webmanifest`, start URL `/`, and existing icons. Bubblewrap is the reproducible CLI option; PWABuilder is a GUI alternative. Review the then-current CLI/JDK/Android SDK requirements before installation. In a separate packaging workspace, initialise Bubblewrap from the actual hosted manifest, confirm package/origin/version/permissions, then build only after approved signing setup. Expected signed output is `app-release-signed.apk`; validate with Android signing tools and record a SHA-256 download checksum. Do not generate this project, key or APK during Phase 2I.

TWA trust requires real Digital Asset Links at **`https://<confirmed-origin>/.well-known/assetlinks.json`**, publicly reachable as JSON without authentication or redirects, linking the final package with the actual signing certificate SHA-256 fingerprint and relation `delegate_permission/common.handle_all_urls` and target namespace `android_app`. Obtain the fingerprint from the certificate that signs the distributed APK, not a guessed/debug certificate. No placeholder asset-links file is checked in. [Chrome Android concepts](https://developer.chrome.com/docs/android/trusted-web-activity/android-for-web-devs) documents the exact relation and certificate matching. Validate browser TWA trust; verification failure falls back to a Custom Tab, not bypassed authentication.

Keep the signing keystore/passwords outside source, APK public folders and hosted environment files. Assign organisational ownership, encrypted backed-up storage, separate access controls and recovery procedure. Losing a direct-distribution signing key can prevent compatible updates; an update needs the same package and signing identity. No Google Play Developer account is required for direct APK distribution.

After signing/device acceptance, host the approved APK over HTTPS with version, checksum, release notes and approved distribution/access policy; no embedded credentials. On the device allow installation from that specific trusted source if organisational policy permits, or install using `adb install` for controlled testing. Explain Android's install warning and upgrade procedure; do not ask users to disable general device protections. Publish updates with the same signing identity and increasing versionCode. Decide download access and revoke/replace processes before distribution.

Sources: [Android quick start](https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2), [Bubblewrap official repository](https://github.com/GoogleChromeLabs/bubblewrap), [Android signing](https://developer.android.com/studio/publish/app-signing), [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started).

## 11. Location permission and TWA browser boundary

Phase 2I keeps the web Geolocation API and browser-site permission flow; no native location bridge is required for this bounded candidate. Chromium's [permission-delegation implementation](https://chromium.googlesource.com/chromium/src/+/HEAD/chrome/android/java/src/org/chromium/chrome/browser/browserservices/permissiondelegation/README.md) describes fallback to Chrome site permission when no applicable TWA app/native location declaration handles it. Delegation, if later selected, requires TrustedWebActivityService/native permissions and returning location to the browser; it is a separate reviewed configuration, not an automatic Bubblewrap checkbox. Inspect the generated Android manifest and chosen browser version in 2J, including approximate/precise/deny/OS-disabled states. Do not request background location. Permission can succeed while server policy still refuses attendance.

External origins can show browser chrome or open separate handlers; Android Back should follow browser history and the existing unsaved-change guard. `tel:` links may launch the dialler. Test actual generated package intent filters and allowed origins, rather than treating a desktop browser as proof. TWA browser cookie persistence, account switching and process death must be verified on selected supported devices.

## 12. Neon status and retention proof

Only project `fragrant-snow-30323119`, development `phase-2a / br-billowing-rice-a78isrig`, was inspected/tested. Before database-backed tests, live branch state was ready and expiry **24 November 2026 at 11:18 NZDT**; an extension is not needed for this run, but review/extend before work approaches expiry. Actual pooled/direct connection identity, verified TLS and all eight source-matching migration checksums were checked. A new read-only snapshot captured existing records across 14 tables, including complete Care metadata. Prisma reported no schema drift. Final hash comparison verified **1,335 pre-existing records across all 14 tables unchanged** and all eight migration checksums. Readiness accounts are inactive, with zero attendance/Diary/Care writes or mutation audits in that new tenant. No schema change, populated reset/reseed, production access or existing credential regeneration. New browser fixtures use a separate fictional readiness organisation and generated accounts, deactivated after each test; originals/audits are retained.

## 13. Automated verification

Final results are recorded in [implementation status](implementation-status.md): 531 units / 22 files, 262 disposable database cases / seven files, 84 full authenticated local passes / six intentional skips (6.4m), and seven focused actual Neon passes / two intentional skips (1.9m). Production build (9.6s compile), manifest/four icons/headers, 141 preview refusals plus 27 read/auth and 17 mutation probes passed. Nine configured secrets and ten restricted markers were absent from 134 client chunks. The original Chromium preview regression passed once: 619 passes / 126 intentional narrow-width skips (14.9m). The frozen 531 authored hashes, 51 reference files, three CSS copies and 465 academic file hashes/inventory remain unchanged. Targeted new checks cover manifest/icon responses/dimensions, launch redirects, private APIs/auth, no service workers/cache/storage, offline veil/reconnect, cookie persistence/revocation, Staff journey/forms/conditional tables at 360/390/412/768, desktop Admin, direct deferred mutation rejection and safe production environment. Existing security, attendance, Diary, Care and full preview coverage is preserved. Two browser expectations now verify the intentional Future Development response and stronger Permissions-Policy; original preview assertions remain unchanged. The new logout helper waits for visible navigation after session verification. The offline/logout test exposed and verified a streamed-document history fix; a component-only veil was insufficient. Three existing disposable test files retain all production-policy/no-write assertions with a fixture that temporarily clears forbidden development deployment flags and restores them afterward. This permits those policy-level tests alongside the new production configuration guard. Browser geolocation/network failure are simulated; no physical location, installed TWA, Android permission or APK signing acceptance is implied. No new large screenshot collection is generated.

## 14. Physical acceptance matrix — all pending

| Scenario | Required real-device evidence |
| --- | --- |
| HTTPS installation | Chrome/selected browser install menu, correct icon/name/splash, standalone viewport/cutouts/rotation |
| Launch/auth | Logged-out login; Staff My Shifts; management desktop gate; no loop; secure cookies; refresh/process restart |
| Account lifecycle | Sign-out, Back, offline Back, employee switching, eight-hour expiry and remote revocation; no previous employee records |
| Navigation/input | Android Back/forward, long pages, zoom/font sizing, IME/focus/scroll, unsaved forms, external dialler/browser links |
| Attendance | Secure origin; deny/approximate/precise/OS location disabled; missing policy refuses; approved policy acceptance is a separate future decision |
| Network | Cold offline launch, loss during Diary/Care write, uncertain commit/history/retry, reconnect; no stale offline records/false success |
| TWA trust/signing | Real package/certificate/DAL verification, browser selection/fallback, install/update using same key and increasing version |

Select supported Android versions/devices with the organisation in 2J; do not invent support guarantees. Test at least the actual intended browser/device combinations, including the generated wrapper, not just browser emulation.

## 15. Preconditions and risks for Phase 2J

Authorise a fictional-data HTTPS staging deployment separately; confirm final domain/origin/package ownership, correct isolated hosting DB, environment values, approved migration/release process, secret/keystore custody, distribution policy and physical test devices. Then verify hosted auth/cookies/CSRF/headers/cache/geolocation and the full Staff/Admin journey before generating a signed APK. Keep unsupported features gated and attendance off until policy approval and implementation. Do not copy the academic submission or use the fictional automated-test DB as a live target.

Real care information still requires organisational privacy/security/access/history/template/retention/correction governance, hosting/residency and third-party resource review, backups/recovery rehearsal, monitoring/incident response, least privilege, accessibility/device acceptance and secure account provisioning/recovery. This phase supplies readiness and a concrete handover, not these approvals.
