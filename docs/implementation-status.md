# Implementation status — Phase 1C.3

Staff Charting and repeating editable tables extend the existing development-only UI. Care Plan and Charting remain separate staff tabs over one typed form, assignment and record model. No production backend feature is connected. Earlier status: [Phase 1C.2](history/phase-1c2-status.md), [Phase 1C.1](history/phase-1c1-status.md).

Checkpoint `6a5c939` on `phase-1c2` passed all existing checks before changes: lint/typecheck/format, 49 unit tests, 175 browser cases, build and 27 production-isolation URLs. Current work is on local branch `phase-1c3`; `main` remains at `9cecc8b`. No reset, discard or remote push. Pre-existing duplicate screenshots remain untouched.

Statuses: `original` = preserved source; `ported` = adapted UI; `UI-matched` = inspected source comparisons with documented extensions; `tested` = relevant checks pass; `backend-connected` = authorised persistent services; `blocked` = external prerequisite. Visual matching is not independent design approval.

| Area | Status | Evidence and boundary |
| --- | --- | --- |
| Previous Staff, Diary and Care Plan | ported, tested | Existing routes/workflows retained; shared renderer/lifecycle reused. All earlier regression cases included in verification. |
| Charting categories | ported, UI-matched, tested | Client assignments drive names/descriptions/counts/latest dates/version/history/new actions; exact no-assignment state. Three chart categories for c1, one for c2, none for c3. |
| Chart history | ported, UI-matched, tested | Configured read-only history columns, client/category scope, newest-first, search/date/author filters, six-row pagination and explicit details links. Equipment row-count summaries open full details. |
| Shared repeating form field | ported, UI-matched, tested | Stable field/column/row IDs; configured scalar controls, min/max/required/cell validation, Add Row/Remove Draft Row, focus and responsive source row grid. No Charting-only form engine. |
| Chart drafts/submissions | ported, UI-matched, tested | Shared author-only incomplete drafts, row-value/ID/order retention, version retention, separate timestamps, off-shift reason, discard prompts and session-only success. |
| Submitted versioned tables | ported, UI-matched, tested | Original-version columns/values in accessible read-only scroll regions; historical v1 and assigned v2 fixtures. No submitted row edits/removal. |
| Numeric chart | ported, UI-matched, tested | Source CSS bars for configured numeric duration with units, actual submitted values, zero/missing/empty handling and semantic table alternative. No clinical interpretation. |
| Corrections | ported, UI-matched, tested | Shared requests plus optional original field/row/column target, validated and stored separately. Original unchanged; staff cannot approve/reject. |
| Original design/styles | original | All 51 extracted source files and three active original CSS copies unchanged; scoped bootstrap additions only. No new dependencies or font binaries. |
| Production preview isolation | tested | 35 URLs refused with flag enabled; login inert and fictional content absent. Fixed-demo lookup is not production authorisation. |
| Gallery/remaining Staff/Admin builder/backend | original / placeholders / blocked | Not implemented in this phase. Real identity, organisation/role/house enforcement, persistence, GPS, secure files, corrected-version review, audit and deployment remain future work. |

## Verification

| Check | Result |
| --- | --- |
| `pnpm lint` | PASS, zero warnings |
| `pnpm typecheck` | PASS, strict source/tests and generated routes |
| `pnpm format:check` | PASS |
| `pnpm test` | PASS, 63 unit tests across six files |
| `pnpm test:e2e` | PASS, 225 cases (45 × five widths), including all 175 earlier regression cases |
| Focused containment regression | PASS, all 10 Charting cases at 768px |
| `pnpm build` | PASS, production webpack build |
| `pnpm test:production` | PASS, 35 preview paths fail closed with flag enabled; login inert |
| Local smoke checks | PASS, Charting history and shared Equipment form HTTP 200 on existing port 8443 |
| Source integrity | PASS, 51 extracted source files and three original active CSS copies byte-identical |
| Visual evidence | 90 raw captures and 15 paired boards at 375, 390, 768, 1280 and 1440px |
| `git diff --check` | PASS |

Unit tests cover all seven supported table cell kinds, configured structures, required/min/max rows, unique IDs, malformed values, number/date/time/options, hidden/unknown cell clearing, scope, author-only drafts, row/order/value/version retention, off-shift rules, numeric chart values including zero/missing data, separate validated correction targets and unchanged submitted originals. Browser cases cover category/empty states, search/date/author/pagination, history/details/form routes, stable-ID add/remove/focus/max, cell/off-shift validation, partial draft/resume/submit, active demo attendance, old-version tables, targeted corrections, invalid/unassigned/private IDs, unsaved navigation and responsive bounds/source captures. All previous Staff/Diary/Care Plan and Admin desktop-gate cases remain passing.

Final visual review corrected crowded bar-date ticks, semantic row-heading contrast and inherited whole-table error borders. A subsequent 768px check found absolutely positioned screen-reader link labels escaping their scroll container; a relative positioning context contains those labels while preserving their accessible content. The final full suite passes after this fix, including all five captures with no collected pageerror events. No unintended page-level overflow or action overlap remains in the tested states. Original table/modal limitations and intentional workflow differences are documented; exact pixel parity is not claimed.

## Remaining limitations and next step

All records and attendance are fictional development-session state; reload/remount resets changes. No browser record storage was added to conceal that limitation. New IDs become unavailable after reload; seeded deep links resolve. Unknown/unassigned clients/templates and area/template mismatches return HTTP 404; invalid/wrong-client/private draft record IDs within an authorised profile show generic unavailable UI with HTTP 200. This is not authenticated server access enforcement.

Only one structured correction target can be selected; the text proposal may describe more. Approval, corrected versions, concurrency, published schema authoring/validation and durable audit remain unimplemented. Photo/file fields/cells and old table placeholders without configured columns remain explicitly unavailable. Nested tables, table-row reordering, advanced chart configurations, clinical validation and real uploads are excluded.

Host Node 25.9.0/pnpm 10.15.1; Node 22 is not installed and intended-runtime CI remains outstanding. Chromium viewport emulation does not certify physical-device keyboards, Safari/Firefox, exhaustive accessibility, external asset availability/licensing/privacy or exact visual parity.

Review Phase 1C.3, then agree a bounded next Staff UI migration (for example Gallery with real files deferred). No Phase 1C.3 implementation blocker remains for review. Changes are uncommitted on `phase-1c3`; nothing was pushed. No Phase 1C.4, Admin, backend or deployment work has started automatically. See [routes](route-map.md), [form contracts](configurable-forms.md), [migration notes](ui-migration-notes.md) and [visual evidence](ui-comparisons/phase-1c3/).
