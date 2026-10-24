# Implementation status — Phase 1E.4B

Archived completion report, originally written before the authorised 4B checkpoint/push. The completed checkpoint is `0de1bbbb8bdd1b372b8ce1672a14a15806282513`; see the [current status](../implementation-status.md) for Phase 1E.5.

Phase 1E.4B is complete within its fictional development-session UI scope. Files/Galleries, official notices, concern review and bounded Reports/Audit use the existing shared snapshot. [Management contracts](../admin-files-notifications-audit.md) define behaviour, permissions and future services; [submission MVP scope](../submission-mvp-scope.md) records the reduced later backend plan. Previous final results are preserved in [Phase 1E.4A status](../history/phase-1e4a-status.md).

## Git checkpoint

Full Phase 1E.4A is locally committed at **9fb28d99ae7406640162b09b1e91aa5382833b5e** on `phase-1e4a`. Phase 1E.4B is on **phase-1e4b**, prepared for the user-authorised commit and push as a full application version. Previous `e3fd925`/earlier branches, original references/CSS, tests/docs/evidence and fifty unrelated duplicate screenshots remain preserved. No reset/discard or remote push.

Before checkpointing, all 333 source/test/tooling hashes matched 1E.4A's successful final browser runs; fresh lint/types/format and all 340 units passed. The earlier complete results remain archived rather than unnecessarily rerunning that entire preceding phase before implementation.

## Implemented scope

| Area | Development UI state |
| --- | --- |
| Files | Shared metadata directory, type/client/house/uploader/NZ upload-date/status filters, sort/pagination and source drawer |
| Galleries | Exact Client/House Files tabs, source grid, shared selection/validation/simulation/error/cancel/preview/download components |
| Logical removal | Management-only confirmation/reason, retained original metadata and actor/time event; hidden from ordinary Staff galleries |
| Notices | Shared directory, draft editing, configured audience validation, publication confirmation and Staff feed/context visibility |
| Publication history | Read-only published/withdrawn content, controlled withdrawal and retained previous-state metadata; no hard delete |
| Concerns | Shared Staff submissions, filtered queue, original details, review/status/internal note/explicit author response and retained events |
| Privacy demonstrations | Staff projection omits internal notes/management events; own concern history and exact notice audiences remain scoped |
| Reports/Audit | Read-only fictional summaries and labelled metadata-only Development Audit Preview; unsupported exports/controls disabled |
| Submission boundary | Later mobile-first backend MVP documented; no global feature locking in this phase |

New Admin files/notices/reports modules reuse existing shell, tables, panels, forms, drawer/confirmation, Staff selection/image/download/policy and shared session/provider. Governance adapter/filters/audit/route-validation keep relationships and operations separate from presentation. Existing core Administrator-account limits remain. No backend is connected. Auth.js, Prisma/Neon, real GPS attendance, private Blob, durable audit, delivery, deployment and Phase 1E.5 remain outside this assignment.

## Final verification

Established runtime: isolated Node **22.23.4** / pnpm **10.15.1**; system environment and existing 8443 preview are unchanged.

| Check | Final result |
| --- | --- |
| ESLint | Pass, zero warnings |
| Strict TypeScript | Pass; canonical generated types restored after browser servers stopped |
| Formatting | Pass |
| Unit tests | **389 passed / 16 files**: 340 retained + 49 new |
| One complete five-width Chromium regression | **619 passed / 126 intentional narrow Admin skips**, 745 total, 12.8 minutes; zero failures |
| Complete six-width Admin Chromium suite | **186 passed / 126 intentional narrow skips**, 312 total, 5.2 minutes; zero failures, includes 1600px |
| Production build | Pass |
| Production isolation | Login inert; **141 distinct preview URLs refused** even with preview flag enabled |
| Source freeze | All **354 source/test/tooling hashes unchanged** through both final browser runs/build |
| Original integrity | All **51 archive files / three original CSS copies** unchanged |
| Production client chunks | **10 restricted fixture markers absent from 90 chunks** |
| Existing local preview | **12 representative new Admin/related Staff URLs return HTTP 200** on unchanged port 8443 |
| Evidence | **37 raw captures / 9 reviewed paired boards**, including three mobile Staff integrations |
| Repository checks | git diff --check clean; no reference tracking, dependency/lockfile/generated next-env diff or old test assertion edits |

Widths are 375/390/768/1280/1440 for the full regression, plus 1600px in Admin. The 126 skips are intentional management workflow skips below the source's 1024px desktop breakpoint. Gate/negative-route tests and narrow captures still run. All existing Staff/core/workforce/builder/record-review assertions remain intact. See [evidence index](../ui-comparisons/phase-1e4b/README.md) for source mappings and visual limits.

Development used focused checks rather than repeated complete suites: all new workflows passed at 1280px, followed by the six-width new-module run (**30 passes / 18 intentional skips**). After stabilisation, the established complete regression and complete Admin suite each ran once on frozen source. Static/unit/build/isolation checks passed on that same source. No application source or test changes occurred during either final browser run.

Superseded focused failures were new-test assumptions about parent gallery labels, house-card/button versus link, notice/concern card semantics, modal-scoped submit, exact search/close labels and route readiness. A directory Type filter was briefly selected before New Notification loaded; tests now wait for the actual editor heading/value. The comparison renderer initially lacked three original management permissions and its Save Draft required the source's own discard-navigation confirmation. A Staff mobile notice capture needed the actual Overview route before scrolling. These attempts are not counted as passing final runs; existing assertions were not weakened. Visual refinements to spacing, table-cell widths, source textarea rows and effective audience labels preceded the frozen final checks.

## Integration and coverage

New units cover exact file association/shared identity, configured type/size policy, logical removal/retained metadata, invalid IDs/roles/events and Staff omission/merge; draft/history/content validation, audience IDs/context/employee restrictions, publication/read counts, withdrawal immutability and history projection; same Staff concerns, management status validation, original preservation/internal-note privacy/author response, no automatic notice or care/workforce changes; audit derivation without invented events.

Browser workflows exercise shared file directory/filter/details/removal → mobile Staff exclusion; exact Client/House galleries and selection validation/failure/retry/cancel/completion; draft/edit/house publication → Staff read state → withdrawal; invalid employee/client audience → valid contextual client notice; Staff concern submission → management internal note/start/resolve → own Staff outcome without internal text; unavailable report exports and bounded audit search; desktop gating and malformed direct routes. Existing full tests preserve care revisions, immutable versions, workforce, leave and form-builder behaviour. Read/role/parent protections remain development demonstrations, not trusted server enforcement.

## Limitations and next step

Browser roles/projections, timestamps, file metadata, saves, review and publication are session-only demonstrations. The opted-in Admin browser contains broader fictional data; it is not a confidentiality boundary. No real upload/object deletion, private retrieval, notification delivery, durable audit or database write occurs. File retention/restoration, formal notice revision/retention, concern handling/escalation and organisational permissions need policy approval. Current Staff house/client access continues to apply to history. Existing Settings/unsupported controls remain intentional future placeholders. No real data may be introduced.

There is no known local UI implementation blocker for this phase. Firefox's previously documented pre-launch profile-folder failure remains unresolved. Safari, physical devices, exhaustive accessibility and independent design acceptance remain unverified. Recommended next, after review: separately authorised **Phase 1E.5 Final Integration and UI Freeze**, then the reduced mobile-first backend implementation. No next phase starts automatically, and no global submission locking was introduced.

## User-authorised Git publication

After phase verification, the user requested committing and pushing `phase-1e4b`. This checkpoint contains the full tracked application and its history, including Phase 1E.4A, the Phase 1E.4B implementation, tests, documentation and representative evidence. Earlier branches remain preserved. Local reference source, generated output, environment secrets and fifty unrelated duplicate screenshots are excluded. No force-push or reset is used.
