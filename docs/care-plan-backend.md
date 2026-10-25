# Phase 2H — Persistent Care Plans and exact-version history

Care Plan submissions now use PostgreSQL and the existing configurable form architecture. Authorised Staff retrieve client assignments, complete the published form, submit an immutable original and read exact-version history. Management has a minimal read-only client Care Plan path. This is fictional-data development functionality, not approval for real disability-support or health information.

## Repository, submission and database safety

Work is in the original repository on `phase-2h`, based on local Phase 2G checkpoint **ece6108d8960f0a8a1866ef05ca3ac2f548ffe49**. Phase 2F remains remotely preserved at **28540084c4f87802dc49bec0c782aff67ee74a5a**. No automatic push, deployment or Phase 2I. The separate academic submission folder/ZIP remain unchanged; a 465-file content manifest verifies preservation. Original Figma reference, CSS, existing assertions, dependencies and preview source are retained.

Only Neon development **phase-2a / br-billowing-rice-a78isrig**, project `fragrant-snow-30323119`, is used. Before writes: healthy branch, matching actual pooled/direct endpoint identity, verified client TLS, seven applied migration checksums and intact Diary/attendance baseline. Expiry remains **24 November 2026, 11:18 NZDT**. No production change, populated reset/reseed or regeneration of existing credentials. Captured hashes of 802 original records across 14 domain/audit tables matched immediately after migration 008.

## Existing model and migration

The existing CareTemplate (CARE/CHART, archived), immutable CareTemplateVersion (JSON definition and published time), ClientTemplateAssignment (client/template/exact version/active) and CareRecord (values, author, event/submission time/status/reason) remain the single model. No competing tables, form engine or Care Plan answer store.

**202610250008_care_submission** adds four nullable CareRecord fields: houseId, requestId, requestDigest and documentationContext. New records retain historical house through a tenant-composite FK. Request UUID uniqueness, complete metadata/object answers/covered-time ordering, bounded reason and explicit JSON context checks use COALESCE(..., FALSE) to reject missing keys. The existing exact-version FK and submitted-original UPDATE/DELETE trigger remain. Legacy rows are not backfilled; missing historical house displays Not recorded rather than the current house. Audit vocabularies permit `care.submitted` / `careRecord`.

The migration was reviewed/exercised in disposable PostgreSQL before applying to the isolated development branch. Existing published definitions and submitted records remain immutable. Controlled test seeding of a newer published version demonstrates version integrity; no application publishing endpoint was added.

## Definition contract and shared renderer

`modules/forms/submission.ts` is a strict JSON boundary around existing `validateTemplate`, `validateForm`, `visibleFields` and `normalizeFormValues`. It is not another form engine. Existing DynamicFormRenderer, FormFieldRenderer, ChoiceField, RepeatingTableField and ReadOnlyFormValues drive Staff input and exact-version display.

Definitions must be a published object whose positive version matches the referenced database version. Safe distinct section/field/column IDs, labels/help, typed options/defaults/bounds, declarative conditions, reference/history metadata and supported shapes are validated. No arbitrary expressions/JavaScript/HTML are executed. Unknown properties, cycles, invalid defaults/options/bounds and unsupported photo/file/legacy-table variants make that definition unavailable. An optional unsupported upload field also blocks the form rather than silently dropping its answers.

Supported fields: text, textarea, number, scale, yesno, select, radio, multi, date, time, datetime and repeatingTable. Table cells reuse the existing text/number/date/time/yesno/select/radio contract. Reserved file/photo cells and nested tables remain unavailable.

Engineering bounds: 128 KiB per definition; at most 50 sections, 200 fields, 40 columns per table and 100 options; at most 100 rows, respecting any smaller configured min/max. Text answers are at most 10,000 characters; complete answer JSON at most 24 KiB, and the streamed HTTP body remains 32 KiB. Configuration labels/help and IDs are separately bounded. These are supported MVP payload/resource limits, not organisational or clinical rules. The historical preview engine remains unchanged and its older unbounded UI contracts do not activate unrestricted server payloads.

## Strict answer validation

The same exact published definition drives rendering and server validation. The server validates before normalising: unknown field IDs, hidden submitted keys (even empty), malformed values, unknown columns and unsupported data cannot disappear through sanitisation. Required visible questions, finite numbers/scales/ranges/steps, valid options, duplicate multi choices and date/time formats use the existing engine. Hidden required questions do not block correctly omitted answers. Defaults initialise the editor; the server never fabricates missing submitted answers from defaults.

Tables remain arrays of `{id, values}`. Stable safe row IDs must be unique per table; order is retained. Cells must belong to configured columns and satisfy the same scalar validation, required flags and numeric/choice bounds. Unknown row properties/cells, flattened strings, duplicate/empty/unsafe row IDs and excessive rows fail. `allowAdd: false` restricts rows to configured defaults; `allowRemoveDraftRows: false` retains configured rows. There is no durable draft history for inferring removal of transient unsaved rows.

Datetime answers enter as strict Pacific/Auckland wall times and normalise to UTC ISO after validation. Invalid calendar values and ambiguous/missing DST times reject. Stored answers are validated against the recorded version before read-only rendering; unexpected corruption yields a safe integrity/service error, not latest-version reinterpretation or silent omission. Original answer JSON is not rewritten.

Care submission HTTP additionally rejects duplicate JSON object keys, including equivalent escaped keys, before service execution. It uses native JSON parsing plus a bounded key-token check; other existing mutation contracts retain their previous behaviour.

## Assignment and current access

Each operation independently resolves an active Auth.js employee/organisation and current session version. `care.assessments` enables this Staff slice; `admin.carePlanViewing` requires Manager/Administrator. Current client access follows existing active-house assignment rules; management retains same-organisation active-client authority. Browser author/org/role/house/status/on-shift claims grant nothing.

New submissions require an active assignment for this client, same-tenant CARE template, nonarchived state and a valid published version. The submitted version is an expected revision, not authority: assignment changes after opening produce 409 and require reopening/review. CHART and another client's templates reject. Published forms are retrieved from the assigned relation directly, independent of the bounded latest-version metadata list.

History remains readable under current client access after assignment pause/removal or archival. Client transfers preserve original client/template/version/house/author/answers/times; current authorised teams can read that client's history, while previous assignments alone grant nothing. This follows Phase 2G's provisional current-client/full-history interpretation and needs organisational review before real data. Inactive clients/houses remain unavailable through these active-client routes while records are retained.

## Submission contract, context and transaction

`POST /api/clients/:clientId/care-records` accepts exactly requestId, templateId, templateVersion, coveredAt (NZ datetime-local), offShiftReason and values. The server derives author, organisation, current house, actual assignment/version, SUBMITTED status and official timestamps. Covered time documents the event and must not be future; it cannot replace submission time. All protected responses are private/no-store; errors never return raw database details or care values.

After bounded same-origin JSON decoding, receipt time is captured before authentication/locks. The service uses the established organisation-then-actor transaction locks, rechecks account/org/session and current client scope, resolves the assignment, validates answers/context, creates CareRecord and appends minimal audit atomically. Assignment/status/transfer/scheduling/attendance writers participate in the same lock protocol. Failure creates neither a submitted success nor a successful audit; no preview fallback exists.

`server/documentation/context.ts` now shares Phase 2G's eligibility query with Diary: own same-tenant recognised recorded attendance for the client's current house, clock-in no later than receipt, no clock-out at/before receipt, noncancelled shift with `startsAt <= receipt < endsAt`. A schedule alone, another house/employee or overdue/unverified/closed attendance does not qualify. Event time/browser flags do not establish on-shift status. Off-shift documentation remains allowed with a trimmed nonempty bounded reason.

One safety correction makes the fictional verification label incapable of granting a production on-shift exemption under either NODE_ENV or VERCEL_ENV production. The normal development interval semantics are unchanged; production attendance remains unapproved/disabled. Production documentation with a reason is not represented as operational/privacy acceptance. Context stores only rule version, derived offShift and selected attendance UUID, never GPS evidence.

## Idempotency, concurrency and immutability

Operation-specific HMAC-SHA256 covers the client and validated normalised payload. Object keys are canonicalised; array/row order remains meaningful. Unique request UUID plus shared locks serialize concurrent duplicate attempts. Exact authorised author/client/template/version/payload retry returns the committed UUID with replayed true and no new timestamp/audit. Changed key reuse conflicts; distinct keys represent distinct submissions and cannot overwrite originals. Replays recheck current identity/client access, but are historical reads and do not require today's active assignment/eligibility. Secret rotation can require checking history rather than replaying an old attempt.

The editor uses an in-flight ref, retains an uncertain exact payload, freezes fields and offers Retry previous submission after network/service failure. A disabled button is not the database guarantee. Confirmed validation/conflict errors retain input for review; stale versions are never automatically migrated. Refresh/fresh login reads PostgreSQL. Leaving does not guarantee cancellation of an already sent transaction. No offline queue or falsely durable browser draft.

Existing triggers reject published version edits/deletion and submitted record rewrites/deletion, including answer JSON, author/client/version/timestamp/metadata. There is no edit/delete/correction/approval endpoint. Draft saving is visibly disabled; corrections/uploads/visual publishing remain Future Development in database mode. Original preview interactions stay isolated.

## Staff/Admin routes and exact historical reads

| Route | Behaviour |
| --- | --- |
| `/clients/:id?tab=care` | Assigned/readable Care Plan categories |
| `&sub=:templateId` | Bounded exact-version history for that client/form |
| `&sub=:templateId&item=:recordId` | Original submitted detail |
| `/clients/:id/records/new?templateId=…` | Assigned current published form |
| `/admin/clients/:id?tab=care` and sub/item selectors | Desktop assignment/published metadata and read-only records/Drawer |
| Admin `&sub=…&version=N` | Explicit read of a published version, never an edit |
| GET `/api/clients/:id/care-templates` / `/:templateId` | Safe catalog / assigned form DTO |
| GET `/api/clients/:id/care-records` / `/:recordId` | Client history / exact record; optional validated sub/range/page filters |
| Corresponding GET `/api/admin/clients/:id/...` | Management-only reads, including published-version selector |

History orders by submittedAt then UUID descending, six Staff/twenty Admin rows with bounded Previous/Next. The catalog and published-version metadata are capped at 100; exact assigned/historical version retrieval does not substitute one of those latest metadata entries. Definition bodies are not bulk-loaded with published-version lists. Detail is independently scoped to client/template even outside the current history page/filter. Unknown/duplicate/array/malformed query parameters fail safely. No answers/text search in URLs or unrestricted export.

Each record fetch joins its own immutable version definition. Newer valid, archived or malformed assignments cannot change or block valid old detail rendering. Template titles use exact definition name where present; legacy definitions without a name use the current related display name without inventing a historical name snapshot. Record metadata excludes request digests/context/GPS/passwords. Empty results, unavailable IDs, invalid definitions and service failure have safe outcomes.

Minimal `care.submitted` audit contains actor/org/record/client/house/template IDs, version and off-shift boolean. Answers, clinical text, reason and question responses are excluded. This is append-only mutation audit, not a complete production compliance/retention system.

## Verification and handover

Focused checks passed: 528 units including 47 new strict form/JSON cases; 262 disposable PostgreSQL cases including 75 new Care cases; four focused 390px Staff / 1280px Admin journeys locally and on actual Neon. These cover conditional/repeating inputs, v1 meaning after v2 assignment, stale forms, off-shift validation, on-shift GPS-test context, double taps, uncertain responses and transfer access. Test version publication is guarded fixture configuration only. Browser network/service faults and GPS are deliberately simulated; rollback uses actual local PostgreSQL trigger failure. The original Chromium preview regression passed once: 619 passed / 126 intentional narrow-width skips. Production build, isolation, lint/type/format/schema and source/bundle scans passed. Full authenticated suites passed locally (77 passed, four intentional skips) and on actual Neon (77 passed, four intentional skips). Final read-only development checks confirmed 20 Care originals with 20 matching minimal audits, intact exact versions, inactive test accounts, eight source-matching migration checksums and 271 unchanged pre-existing immutable attendance/audit/documentation records. [Implementation status](implementation-status.md) records final broad checks and limits.

No real client information, production database change, APK/PWA generation, deployment or submitted-artifact modification. Organisational privacy/history/timing/template/correction governance, least-privilege roles, retention, backups/recovery, monitoring, physical HTTPS/Android and broader accessibility/security/operations acceptance remain outstanding.

Recommended separately authorised **Phase 2I — Android/PWA preparation**: audit hosting/HTTPS/origin/session/deferred-feature boundaries and device support, plan explicit physical acceptance, and retain secure no-cache/no-offline-write handling until separately reviewed. Do not enable clinical/file/Charting/House Diary/correction/publishing services as a packaging shortcut. Do not begin Phase 2I automatically or alter the frozen academic submission.
