# Implementation status — Phase 2I

CareMetrics now has an online-only PWA manifest/icons, trusted launch routing, consistent authenticated Future Development pages and a documented HTTPS/Android TWA handover. Completed PostgreSQL MVP services are retained. This is fictional-data development/readiness work; no deployment, APK/signing, physical Android acceptance or Phase 2J execution.

## Checkpoint and preservation

Completed Phase 2H was verified and committed locally on `phase-2h` as **bbe9863c6655463133fe0bfcf5c79b18e0fc8e6f**, based on Phase 2G **ece6108d8960f0a8a1866ef05ca3ac2f548ffe49**. Phase 2I was developed on **phase-2i** and checkpointed on **phase-2i-complete** for the subsequently authorised GitHub push. Earlier branches are preserved. No deployment or APK packaging is included. [Archived Phase 2H status](history/phase-2h-status.md) retains previous implementation/test results.

Reference source remains excluded from Git, original CSS untouched, and 50 pre-existing duplicate screenshots unstaged. The separate academic submission folder/ZIP are untouched and protected by the existing **465-file content/inventory manifest**. No dependency, lockfile or schema change.

## Phase 2I implementation

- App Router `/manifest.webmanifest`: CareMetrics name, existing brand colours/pulse, stable `/` identity/start/scope, standalone display, 192/512 any/maskable PNGs and reproducible SVG source. Root icon/viewport metadata updated; no redesign.
- Server `/` checks current identity: logged-out Login, Staff/Senior My Shifts, management Admin. Existing Login → My Shifts → Dashboard without attendance remains.
- No service worker, offline cache, background sync, form storage or automatic mutation replay. Database-mode server HTML stays document-shielded until hydration/current session verification. Offline state hides content, explains uncertain writes and revalidates on reconnect/history restoration; offline Back after logout is explicitly tested.
- Global private/no-store and security headers supplement existing dynamic pages/private APIs. Auth.js origin/CSRF/secure-cookie/session revocation controls remain; no loosened host trust or browser role authority.
- Existing server capability allowlist and per-record scope retain real core reads/management, scheduling, attendance history, Client Diary and Care Plans. Deferred page families independently authenticate before rendering existing Future Development styling; preview code does not execute. Admin correction tab is explicitly deferred; attendance viewing remains live.
- Production backend configuration additionally refuses known fictional test branch names, seed confirmations/credential paths and attendance test acknowledgements. This supplements actual endpoint/environment review, not a guarantee from an environment label.
- [Android/PWA readiness](android-pwa-readiness.md) inventories all 43 page files, actual capabilities, no-cache decisions, environment/HTTPS review, package/DAL/signing/distribution plan and pending device/policy acceptance.

## Neon

Only existing fictional development **phase-2a / br-billowing-rice-a78isrig**, project `fragrant-snow-30323119`, used. Live state ready; expiry **24 November 2026 at 11:18 NZDT**. No extension needed for this run; review before approaching expiry. Matching pooled/direct identity, verified TLS and **eight migration checksums** confirmed before browser tests. No migration/reset/reseed/production modification or regeneration of existing credentials. New readiness fixtures use a separate fictional tenant and generated temporary accounts, retained records and deactivated accounts. Final read-only comparison confirms **1,335 pre-existing records across all 14 tables unchanged**, including complete Care metadata; eight checksums still match and Prisma reports no schema drift. Readiness accounts are inactive; its attendance/Diary/Care writes and mutation audits are zero. Existing 20 Care originals/audits, 32 Diary originals/audits and 30 clock-out records/audits remain intact.

## Verification

Node 22.23.4 / Prisma 7.10.1 / existing lockfile. All final checks passed; production source and test/tooling hashes remain frozen.

| Check | Result |
| --- | --- |
| Lint / strict TypeScript / formatting / Prisma validation | Passed; final generated-route restoration also passed |
| Unit tests | 531 passed / 22 files |
| Disposable PostgreSQL security/services | 262 passed / 7 files; original production-policy assertions retained |
| New PWA/mobile/Admin browser acceptance | Passed: 360/390/412/768 navigation/forms, 390 offline/logout history privacy, cookie persistence/revocation and 1280 Admin; two temporary images inspected |
| Full authenticated local / safe Neon browser regressions | Local: 84 passed / 6 intentional narrow Admin skips (6.4m); focused actual Neon: 7 passed / 2 intentional narrow Admin skips (1.9m) |
| Original full Chromium preview | 619 passed / 126 intentional narrow-width desktop-only skips (14.9m); run once |
| Production build / isolation / manifest / headers | Passed: compiled 9.6s; manifest/four icons; no-store/security headers; 141 preview refusals + 27 read/auth + 17 mutation probes |
| Bundle/source secret scans | Nine secrets / ten restricted markers absent from 134 chunks; source/private-permission checks passed |
| Reference/CSS/academic preservation | 531 authored hashes unchanged; 51 reference files / 3 original CSS copies exact; 465 academic file hashes/inventory unchanged |

Initial targeted browser checks exposed a test assumption about Next development page headers (forced `no-cache` versus production `no-store`), a case-sensitive Add Row selector, and a GET probe against a POST-only endpoint. Those checks were corrected; production no-store requirements remain explicit. The production deployment guard also pre-empted four historical production-policy simulations; only their isolated environment setup was adjusted to clear forbidden deployment flags, retaining every policy/no-write assertion. The production guard remains enforced in all production environments. Historical coverage remains. Two browser expectations were updated for intentional changes: authenticated deferred documentation now returns a generic Future Development page rather than 404 (with no-publishing-content assertions), and the exact geolocation header now also denies camera/microphone. The logout helper waits for visible navigation after session verification. An actual offline Back test exposed restored streamed HTML; document-level shielding and a fresh protected-document session check fixed it. A late successful session response cannot unmask content after the connection becomes offline. The original full preview assertions remain unchanged.

## Outstanding acceptance and next phase

Completed real Staff features remain: Login/sign-out, My Shifts/Dashboard/roster, assigned houses/clients/NOK/search/own profile, policy-gated attendance infrastructure/history, Client Diary and exact-version Care Plan submission/history. Essential Admin management/scheduling/attendance and client-tab Diary/Care reads remain.

Future Development: visual publishing, Charting/House Diary persistence, correction approvals, full Timesheet approval/payroll, Leave, files/gallery services, official delivery/concerns, advanced reports/audit UI and unsupported profile/account editing. Full isolated previews remain simulations. Production attendance stays off; all distance/accuracy/freshness/window/boundary/retention/clock-out policy decisions require approval.

Physical installed Android/TWA, secure hosted cookies/geolocation, Back/process death/IME/permissions, signed APK and Digital Asset Links are **not tested/generated**. Recommended Phase 2J: separately authorise fictional-data HTTPS staging, confirm origin/package/database/secrets/signing custody and devices, verify hosted controls and journeys, then generate/sign/test/distribute only under that authorisation. Real care data still requires privacy/security/organisational/operational acceptance. Do not use the automated-test branch or modify academic submission artifacts.
