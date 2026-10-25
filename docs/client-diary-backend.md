# Phase 2G — Persistent Client Diary and history

Client Diary now uses authenticated PostgreSQL submission, immutable originals, current-client-scoped history/detail and a minimal management read view. This is a fictional-data development implementation, not organisational approval for real disability-support or health information. Care Plans remain Phase 2H; no House Diary, corrections, uploads or full Submitted Records backend was added.

## Checkpoint, database and preservation

The user explicitly authorised pushing Phase 2F before starting this phase. Complete checkpoint **28540084c4f87802dc49bec0c782aff67ee74a5a** is pushed on `phase-2f-complete`; earlier Phase 2E **862c074d8d21aa4025807d11b9dd5dd468be9162**, Phase 2D and older branches remain intact. Work is on `phase-2g`; this phase is not pushed or deployed. Original reference source and all three CSS copies remain unchanged. Fifty pre-existing duplicate screenshots remain untouched and excluded.

Only Neon development **phase-2a / br-billowing-rice-a78isrig**, project `fragrant-snow-30323119`, was used. Before writes: verified healthy branch, actual matching pooled/direct endpoint/database identity, certificate-verified client TLS and all five prior migration checksums. Captured private hashes of 417 existing records across 14 domain/audit tables. All 417 matched after migrations 006/007. No reset/reseed of populated data or production change. Expiry remains **24 November 2026, 11:18 NZDT**.

## Existing model and migration

Existing ClientDiaryEntry already holds tenant/client/house/author, title, category snapshot, content, coveredAt, status, offShiftReason and creation/submission timestamps. Its submitted-original UPDATE/DELETE protection and tenant-composite foreign keys are retained.

Migration **202610250006_client_diary** adds only four nullable metadata fields: categoryKey, unique requestId, requestDigest and documentationContext. Existing category remains the submitted label snapshot; no duplicate Diary table or Care Plan answer reuse. New service submissions are always SUBMITTED, with complete request/category/context metadata, bounded title/content/reason and covered time no later than submission. Legacy rows remain without invented metadata/backfill. Existing history indexes support deterministic client history.

Migration **202610250007_diary_context_check** explicitly rejects missing/malformed JSON context keys using COALESCE(..., FALSE), because PostgreSQL CHECK accepts UNKNOWN otherwise. It was tested separately in disposable PostgreSQL; migration 006 was preserved unchanged after application. New off-shift context requires a reason; on-shift context retains the selected attendance UUID. Audit vocabularies now permit `diary.submitted` / `clientDiary`. Existing audit/evidence remain append-only.

## Categories and validation

`modules/diary/categories.ts` is a small reviewed MVP configuration with stable identifiers and the four existing Client Diary labels:

| Stable key | Existing label |
| --- | --- |
| progress-notes | Progress Notes |
| health-appointments | GP / OT / Health Appointments |
| incident-reports | Incident Reports |
| general-update | General Update |

These apply consistently to each organisation, with no visual publishing API, arbitrary category field or import of preview IDs/records. Configuration changes require review; submitted category labels remain snapshots.

`POST /api/clients/:clientId/diary` accepts exactly requestId (UUID), title, categoryKey, content, coveredAt (NZ datetime-local string) and offShiftReason (possibly empty). No author, organisation, role, house, status, isOnShift flag, submission time, attachment reference or arbitrary model field is accepted. Title is trimmed/nonempty, at most 160 characters; content is trimmed, 10–10,000 characters; reason is trimmed, at most 1,000 and nonempty when required. Invalid types/control characters/unsupported fields fail safely. Transport streams are bounded to 32 KiB with exact configured same-origin POST and JSON checks; this byte limit may reject a very large multibyte entry before the character limit.

The server converts coveredAt with the existing strict Pacific/Auckland converter. Invalid calendar values, ambiguous fall-back times, missing spring-forward times and future covered events are rejected. Covered time is the event, not server submission time. Received/submitted/created timestamps come from server time, captured after bounded decoding before authentication/transaction locks. NZ display includes dates, years and time; UTC stores unambiguous instants. No clinical timing/late-documentation entitlement is invented.

Stored text is rendered through escaped React text, never HTML injection, rich HTML or dangerous innerHTML. Literal markup remains plain text. Newline display and long-token wrapping are supported without editing source CSS. No content/reason appears in audit summaries, URLs or ordinary logs.

## Trusted identity, client scope and transfer visibility

Each operation independently requires Auth.js, active organisation/employee and current session version. `care.clientDiary` permits the Staff documentation slice; `admin.clientDiaryViewing` requires Manager/Administrator. Current role/tenant/active-house/client checks run on the server. Staff/Senior require a current active assignment to the client's active current house; employees can have several assignments. Management follows the existing active-house/client authority within its organisation. No browser preview role grants reads or writes.

Submission takes the existing organisation lock, then actor lock, rechecks identity/session and resolves current client scope inside the transaction. Core assignment/transfer/status/scheduling/attendance mutations use that same protocol. A transfer or assignment withdrawal cannot be ignored through an old form's client/house claims. Inaccessible and nonexistent client/record responses are equally unavailable.

**MVP historical visibility interpretation:** the client's current authorised team can read that client's submitted history, including notes submitted at a previous house. Prior assignment alone never grants historical access after transfer. Stored original house/author/event/submission IDs/times/content are unchanged; historical house name is limited display metadata, not a link granting House/Client-directory access. Names reflect current related display names; no historical name snapshot is invented. Review this full-client-history policy with the organisation before real data; field-level historical restrictions/retention are not implemented. Inactive clients/houses are unavailable through these active-client routes, while their records remain retained for a future approved resolution/access process.

## Off-shift interpretation

At the **server submission receipt instant**, eligibility requires this employee's own same-tenant recorded attendance for the client's current house, a noncancelled linked shift covering that instant (`startsAt <= receipt < endsAt`), a clock-in no later than receipt, no completed clock-out at/before receipt, and the existing recognised `SERVER_VALIDATED_LOCATION_TEST` evidence label. A schedule alone, a coworker's attendance, unrelated house attendance, unverified legacy rows or an open clock-in after scheduled end does not qualify. There is no guessed overtime extension or use of browser flags/event time as attendance proof.

This recognises only the implemented fictional development GPS evidence; production attendance remains disabled. A future production evidence label/policy requires separate reviewed activation. Everyone can still document off shift with an appropriate reason; clock-in never becomes mandatory. The editor shows current guidance, but commit recomputes it and can require a reason if eligibility ended while typing. Optional reasons supplied on shift remain preserved. documentationContext retains only rule version, derived offShift and eligible attendance UUID, not GPS evidence.

The organisation must review whether this submission-time/current-house/scheduled-window interpretation and its historical visibility rule are appropriate before real operation. No wage, break, payroll, backdating or workforce-compliance policy is asserted.

## Transaction, audit and retries

The service atomically creates one submitted original and minimal audit with trusted actor, organisation, Diary UUID, client/house IDs, category key and off-shift boolean. Content/title/reason and GPS details are omitted. A failed write/audit rolls back both; no successful response precedes commit and no fixture fallback exists.

An operation-specific HMAC-SHA256 digest covers the client and normalised validated request, with a cryptographic UUID per attempt. The unique request key and organisation lock serialize identical concurrent requests: exact same authorised author/client/payload retry returns the committed UUID with replayed true. Changed request reuse conflicts; a distinct request represents a separate submission and cannot overwrite an original. Current identity and current client access are rechecked before replay, including after transfer. Successful replay does not reapply today's attendance/time eligibility. Secret rotation may require checking history rather than replaying an old attempt.

The UI keeps an in-flight ref and retains the exact attempt on uncertain network/generic service failure. It freezes fields and offers Retry previous submission; confirmed validation failures permit editing. Refresh/history is the source of truth if the response was lost. A disabled button alone is not duplicate protection. Leaving the editor cannot promise cancellation of a request already sent. Nothing is queued offline or stored as a durable browser draft.

Submitted originals cannot be edited/deleted/reassigned through the service or ordinary database update/delete. No edit, delete, correction or management replacement endpoint exists. Existing correction controls are explanatory Future Development in database mode. Draft saving remains visibly disabled rather than falsely claiming durability. File attachments are unavailable and unsupported request properties fail validation.

## Routes and minimal reads

| Route | Connected behaviour |
| --- | --- |
| `/clients/:id?tab=diary` | Own authorised client history, category/submission-range filters, six rows/page |
| `/clients/:id?tab=diary&item=:entryId` | Submitted detail within the same authorised client |
| `/clients/:id/diary/new` | Existing mobile form controls, server-derived author/context and real submission |
| `/admin/clients/:id?tab=diary` / `&item=:entryId` | Existing desktop Admin shell/tab, read-only history and Drawer, twenty rows/page |
| GET `/api/clients/:id/diary` / `/:entryId` | Current client-authorised history/detail |
| GET `/api/admin/clients/:id/diary` / `/:entryId` | Explicit management capability and current same-tenant client scope |

History sorts submittedAt descending then UUID descending and has bounded Previous/Next pagination. Detail is independently scoped within the same client even when outside current filters/page. Only validated category/range/page/item filters are supported; unknown, duplicate, array, invalid category/page/ID filters fail. Filter ranges use server elapsed 24-hour days against submission timestamp. Text search is unavailable; care content is never put in query strings.

DTOs include only record/client/house/author UUIDs and permitted names, title/category/content, covered/created/submitted times and reason. No request digests, policy/GPS evidence, password material, whole organisation snapshots or management-only notes. Protected responses are private/no-store. Safe errors cover 400 validation, 401 session, 403 capability/origin, 404 unavailable, 409 request conflict and 503 service failure. Empty history is distinct from service failure. Deferred methods/endpoints fail closed.

Original nonproduction preview Diary/House Diary/Care/Charting/drafts/corrections still use their isolated adapter. Database mode takes real routes first and never supplies preview identity/store as authority. The full Submitted Records route remains deferred; management reads only this client-specific slice. Staff and Admin share the same persisted UUIDs. Existing CSS, reference and preview assertions remain unchanged.

## Verification and next boundary

Focused verification passed: 22 validation/category units, all 187 disposable PostgreSQL tests (57 new Diary cases), and four 390px real-auth Diary browser journeys locally and on actual Neon. These exercise off/on-shift submission, shared Staff/Admin reads, reload/fresh login, transfer access and response-loss retry. Final stable checks passed: 481 units; 187 database/security cases; 65 local and 65 actual Neon authenticated browser passes, each with four intentional narrow Admin skips; 619 original Chromium preview passes / 126 intentional skips in one 13.7-minute run. Lint/types/format/schema and `npm run build` passed (compiled in 3.4s). Production refused 141 preview routes and failed closed on 19 read/auth + 16 mutation probes; nine secrets/ten restricted markers were absent from 127 client chunks. All 491 frozen authored hashes, 51 reference files, three original CSS copies and dependencies were preserved. Final read-only Neon proof matched 156 original attendance/audit/documentation records and all 11 original clock-in hashes, seven applied migration checksums and 20 new Diary originals / 20 matching minimal audits. The initial intermittent existing management-login failure and successful unchanged isolated/full reruns are recorded in [implementation status](implementation-status.md).

Browser service-failure/lost-response cases deliberately inject HTTP/network faults; PostgreSQL transactional rollback uses an actual failing trigger only in disposable tests. No physical database-outage deployment acceptance is claimed.

Physical HTTPS/Android, Safari/Firefox, full accessibility/penetration testing and production operations/privacy acceptance remain unverified. This phase provides no deployment, APK, private storage or real client data. Organisational role/history/retention/correction/dispute policy, least-privilege database roles, backups/recovery, monitoring and external-resource review remain outstanding.

Recommended separately authorised **Phase 2H — persistent Care Plan submissions/history**: inspect existing versioned templates and renderer; use predefined immutable published versions/client assignments, server-side answer validation, trusted author/time/off-shift policy, idempotent transactions/audit and exact-version historical reads. Make an explicit draft decision. Keep Charting, builder publishing, House Diary, files, corrections and delivery deferred. Phase 2H is not started automatically.
