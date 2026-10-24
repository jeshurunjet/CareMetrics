# Admin submitted records and correction review — Phase 1E.4A

This is fictional, development-session UI and pure shared-adapter behaviour. It is not trusted authentication, persistent records, production audit or a clinical workflow. Reload/logout resets changes. No real information may be introduced.

## Preparation and checkpoint

Read the root/reference AGENTS instructions, source audit, route map, implementation status, migration notes, configurable-form, Admin builder/core/workforce and Staff completion contracts. Inspected active Figma Docs.tsx SubmittedRecords, DiaryTable, RecordDetail, Corrections and CorrectionReview, plus Admin Dashboard/core and the existing Staff request/detail/history models. The legacy views remain unused.

Phase 1E.3 passed fresh Node 22.23.4/pnpm 10.15.1 lint, strict types, formatting, 294 units, six-width Admin browser tests (120 passes/84 intentional narrow skips), build and 119 production-isolation checks. Full tracked application checkpoint **e3fd92554b646543e98ddbd5501ba250aee07693** is on `phase-1e3`; work continues on `phase-1e4a`. Previous checkpoint `3f7b147`/branches, original references/CSS, screenshots and documentation remain preserved. Fifty unrelated duplicate PNGs remain untouched/untracked. Nothing is pushed. Phase 1E.4A work is not automatically committed.

## Navigation and submitted contexts

Existing `/admin/documentation?tab=records|corrections` replaces the two placeholders, retaining overview, categories, libraries, builder and assignments. One planned `/admin/documentation/records/[id]?kind=diary|care` detail route discriminates potentially colliding IDs. Care includes both Care Plan and Charting according to the actual template kind. One planned `/admin/documentation/corrections/[id]` review route uses the existing shared request ID. No competing API or detail hierarchy is introduced.

Every new server page calls requirePreview, rejects production even when the preview flag is set, and validates scalar selectors/IDs. Unknown syntactically valid session IDs show generic unavailable content after development management opt-in; malformed/repeated/unsupported parameters return 404. AdminAccess and pure reads/mutations repeat preview-role restrictions. Valid seeded links can refresh after opt-in; newly created IDs disappear on reload. Canonical links, breadcrumbs, Back/forward and client/house/author links remain. List filters/page state reset on remount, matching the established source approach.

A management DTO is derived from the existing DiaryEntry/CareRecord arrays. It requires a submitted non-draft record, valid author, subject/current-house relationship, category context or exact published version, and valid covered/submission timestamps. Invalid relationships are omitted and cannot be reviewed through direct IDs. House Diary has a house subject and no client association. Client Diary keeps its client and historical category-name snapshot. Care Plan and Charting preserve client/template/version and structured values; templates are never inferred from diary categories.

Counts derive from that same valid submitted collection: total, four contexts, pending care corrections, and recently corrected records (labelled seven-day demonstration view). Records show full stable IDs, subject, category/template, author, covered/submitted time, correction/status and details. Filters cover type, house, client, author, category/template, NZ covered-date range and correction status; search, sortable columns and 12-row pagination bound the view. Queue filters cover outcome, type, house, client, requesting employee, NZ request dates and text, with 12-row pagination. Correction status reflects the newest request; the separate Corrected indicator reflects an applied revision.

## Original, effective and historical records

Original DiaryEntry.body and CareRecord.values/status/author/timestamps/templateVersion are never replaced by review. Effective views are read-only copies derived from approved revisions. Shared StaffSnapshot and projectStaffSnapshot continue to hold/project raw originals: this prevents scoped Staff merges from accidentally writing effective values over the original. Embedded decisions/revisions travel through the existing corrections projection and stable-ID merge. There is no second Admin request collection, record store, localStorage database or fake API.

Details adapt original ad-grid-main Context/answers/history layouts. They show original author, created/covered/submitted time, original off-shift reason, subject links, exact template ID/version and original/effective toggle. Off-shift entry is informational, not invalidation or an attendance event. ReadOnlyFormValues is shared with Staff and renders exact-version sections, labels, option meanings and repeating columns. Original row IDs remain data identities/React keys; order is stored array order, with contained read-only tables. Unmapped historical top-level values are explicitly shown rather than discarded. No editable submitted cells or direct record save exists.

RecordRevisionHistory is shared by Staff/Admin, with six-request pagination, initial submission, original-content disclosure, requested reason/proposal/time, outcome, reviewer/time/visible notes, approved revision/base and effective/superseded indicator. Original content is rendered on opening its disclosure. Drafts do not pretend to have an initial submission. Legacy outcomes without new decision metadata remain historical labels and never invent a corrected value or actor/time.

## Typed proposals and immutable revision representation

CorrectionRequest keeps its existing recordType (missing means diary), recordId, requestingEmployeeId, reason/proposed text, requestedAt and status. Optional additions:

- `baseRevisionId`: current approved revision ID when a request is created; absent means original submission.
- `proposal`: discriminated Diary body or Care changes `{target:{fieldId,rowId?,columnId?}, value}`.
- `decision`: reviewerId, optional display-name snapshot, UTC decision time, visible notes and optional approved revision.
- Revision: stable revision ID, request ID, base revision ID and an immutable full effective body/values snapshot.

The request anchors record kind/ID; the original record anchors subject, author and exact template version. Decision metadata anchors reviewer/time. Revisions are embedded in the existing requests, avoiding a competing store or mandatory migration of older fixtures. Pure operations deep-copy proposals/approved values. Latest revision follows the explicit base chain, so equal decision timestamps do not cause arbitrary ordering.

Diary proposed text explicitly means replacement body only, with a changed short narrative required. Title/category/author/covered time are not silently inferred from free text. Legacy diary requests can use their existing proposal text as the intended body.

Structured Staff requests retain their explanatory text/optional stable reference. An explicit Apply a structured value checkbox enables the existing typed scalar/table renderer and begins with the current effective value. Both Care Plan and Charting offer original-version fields and table cells. Whole-table proposals retain existing row IDs, allow permitted add/remove/edit with new UUID row IDs, and are represented as explicit table values. UI selects one field/cell or whole table per request; the shared typed operation supports multiple changes. Legacy text-only structured requests remain readable/rejectable but cannot be automatically approved or parsed into answers. Management must explain rejection and obtain a new typed request.

## Validation and differences

Target field IDs and row/column pairs must exist in the record's original published version/current effective table. Unsafe/unknown IDs, partial row/column pairs, unsupported attachments/legacy table types, malformed rows, unknown proposed columns, duplicates, invalid options/types/bounds/dates, invalid row limits and unchanged values reject. Validation reuses Staff initial/normalise/validate semantics; the final candidate must satisfy the original version. Stored UTC datetime answers are intentionally converted through the existing NZ helpers. Historical published definitions never change.

No hidden historical values are silently sanitised away. A change hiding an existing answer blocks unless it is explicitly cleared in the same typed proposal; newly targeted hidden nonempty answers reject. The single-target UI cannot express every dependent multi-field combination: those requests must be clarified rather than silently applied. A richer multi-target editor is a future extension, not an implicit migration.

The original side-by-side ad-compare panels are retained. Diary replacement shows labelled original/proposed text using del/ins; it does not run the source's unbounded quadratic word-diff algorithm. Structured differences group by original section/field, show stable references and previous effective/proposed formatted values. Cell proposals identify row/column IDs. Whole-table differences label Added row, Removed row or Changed cell using stable row/column identities, plus explicit proposed row order. Status/difference meaning is textual, not colour alone. The original submission and current effective content remain separately inspectable.

## Decisions, conflicts and permissions

Administrator and Manager use the established single-organisation operational scope and active matching fictional actors a1/m1. No narrower manager-house grants or extra Senior permissions are invented. Ordinary Staff, Senior Staff, unknown roles and missing organisation/management actors reject reads and review mutations. Staff can request only their own submitted scoped records through existing adapters; no Staff review operation is added. Actual server authorisation and cross-tenant data modelling remain future requirements.

Approval requires an existing valid pending request, correct requester/author association, matching current baseline and valid typed proposal. Explicit confirmation explains that a new effective revision is created while the original remains. It records reviewer/time/optional notes and Approved on the same request; original collections, template definitions, attendance and shifts remain unchanged. Reject requires a visible reason and confirmation, retains the request/decision and leaves effective values unchanged. Completed requests cannot be decided again or flipped. Decision times cannot precede requests. The confirmation passes the current preview event time and advances the shared snapshot clock; it does not reuse the initial page-load time for a later request. This remains a client-supplied demonstration timestamp, not a trusted audit clock. Notes are visible to the employee, not internal management-only comments.

First valid approval wins for competing requests on the same baseline. Other old-base requests become stale and cannot be approved; they may be rejected with a reason. No automatic rebase or conflict override exists. A new Staff request captures the newly effective revision after the pending request has been resolved. Existing Staff duplicate-pending prevention remains; unit fixtures construct competing pending requests to exercise the conflict rule. No concurrency guarantee is claimed beyond this deterministic session adapter.

Current Staff house/client access continues to control both originals and revisions. Removal/transfer of current house access does not create an unrestricted historical exception. Staff details/cards, Charting history/numeric inputs and correction history derive the effective view while retaining the original in its disclosure. Original version/option/column meanings persist after newer publication. Notes/outcomes are available under the current authorised-record policy; no additional private reviewer-note channel exists.

## Dashboard, removal and deferred services

Dashboard derives submitted/pending/reviewed documentation information from this adapter. Care-record pending counts and queue links are explicit; attendance corrections remain a separate collection/review workflow, with separate counts and direct links. Decisions do not modify attendance, shifts, leave, balances or template assignments.

Controlled removal is a clearly disabled placeholder. No hard deletion, logical removal, restoration or invented retention period is introduced. Final retention/removal/restoration, access after transfers, reviewer scope/self-review, draft expiry, concurrency and organisational acceptance need decisions.

Future Prisma/Neon services should persist append-only originals, exact published definitions, typed proposals, baseline revisions, decisions and effective snapshots with foreign keys, unique request decisions and transactional compare-and-swap version checks. Derive identity/organisation/house scope from Auth.js on every read/write, paginate authorised queries on the server, use trusted timestamps and durable audit, and return persisted results before success. Private files require independent authorised Blob services and approved policy. No authentication, database, secure files, production audit, delivery, concern/publication/gallery/reporting/payroll/GPS/deployment or Phase 1E.4B work is included.

## Components and source fidelity

New `modules/admin/records`: adapter, RecordFilters, SubmittedRecords, SubmittedRecordDetails, RecordContent, CorrectionQueue, CorrectionReview, FieldDifferences and TableDifferences. Shared `staff/documentation`: revisions, proposals and RecordRevisionHistory, extending the existing request form. Existing Admin PageHead/Panel/Stat/KV/Pill/DataTable/Filters/SubTabs, Staff Btn/Modal/FormField/FormFieldRenderer/ReadOnlyFormValues/Pagination and unsaved guards remain shared. New review actions are inside the editor boundary; navigation still guards unsaved notes.

Intentional source extensions include summary counts, full IDs/search/date filters, raw-original/effective revision controls, typed/stable differences, blocked legacy/stale proposals, explicit decisions, visible historical metadata and controlled-removal guidance. The source only marks correction outcomes; the new effective revision requirement is implemented explicitly. Source attachments inferred from nearby timestamps are deliberately not copied: this phase has no reliable record-attachment relation or file service. Original CSS/reference files are untouched; small scoped additions stay in admin-migration.css. Desktop-only gating remains at the source breakpoint; Staff stays responsive.

## Verification and evidence

Final command results, run ordering and visual comparison inventory are recorded in [implementation status](implementation-status.md) and the [Phase 1E.4A evidence index](ui-comparisons/phase-1e4a/README.md). Initial focused failures were new-test assumptions about Empty's strong element, case-sensitive House diary labels, navigation readiness and collapsed history cards. A source-capture label selector and a premature migrated detail capture were corrected without weakening content/version/permission assertions. The original-reference pure-module graph was extended for new proposal helpers. These superseded runs are not counted as passing. The first full run (596 passes/108 skips/one Diary failure) was contaminated by a source-edit Fast Refresh full reload visible in its trace; a frozen-source full run replaces it.

Firefox's prior pre-launch profile-folder error remains unresolved. Safari/physical-device testing, exhaustive accessibility, independent Figma/design approval and organisational privacy/security acceptance are unverified. No exact pixel parity or production-readiness claim is made.

## Changed-file inventory

| Group | Files |
| --- | --- |
| New Admin records module | `src/modules/admin/records/{adapter.ts,RecordFilters.tsx,SubmittedRecords.tsx,SubmittedRecordDetails.tsx,RecordContent.tsx,CorrectionQueue.tsx,CorrectionReview.tsx,FieldDifferences.tsx,TableDifferences.tsx}` |
| Shared revision/proposal presentation | New `src/modules/staff/documentation/{revisions.ts,proposals.ts,RecordRevisionHistory.tsx}`; existing `RecordCorrectionForm.tsx` |
| Shared domain/request operations | `src/modules/staff/data/{types.ts,correction-service.ts}` and `src/modules/staff/care/adapter.ts` |
| Staff effective views | `staff/diary/{DiaryEntryCard,DiaryEntryDetails,CorrectionRequestForm}.tsx`, `staff/care/{AssessmentDetails,AssessmentRecordCard}.tsx`, `staff/charting/ChartingHistoryTable.tsx` under modules |
| Admin composition | Existing DocumentationPage and Dashboard; new planned `records/[id]` and `corrections/[id]` server pages under `/admin/documentation` |
| Scoped styles | `src/styles/admin-migration.css`; original global/Staff/Admin CSS unchanged |
| Tests/tooling | New `tests/unit/admin-record-review.test.ts`, `tests/e2e/{admin-record-review.spec.ts,admin-record-review-visual.spec.ts,record-review-helpers.ts}`; Admin Playwright matching, reference/production verification scripts |
| Documentation | README, implementation status, route map, source audit, migration notes, configurable forms, Admin builder/core contracts, Staff completion review, archived Phase 1E.3 status and this review contract/evidence |

No dependency/lockfile, original source asset, existing test assertion, production guard or unrelated module is replaced. No new persistence/authentication/file service or subsequent phase is introduced.

## Final verification

Node 22.23.4/pnpm 10.15.1: zero-warning lint, strict TypeScript, formatting, **340 units across 15 files**, build and **128 distinct production-isolation URLs** pass. Complete frozen five-width regression: **597 passed / 108 intentional narrow Admin skips**. Final six-width Admin run: **156 passed / 108 intentional skips**, including 1600px. All nine new functional workflows and the original Staff/core/workforce/builder assertions remain; the fresh runs use unchanged source/test/tooling hashes. The final set contains **90 raw captures / 15 reviewed paired boards**. Original 51 archive files and three CSS copies match; restricted fixture markers are absent from 132 production client chunks. No remote push or later phase began. This completes the bounded development UI scope, with production services/policies and broader acceptance still outstanding as described above.

Existing local 8443 preview smoke-check: all 12 representative Admin documentation/details/review/Dashboard and Staff Diary/Care/Chart URLs returned HTTP 200; the user server was not restarted.
