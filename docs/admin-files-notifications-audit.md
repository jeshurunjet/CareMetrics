# Admin files, notices, concerns and reports — Phase 1E.4B

Fictional development-session UI only. No trusted authentication, database, private file service, notification delivery or durable audit is connected. Reload/logout discards changes. The opted-in Admin browser contains broader fictional information; Staff projections and role demonstrations are not a confidentiality boundary.

## Checkpoint and source

Phase 1E.4A is locally checkpointed at **9fb28d99ae7406640162b09b1e91aa5382833b5e** on `phase-1e4a`. Work is isolated on `phase-1e4b`. Its 333 frozen source/test/tooling hashes still matched its successful final runs; fresh lint/types/format and all 340 units passed before committing. Prior complete browser results remain in [archived status](history/phase-1e4a-status.md). No reset, discard or remote push. References, original CSS, previous evidence and fifty unrelated duplicate PNGs remain preserved.

Read root/reference engineering instructions and the phase's required contracts. Original `admin/pages/Governance.tsx` supplies FilesPage, AdminGallery, FileDrawer, NoticesPage/NoticeList, NoticeForm, RelatedNotices, ConcernList, ConcernReview/OutcomeModal, Reports/ReportsPage and AuditLog. Existing Admin shell/core, Staff galleries/files/policy, official feeds/reads/concerns and shared model were inspected. Legacy views remain unused. Installed Next page/client-boundary guides were consulted.

## Files

The file directory uses the existing `StaffSnapshot.attachments` and `FileRecord` objects; management reads include only explicit client/house associations with existing parent/uploader relationships. Filename never determines ownership. Search, type, client, current related house, uploader, NZ upload-date range, available/removed/all status, sorting and 12-row pagination are provided. Parent Client/House Files tabs retain the source gallery grid and link to the same file drawer.

The source drawer retains preview, metadata, association link and management removal action. Existing FileImage, closed demo-asset registry, DownloadAction, MIME/size formatting and provisional selection policy are reused. A missing PDF/unsupported format or metadata-only selection has no invented preview/download URL. Removed files cannot resolve a demonstration asset. Genuine public example downloads remain explicitly harmless and public.

AdminGallery reuses FileUploadArea via a narrow completion service callback, keeping selection/object URLs/timers and metadata separate from management mutation. File type/extension/size validation is the same provisional 15 MiB configuration used by Staff, rather than the source Admin's conflicting 10 MB example. Description, unsent removal, cancel, labelled simulation/progress/failure/retry and completion are retained. Completion validates again and records metadata under the exact selected gallery and management actor; no contents, File/Blob or object URL enters the snapshot or browser storage. Temporary resources are released through the existing component lifecycle.

Only Administrator/Manager may call `removeFile`. It validates the file, role/active actor/organisation, reason, current state and event timestamp. Confirmation names the file and parent, explains Staff hiding and retained metadata, and requires a reason. `removed` records actor ID/name/time/reason without replacing original availability, filename, parent, uploader or upload time. Staff list/detail projections exclude it; management may inspect the retained row. No object is deleted; restoration and retention policy remain provisional and unavailable. Parent concern/notice files are not silently treated as gallery files.

## Official notices

One existing Notice array serves Admin and Staff. Directory search/type/priority/status/context/date filters, sorting and pagination retain source tables. Create/Edit Draft keeps the source message/side-preview layout. Supported audiences are the existing organisation, employee, house and role model plus an explicit authorised-client audience; category/association independently constrains Staff visibility. Client/house notices require the matching subject audience or an explicitly assigned employee. Audience shape, role/IDs, content bounds and relationships are revalidated. An employee audience cannot bypass client/house assignment. Publication records the active fictional management actor/time, and eligible current Staff feeds/context cards/counts derive from the same snapshot. There is no push/email/SMS or real employee delivery.

Drafts may retain an empty message but require a title and valid audience/association; publication requires a message. Draft editing stores the previous content/audience/status metadata. Published/withdrawn notices are immutable through save. Controlled withdrawal requires confirmation, hides the feed and retains content/audience and a previous-state event; changing a published message requires a separate explicit notice. No hard deletion/republication shortcut is added. Staff projections omit management change history, and scoped merges preserve it. Employee read state is neither reset nor shared with other employees.

New secure notice attachments remain Future Development; existing exact-parent demonstration attachment metadata/downloads are preserved. The source's arbitrary filename-only attachment picker is not represented as secure storage.

## Concerns

Admin reads the exact Staff-submitted Concern array, with original author/context/text/time/priority and exact parent attachment metadata. Queue search/priority/status/house/client/NZ submission-date filters, sorting and pagination remain bounded. Original values are never rewritten. Status vocabulary is consistently Submitted, Under Review, Resolved and Closed.

Management actions repeat role/active actor/organisation checks and append review metadata with reviewer/time/action/previous and next status. Submitted may enter review or resolve; review may resolve; resolved may close or reopen; closed may reopen. Resolve/Close require an author-visible outcome. Internal Note and Staff-Visible Response are explicit separate actions. A response confirmation explains visibility. Internal notes and full management review events never enter `projectConcern`; submitting Staff sees only the permitted current status/response, and other employees cannot read the private concern. Current house/client access still applies; no historical access exception is invented. Management retains previous responses in review events. Scoped merges preserve private metadata without returning it to Staff views.

Review never publishes a notice. A separate Create Notification link opens an empty explicit configuration flow. High-priority concerns retain guidance that the feature does not replace urgent incident/emergency procedures. No escalation/delivery guarantee is claimed.

## Reports and audit

Source reports cards, period selector and client table show only read-only summaries derived from current fictional records: directory totals, scheduled shifts/attendance exceptions, submitted documentation and pending queues. Period-filtered versus current totals are labelled separately. There are no clinical analyses, payroll calculations or invented GPS statistics.

Development Audit Preview derives only existing file-removal, notice-change, concern-review, record/attendance/leave decision and template/category metadata. Missing entity/shift event history is not fabricated. Latest-configuration metadata is labelled as latest, not a full sequence. Rows show actor/time/entity/action/record/change, with search/user/entity/date filters and bounded detail/pagination. Internal concern-note contents are not copied into audit summaries. This is incomplete editable browser state, not append-only, tamper-proof, durable or legally sufficient. Exports, certification, retention controls, restoration, financial/payroll reporting and comprehensive health analytics are explicitly Future Development; disabled buttons cannot report false download success.

## Permissions and future services

Administrator and Manager retain the existing single-organisation operational scope. No additional Senior permission, narrower manager-house grant or changed Administrator-account privilege is invented. Staff/Senior/unknown roles reject every management read/mutation. Admin server pages retain the development-only production gate and strict scalar/query/ID syntax validation. Well-formed missing session IDs show generic unavailable after management opt-in; malformed selectors return 404. All new routes refuse production even when the preview flag is enabled.

Before real data, trusted Auth.js identity and server organisation/role/house/parent checks are required on each read/write; Prisma/Neon transactions, foreign keys, immutable history and concurrency; private Blob upload/retrieval/removal and scanning/retention/restoration policy; durable trusted audit and approved notification/concern handling. Browser roles/time/metadata are demonstrations only. Existing care revisions, template versions, attendance, shifts and leave are not changed by these operations.

## Components and intentional differences

New `admin/files`: FilesPage, AdminGallery, FilePanel. New `admin/notices`: NoticesPage, NoticeEditor, ConcernQueue, ConcernReview, RelatedNotices. New `admin/reports/ReportsPage`. Shared `admin/governance`: pure adapter, derived audit, context/date filters and route validation. Existing PageHead/Panel/KV/Pill/DataTable/SubTabs/Filters/Field/SelectField, Drawer/ConfirmDialog, Staff Modal/Btn/Empty/Banner/files and unsaved guard are reused. No new framework/dependency or original stylesheet change.

Required extensions include exact shared associations, fuller filters, honest simulated storage/delivery wording, explicit author-visible responses/private notes, retained previous notice states and truthful bounded audit. The source's fake download successes, immutable audit claims, implicit concern-to-notice link and conflicting file limit are replaced by those contracts. Original typography/palette/layout/classes remain. Independent design approval, exhaustive accessibility and physical-device/Firefox/Safari acceptance remain outstanding. Verification and representative evidence are recorded in implementation status.

## Automated coverage and final results

The 49 new unit cases cover the requested Files 1–8, Notices 9–17, Concerns 18–25 and shared-state/history/audit invariants. New browser tests cover the corresponding actual workflows and desktop/route gates; existing complete regressions retain workforce, leave, builder, care revisions and all Staff paths. Unsupported exports/audit wording are checked through the UI; production refusal is verified against the built app. No older test assertion changed.

Node 22.23.4/pnpm 10.15.1: zero-warning lint, strict types, formatting, **389 units/16 files**, build and **141 distinct production-isolation URLs** pass. One final frozen full Chromium regression: **619 passed / 126 intentional narrow skips**; subsequent complete six-width Admin: **186 passed / 126 intentional skips**. All **354 frozen source/test/tooling hashes** remain unchanged. Original 51 reference files/three CSS copies match, ten restricted markers are absent from 90 production client chunks and 12 relevant URLs return HTTP 200 on the unchanged 8443 preview. Evidence contains **37 raw PNGs / nine reviewed paired boards** plus the three mobile integrations included in that raw count. See [implementation status](implementation-status.md) for run ordering, superseded focused failures and remaining browser/device limits. No remote push, production backend, global locking or Phase 1E.5 work occurred.
