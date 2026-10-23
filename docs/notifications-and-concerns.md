# Staff Notifications and Concerns — Phase 1D.3

This is a fictional development-only UI migration. There is no real notification delivery, trusted authentication, production authorisation, database, audit service or management review connection.

## Source and structure

The active source is Notifications in `staff/pages/Other.tsx`, ConcernDialog/ConcernList in `staff/pages/Shared.tsx`, the Client/Houses profile sections and Home notices. Unused legacy NotificationsView is not substituted. Existing Staff navigation, PageHeader, Tabs, Card, Modal, Banner, FormField, SearchInput, Btn, Icon, Status and the original notice/list/choice/form classes are reused. Original reference files and three original CSS copies remain unchanged; scoped extensions live in bootstrap.css.

Focused `staff/notifications/` modules separate orchestration, filtering, lists, details, form, contextual lists, statuses, attachment presentation, pure queries/mutations, types and server-only fictional seeds. One StaffSnapshot/provider supplies all screens. StaffShell now consumes that provider inside its boundary, so unread badges update with Dashboard and detail actions rather than holding the initial prop snapshot.

## Official notices and audiences

The existing Notice retains stable ID, title/body, category, related ID, publisher display, UTC date and publication status. It adds priority Normal/Important/Urgent, publisherId, a discriminated targetAudience (organisation, employee, assigned house or matching role) and optional attachment IDs. The old optional audience string is retained solely for original-renderer compatibility; active access uses targetAudience only. Fictional `management-demo` publisher references are descriptive seed metadata, not authenticated accounts or a completed publisher directory; the existing management display names are retained without promoting coworker support workers to managers.

`visibleNotices`, `getNotice` and queries recheck supported preview role, Published status, audience and exact category-specific subject association. Organisation scope means the single fictional preview organisation only. A house notice does not include every client notice at that house. A staff category never bypasses its audience. Filters search authorised message/title/publisher/context, then category, unread and inclusive NZ publication dates; newest-first ordering is shared. No staff publish/edit/delete/audience-change operation exists.

Serialisation removes restricted house/client notices, other-employee private notices and drafts before the snapshot reaches the browser. Initial s1 still receives n1/n2/n3 with two unread, preserving earlier fixtures. h2 has no house notice; c1/c2 have no client notice. Additional excluded fixtures exercise private employee/client scope. Broad-snapshot unit cases recheck employee, role, house, draft and wrong-category targets.

## Employee-specific reads

NotificationReadState stores notificationId, employeeId and UTC readAt independently of Notice. Opening details marks the current employee's authorised notice read, matching the source interaction; repeating it is idempotent. The source has no Mark Unread control, so none is introduced. Header, sidebar/menu, overview and Dashboard derive counts from the same current provider state. There is no read-receipt persistence, localStorage layer, background synchronisation or cross-device claim. Reload restores fixtures.

## Own concerns

Concern has stable ID, title/description, client-or-house context/target, priority Low/Medium/High, submittedById, UTC submittedAt, Submitted/Under Review/Resolved/Closed status, optional staff-visible response, resolution timestamp and attachment IDs. These are separate records from official notices. Management-only internal notes are not part of the staff contract: an explicit field projection also strips them from broader fixtures. Responses deliberately represent only notes intended for the submitter, not all review notes.

The original has no configured concern-category field; none is invented. General submission separates context and authorised target selectors, while profile links preselect both. The employee is derived and read-only. Validation rechecks known context, exact assigned subject, trimmed required title/description, supported priority and selected-file metadata. Creation ignores forged author/status/response/notice fields and forces Submitted. It changes neither notices nor leave, shifts, attendance or other existing records. No review/resolve/delete/publish operation is available to staff.

High priority retains the source level and shows organisational urgent/emergency-procedure guidance. There is no invented clinical escalation, emergency call, SMS, guaranteed response or real management delivery. Submission explicitly confirms development-session creation only. Unsaved form navigation/Cancel/Escape use the existing shared guard; successful submission leads to own history/details. Submit/Cancel/close are guarded during that completed-submission transition to prevent a repeated action from superseding the details navigation. History supports search, status, context and date filters, newest first. Seeded Submitted, Under Review, Resolved and Closed examples include fictional staff-visible responses; other authors and inaccessible subjects remain unavailable.

## Files

Selection reuses Phase 1C.4's FileRecord association, provisional `validateFileSelection`, accepted formats and size formatting. The source concern form retains only a filename and has no image-preview workflow; this phase retains validated name/MIME/bytes only. It deliberately does not run Gallery's simulated upload or claim its completion. No File, Blob, object URL or file contents enters the provider. Selection can be removed before submission; submitted metadata uses association scope concern with its own ID and availability sessionOnly. Contents cannot be previewed/downloaded after submission; the form and details explain this.

The client notice has an explicitly associated bundled public TXT example using the existing closed demo-assets registry and a genuine download. Attachment reads recheck the authoritative parent plus its own attachment IDs and exact association; arbitrary caller IDs/URLs are not authority. No private URLs, real uploads, permanent storage or security scanning are implemented. Gallery ownership/removal policy is unchanged.

## Integration and routes

`/notifications?tab=all|client|house|staff|concerns` remains the sole destination. `item` opens notice details; `concernId` on tab concerns opens own concern details; `action=new` opens submission. Optional `context=client|house&targetId=…` scopes profile links/forms. Details close to that filtered category. Dashboard's same-data notice cards link to details. Client overview and House concerns tab use one contextual component with separate official notices and My submitted concerns, view-all and preselected concern actions. Its compact House overview variant retains the original highlighted latest-notice banner with priority/date/details/view-all; own history remains in the concerns tab.

Server preview parsing rejects malformed/repeated/conflicting selectors and inaccessible context targets with 404. Missing or private notice/concern IDs show generic unavailable modal content within the authorised overview (HTTP 200), matching existing session-only record routes. This also handles new IDs lost on reload. Context/profile subjects still return server 404 when unavailable. Seeded links survive refresh; browser navigation preserves the shell provider for session mutations. Every preview route still refuses production even when the flag is set. These mock checks are not production server access enforcement.

## Intentional differences and future work

Search/date/read/status filters, preview guidance, unread text, message snippets, priority labels, breadcrumbs, explicit detail actions and full Concern Details extend source layouts. Under review is consistently labelled Under Review. Profile concern lists are restricted to the author; the export's all-author list is deliberately not reproduced. Management-only notes are excluded. The original's High-priority call instruction is replaced with the requested organisational-procedure guidance, with no automated emergency action. Source has no concern detail modal; its history card is the nearest comparison. UI comparisons demonstrate documented fidelity, not exact pixel parity or independent design acceptance.

Future Admin review/publication must operate on these same records, with separate staff-visible response and internal-note fields. Add trusted Auth.js identity, organisation/role/house/employee server policies, Prisma/Neon notice/concern/read relationships, immutable review history/concurrency and durable audit before real data. Private Blob operations require authorised parent reads/writes and approved retention/type/size/scanning policy. Agree concern categories, urgent handling, intended audiences, read-state semantics and response/internal-note visibility with the organisation. No policy is inferred from UI fixtures.

Final results: lint, strict types, formatting, 120 unit tests, all 435 browser cases, production build and 68 production-isolation checks pass. Ten targeted transition cases also passed across five widths. Evidence contains 120 raw captures and 20 paired boards; see implementation-status.md and ui-comparisons/phase-1d3/README.md. Host Node 25.9.0 is available; Node 22 verification remains outstanding if absent. Physical devices, Safari/Firefox, exhaustive accessibility and organisational design/privacy/security acceptance remain separate.

## Verification coverage

| Brief checks | Evidence |
| --- | --- |
| 1–7 notice scope/category/combined list | Unit broad-snapshot category, subject and employee/role/house audience cases; browser category/overview and direct-ID tests. |
| 8–11 filters/order/details | Unit search/NZ dates/newest-first; browser category/search/date/unread/keyboard/details/attachment/profile-link checks. |
| 12–13 employee reads/live Dashboard | Unit separate employee read timestamps and idempotence; browser header/sidebar/Dashboard updates and reload. |
| 14–17 Client/House contexts | Browser exact official lists, empty contexts, preselected forms, view/detail links and earlier navigation regression. |
| 18–22 concern validation/submission/ownership | Unit forged IDs/contexts/author/status, Submitted and own projections; browser field errors, read-only identity, selectors, session creation/history/reset. |
| 23–27 management separation/review display | No publication/review mutation exports or controls; unchanged notices/attendance/leave/shift arrays; four fictional statuses and staff-visible response details. |
| 28–30 direct IDs/privacy | Unit broad fixtures/projection and browser private/missing notice/concern IDs, malformed URLs and inaccessible context HTTP responses. |
| 31–35 navigation/responsiveness/regression/isolation | Dashboard/profile/menu, Back/refresh, five-width checks/captures, long text, focus/discard, earlier Staff suites and 68 production refusal checks. |

Additional selection checks cover provisional metadata policy, invalid types, unsent removal, no retained contents and authoritative parent attachment references. Source comparisons run only when the local ignored reference exists; functional checks and migrated captures remain available in a fresh clone. No assertions were removed to bypass an earlier feature; the obsolete concern placeholder assertion now verifies the actual bounded form and preselected context.

## Changed files

New components/contracts under `src/modules/staff/notifications/`: Notifications, NotificationFilters, NotificationList, NotificationDetails, NotificationStatus, ContextualNoticeList, ConcernForm, ConcernHistory, ConcernDetails, ParentAttachments, adapter.ts, seed.ts and types.ts. New tests: `tests/unit/notifications.test.ts` and `tests/e2e/notifications.spec.ts`.

Existing integrations: `src/app/(staff)/notifications/page.tsx`, `src/components/layout/StaffShell.tsx`, `src/modules/staff/data/{types,selectors,development-mock-adapter}.ts`, `src/modules/staff/ui/{Dashboard,NotificationCard,ClientProfile,HouseProfile}.tsx` and `src/styles/bootstrap.css`. Existing `tests/e2e/houses-clients.spec.ts` now checks the real concern form instead of its old placeholder. `tests/e2e/roster.spec.ts` waits for the selected house URL/value before advancing the day, retaining its original content and access assertions. Scripts `ui-reference-server.mjs` and `verify-production.mjs` adapt reference fixtures and extend production refusal checks.

Documentation: README, implementation-status, route-map, ui-migration-notes, file-architecture, this contract, historical Phase 1D.2 status and the Phase 1D.3 comparison evidence. No dependencies, original reference assets/CSS, Admin screens or backend services changed.

Future persistence should enforce a unique `(notificationId, employeeId)` read relation plus trusted organisation and parent/author scope. Concern status transitions and response/internal-note visibility require approved management permissions and durable review history; client-side fixture IDs are not database authorisation.
