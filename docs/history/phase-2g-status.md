# Implementation status — Phase 2G

Client Diary now has real server-authorised PostgreSQL submission, immutable submitted originals, bounded current-client history/detail and minimal management read access. Existing Staff mobile form/cards and desktop Admin tab/Drawer are reused. This is fictional-data development functionality; production privacy/organisational approval remains outstanding. [Client Diary contract](../client-diary-backend.md) describes scope, policy interpretations and Phase 2H handover. [Phase 2F status](phase-2f-status.md) preserves attendance evidence and its unchanged production-disabled policy.

## Git and scope

The user authorised pushing Phase 2F before this phase. Complete checkpoint **28540084c4f87802dc49bec0c782aff67ee74a5a** is pushed on `phase-2f-complete`; earlier Phase 2E **862c074d8d21aa4025807d11b9dd5dd468be9162** and older branches remain intact. Completed Phase 2G was checkpointed locally at **ece6108d8960f0a8a1866ef05ca3ac2f548ffe49** during separate academic packaging; it was not pushed. No reset, discarded work, reference deletion or application deployment. Fifty pre-existing duplicate screenshots remain untouched/excluded.

## Connected functionality

- Staff Client Profile → Diary → New entry → committed history/detail → refresh/fresh login. Login → My Shifts → Dashboard without clock-in remains intact.
- Four stable reviewed category keys retain existing labels; title/category/content/event time/reason validation runs on the server. Pacific/Auckland local event input rejects invalid/ambiguous/nonexistent/future times; server-generated submission/creation time remains separate.
- Current Auth.js employee, active organisation/account/session-version and current client-house scope determine authority. Staff/Senior need active current assignments; management retains existing same-organisation active-client scope. Browser author/role/org/house/status/on-shift flags cannot grant writes.
- Explicit off-shift interpretation: at server receipt, eligible own recorded GPS-test attendance must cover the current client house and lie within its noncancelled scheduled interval. Scheduled shifts alone, another employee/house, unverified/closed/overdue attendance do not qualify. Otherwise documentation remains allowed with a reason. Commit rechecks eligibility and stores minimal rule/attendance context. This is not a wage/clinical timing policy and needs organisational approval before real use.
- Atomic immutable Diary original plus minimal append-only audit. Shared org/actor locking rechecks scope alongside transfers/assignment/status/attendance operations. Unique request identity and HMAC-normalised payload permit exact retry; conflicting reuse cannot overwrite a record. Failed audit rolls back submission. No success before commit, fixture fallback or offline queue.
- Bounded newest-submission-first history (timestamp plus UUID), category/range/page filters, six Staff/twenty Admin rows and independently scoped details. DTOs exclude credentials, request digests, context snapshots and GPS evidence. Stored text is escaped, preserves lines and wraps long tokens.
- Client transfers preserve original house/author/event/submission/content while current authorised client teams receive history. Previous assignment alone grants no historical access; inactive/unassigned/foreign clients remain unavailable. This current-client/full-history interpretation requires organisational review before real data.
- Admin client Diary tab reads the same UUIDs with no edit/delete/approval/correction action. Draft saving and attachments are explicitly unavailable. House Diary, Care Plan and Charting database routes remain deferred. Original isolated previews retain their full demonstrations.

## Neon and schema

Only development **phase-2a / br-billowing-rice-a78isrig**, project `fragrant-snow-30323119`, was used. Verified healthy branch, actual matching pooled/direct database target, certificate-verified TLS and all five baseline migration checksums before writes. Expiry: **24 November 2026 at 11:18 NZDT**. Production untouched; no populated reset/reseed.

Migration **202610250006_client_diary** adds categoryKey, requestId/digest and documentationContext to existing ClientDiaryEntry, reuses existing title/category/content/client/house/author/timestamps/status and submitted-original immutability. It adds bounded complete metadata and audit vocabulary. **202610250007_diary_context_check** explicitly rejects missing JSON keys (SQL UNKNOWN) without changing applied migration 006. Both were tested in disposable PostgreSQL; all **417 original domain/audit records across 14 tables** matched captured hashes immediately after application. No false legacy backfill or duplicate Diary entity. Final read-only checks also verified 156 original attendance/audit/documentation records unchanged, all 11 original clock-in evidence hashes unchanged, 20 fictional Diary originals with 20 matching minimal audits (15 reasoned off-shift, five recorded on-shift), inactive generated test accounts and zero Diary/attendance in the original seed organisation. All seven applied migration checksums match source.

Guarded browser tests create only fictional Diary-tenant accounts/clients/attendance/notes. Generated accounts are deactivated and records/audit retained. Default app environment stays unchanged with no test attendance policy. Destructive/rollback tests use disposable local PostgreSQL only.

## Verification

Node 22.23.4, Prisma 7.10.1 and dependencies/lockfile retained. Focused and final stable verification passed; organisational/physical-device/operational acceptance remains outstanding.

| Check | Result |
| --- | --- |
| Lint / strict TypeScript / formatting / Prisma validation | Passed |
| Unit tests | 481 passed / 20 files, including 22 new Diary cases |
| Disposable PostgreSQL migration/repeat seed/security | 187 passed / 6 files, including 57 Diary cases |
| Focused 390px Diary journeys | Four local and four actual Neon passes; final complete suites additionally cover logout/login and double taps |
| Full authenticated local / Neon suites | Local: 65 passed / 4 intentional narrow Admin skips (3.7m); actual Neon: 65 passed / 4 identical skips (6.5m) |
| Full original Chromium preview | 619 passed / 126 intentional narrow Admin skips; one uninterrupted 13.7-minute run at 375/390/768/1280/1440px |
| `npm run build` | Passed; compiled in 3.4s |
| Production isolation | Passed: 141 preview routes refused; 19 read/auth + 16 mutation APIs failed closed |
| Bundle/source secret scans | Nine configured secrets and ten restricted markers absent from 127 production client chunks; source scan and private-file permissions passed |
| Original source/CSS/dependency preservation | 491 authored hashes frozen; 51 reference files/three original CSS copies exact; dependencies and original unit/preview assertions unchanged |

One initial full local browser run had 64 passes, one failure and four intentional skips: the existing 390px management login showed empty-field feedback, as also seen in Phase 2F. Its unchanged isolated rerun and complete 65-case local rerun passed. Authentication and existing assertions were not relaxed.

All 491 authored source/test/tooling hashes remained unchanged throughout the final preview and complete authenticated runs. Final canonical type generation, formatting, diff/secret checks and reference/CSS checks passed afterward. No unresolved new Diary implementation blocker remains; the intermittent pre-existing login test is recorded above rather than presented as a diagnosed product fix.

The initial focused run caught an invalid legacy attendance fixture and two ambiguous browser locators. These were corrected without weakening evidence constraints or existing assertions. A separate explicit JSON missing-key constraint was added and tested after reviewing SQL CHECK semantics; the already applied migration was retained. No new broad screenshot collection is generated; two temporary Staff/Admin views were inspected.

## Remaining limits and next step

Production attendance remains disabled pending approved policy and physical hosted HTTPS/Android acceptance. Browser GPS in tests is mocked, not actual device acceptance. No APK/PWA packaging/deployment. Diary history visibility, off-shift interpretation, privacy/retention/correction policy, role governance, least-privilege runtime credentials, monitoring, backups/recovery and broader security/accessibility/operations acceptance need review before real client information.

Draft persistence, corrections/approvals/deletion, uploads/private files, House Diary, Care Plans/Charting, live builder publication, Leave, payroll, delivery and full Submitted Records/Reports remain deferred. Preview-only saves are simulations; backend-connected Diary originals persist across refresh/logout.

Recommended next assignment: separately authorised **Phase 2H — persistent Care Plan submissions and exact-version history**, using predefined immutable published templates/client assignments, trusted server validation/author/time/off-shift decisions, idempotent transaction/audit and an explicit draft decision. Phase 2H has not been started.
