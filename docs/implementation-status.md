# Implementation status — Phase 2H

Care Plans now use assigned PostgreSQL form definitions, the existing configurable renderer/validation engine, immutable submissions and exact-version Staff/Admin history. This is fictional-data development functionality; privacy/organisational/production acceptance remains outstanding. [Care Plan contracts](care-plan-backend.md) describe the implementation and Phase 2I handover; [Phase 2G status](history/phase-2g-status.md) preserves the prior iteration.

## Checkpoint and preservation

Original repository `/Users/jeshurun/Desktop/CareMetrics`, working branch **phase-2h**, created from completed Phase 2G **ece6108d8960f0a8a1866ef05ca3ac2f548ffe49**. Phase 2G was committed locally during academic packaging and not pushed. Phase 2F remains remotely preserved at **28540084c4f87802dc49bec0c782aff67ee74a5a**. Phase 2H is uncommitted/unpushed; no deployment or later phase started. Fifty pre-existing duplicate screenshots remain untouched/excluded.

The separately prepared `CareMetrics-Submission` folder and `CareMetrics-Source-Code.zip` are not changed. A read-only 465-file content manifest was captured and verified. Original reference source, three CSS copies, dependency versions, tests and mock previews remain preserved.

## Connected functionality

- Staff Client Profile → Care Plan categories → assigned published form → submit → history/detail → refresh. Existing mobile form controls, choices, conditional questions, repeating tables and read-only values are reused; no second form engine or browser domain store.
- Current Auth.js account/org/session version, current client-house access and same-tenant CARE template assignment are enforced server-side. New writes require active assignment, nonarchived template, valid published definition and expected assigned version. Stale forms conflict; Charting and unassigned templates cannot be submitted through these services.
- Strict JSON definition/answer boundaries wrap existing publication semantics and validateForm. Required questions, option values, number/scale/date/time/DST, hidden/unknown fields, table rows/cells/default-row constraints and payload limits are checked before normalisation. Duplicate JSON keys, including escaped equivalents, fail at the new submission HTTP boundary. No executable template expressions or HTML rendering.
- CareRecord references exact template ID/version/definition/answers. Historical reads never substitute current/latest versions. Paused/archived assignments retain authorised history; malformed new assignments do not block valid old records. Older assigned versions are retrieved directly, independent of bounded latest-version metadata.
- Phase 2G documentation eligibility is shared unchanged in development: own recorded attendance at the client's current house, within the noncancelled scheduled interval at server receipt. Otherwise a reason is required; clock-in is never mandatory. A security refinement prevents fictional verification from granting a production on-shift exemption under NODE_ENV or VERCEL_ENV production; documentation with a reason remains possible.
- Server receipt timestamps, author/org/current house and derived context are authoritative. Record plus minimal audit commit atomically under shared org/actor locks. HMAC canonical payload identity and unique request UUID permit exact replay, preserve array/row order and reject changed key reuse. Lost responses offer unchanged retry; no success before commit or fixture fallback.
- Staff bounded history uses six rows, management twenty; timestamp/UUID ordering and safe range/page/detail filters. Current client access follows transfers without erasing original house/author/version/answers. DTOs exclude credentials, request digests, context/GPS evidence and unrelated client data.
- Essential Admin client Care Plan tab reads assignments/published versions and original records in the existing desktop shell/Drawer. No template publishing/assignment mutation, rewriting, corrections, drafts or uploads are enabled. Full builder/Charting/House Diary previews remain isolated and unchanged.

## Neon and schema

Only existing development **phase-2a / br-billowing-rice-a78isrig**, project `fragrant-snow-30323119`, was used. Healthy branch, actual matching pooled/direct target, verified TLS and exact seven migration checksums were confirmed before writes. Expiry remains **24 November 2026 at 11:18 NZDT**. No production modification, populated reset/reseed or existing credential regeneration.

Migration **202610250008_care_submission** adds nullable historical house, unique request ID/digest and minimal documentationContext to existing CareRecord. Same-tenant House FK, complete metadata/positive submission ordering/object answers/context checks and `care.submitted` audit vocabulary are added. Existing exact-version FK, immutable published definitions and immutable submitted originals remain. Legacy metadata is not fabricated. The migration was tested in disposable PostgreSQL before development application; all **802 original domain/audit records across 14 tables** matched captured hashes immediately afterward. Eight applied checksums match source.

Final read-only checks verified eight migration checksums and **271 pre-existing immutable attendance/audit/documentation records unchanged**. The fictional Care tenant contains **20 submissions / 20 matching minimal audits**: 16 v1 and four v2 originals, 16 with off-shift reasons and four with recorded test attendance. Historical version integrity failures: zero. All generated Care, Diary and attendance test accounts are inactive; original seed Care/Diary/attendance counts remain zero. Eleven original clock-in evidence hashes remain unchanged and those records remain open.

Tests use a separate fictional Care tenant and guarded generated accounts/clients/templates. Version publication in tests is controlled fixture seeding, not an implemented Admin publication endpoint. Accounts are deactivated and original records/audit retained. Destructive rollback tests use disposable PostgreSQL only. Default environment/test policies and private fictional credentials remain unchanged.

## Verification

Node 22.23.4, Prisma 7.10.1 and the existing lockfile retained. All final checks passed on the frozen implementation.

| Check | Result |
| --- | --- |
| Lint / strict TypeScript / formatting / Prisma validation | Passed |
| Unit tests | 528 passed / 21 files; 47 new form/JSON boundary cases |
| Disposable PostgreSQL migration/repeat seed/security | 262 passed / 7 files; 75 new Care Plan cases |
| Focused 390px Care journeys and 1280px Admin details | Four local and four actual Neon passes |
| Full authenticated local / Neon suites | Local: 77 passed / 4 intentional narrow Admin skips (4.0m); actual Neon: 77 passed / the same 4 skips (9.6m) |
| Original full Chromium preview | 619 passed / 126 intentional desktop-only narrow-width skips (13.3m); run once |
| `npm run build` | Passed; compiled in 4.1s |
| Production isolation | Passed: 141 preview routes refused; 27 read/auth + 17 mutation API probes failed closed |
| Bundle/source scans | Nine configured secrets and ten restricted markers absent from 136 production chunks; changed source/private-file checks passed |
| Frozen source/reference/submission verification | 512 authored hashes frozen; 51 reference files and three original CSS copies exact; 465 academic artifact hashes/inventory unchanged |

The focused runs verified v1 questions/options/table columns after v2 assignment, stale-form conflicts, required off-shift reason, on-shift conditional/repeating rows, double taps, response-loss retry, shared Admin reads and transfer permissions. Two temporary Staff/Admin history images were inspected; no large screenshot collection was added. Existing assertions are retained. Initial TypeScript fixture casts and regex-target compatibility were corrected during focused checks; no database/security assertion was weakened.

## Remaining limits and Phase 2I

No visual publishing, Charting persistence, House Diary, correction approvals, durable drafts, file/photo services, Leave, payroll, notifications/concerns or advanced reporting. Unfinished real-mode actions remain unavailable; isolated previews remain simulations. Production attendance policies and physical hosted HTTPS/Android acceptance remain unapproved/unverified. Browser GPS tests are mocked evidence, not physical-device acceptance. No real client information, APK/PWA packaging or deployment.

Review documentation timing/history visibility, template governance, privacy/retention/correction policies, role scope, least-privilege DB roles, backups/recovery, monitoring and broader security/accessibility/operational acceptance before real use. Definition/payload/catalog bounds are engineering limits, not clinical rules or entitlements.

Recommend separately authorised **Phase 2I — Android/PWA preparation**, first checking the actual browser/hosting architecture, HTTPS/origin/session/API boundaries, explicit feature availability and physical-device acceptance plan. Do not cache sensitive records or queue attendance/documentation writes offline without reviewed semantics. No Phase 2I has started; previously submitted artifacts stay frozen.
