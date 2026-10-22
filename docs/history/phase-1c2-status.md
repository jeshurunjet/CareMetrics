# Implementation status — Phase 1C.2

Care Plan/Assessments now joins the existing Staff Application as a **development-only UI migration**. Forms are configuration-driven and records retain their original template version. No backend feature is connected or production-ready. Earlier checkpoints: [Phase 1C.1](phase-1c1-status.md), [Phase 1B](phase-1b-status.md), [Phase 1A](phase-1a-status.md).

Git checkpoint: `9cecc8b` on `main`. Its existing checks were rerun successfully before changes (33 unit tests, 120 browser cases, lint/typecheck/format/build and 20 production-isolation URLs). Only pre-existing duplicate screenshots were untracked; they remain untouched. Phase 1C.2 is checkpointed locally on branch `phase-1c2`; `main` remains at Phase 1C.1. Nothing has been pushed for this phase.

Statuses: `original` = source retained; `ported` = adapted; `UI-matched` = inspected against rendered source with documented differences; `tested` = relevant checks pass; `backend-connected` = authorised persistent services; `blocked` = external integration/decision required. Visual review is not independent design approval.

| Area | Status | Evidence and limits |
| --- | --- | --- |
| Previous Staff screens and Diary | ported, tested | All previous functional browser cases retained. Shared correction/metadata components now support diary/care discrimination. Login, My Shifts, Dashboard and Admin screen source unchanged. |
| Care Plan category list | ported, UI-matched, tested | Only active client-assigned published templates; descriptions, counts/latest dates, assigned version, history/new actions and exact no-assignment empty state. |
| Assessment history/details | ported, UI-matched, tested | Scoped category records, newest first, search/date filters, six-record pages, expandable answers and details. Read-only answers use the record's original version, including a v1 historical fixture alongside current v2. |
| Configurable forms | ported, UI-matched, tested | Eleven supported field types with sections, help, requirements, defaults, options, basic validation and declarative field/section visibility. No category-name-specific form component. |
| Drafts/submission/off-shift | ported, UI-matched, tested | Own incomplete drafts, resume/edit/submit, separate timestamps, retained author/version, submission feedback, unsaved-change prompts and shared demo-attendance state. All changes reset on reload. |
| Corrections | ported, UI-matched, tested | Shared request form/model/helpers; original answers preserved, field/value proposals in text, separate Pending Review status, no staff approval/rejection or submitted edit/delete operation. |
| Development model | ported, tested | Existing snapshot/provider extended with typed templates, versions, sections/fields/options, client assignments and care records. No independent store or real API introduced. |
| Source/style integrity | original, tested | Original archive/extraction and three active source CSS copies unchanged. Scoped bootstrap additions only. No dependency/font-binary additions. |
| Preview boundary | ported, tested | Production refuses 27 URLs with preview explicitly enabled, including assessment forms, details/corrections and unassigned subjects. Server fixed-demo-client/template lookups remain development demonstrations. |
| Charting, repeating tables, Gallery, Admin builder | original / placeholders | Outside this phase. Reserved photo/file/table controls explicitly unavailable; no upload picker or pretend file persistence. |
| Auth.js / Prisma / Neon / secure files / GPS / audit / deployment | blocked, not implemented | No production identity, organisation/role/house permission service, persistence, private files, location verification, durable audit or deployment approval. Fictional data only. |

## Verification

| Check | Result |
| --- | --- |
| `pnpm lint` | PASS, zero warnings |
| `pnpm typecheck` | PASS, strict source/tests and canonical generated route types |
| `pnpm format:check` | PASS |
| `pnpm test` | PASS, 49 unit tests across five files |
| `pnpm test:e2e` | PASS, 175 cases (35 × five widths), including all 120 earlier regression cases |
| Focused comparison run | PASS, five capture cases rerun after screenshot positioning/display review |
| `pnpm build` | PASS, production webpack build including `/clients/[id]/records/new` and unchanged Admin routes |
| `pnpm test:production` | PASS, 27 preview paths refused with flag enabled and no fixture-content exposure |
| Source integrity | PASS, all 51 extracted files and all three original CSS copies byte-identical |
| Visual evidence | 120 raw captures and 20 paired boards at 375, 390, 768, 1280 and 1440px; findings documented in migration notes |

Unit tests cover required/option/numeric/date/time validation, all field types in configuration, conditional sections/fields, hidden-value removal, missing/cyclic dependencies, unsupported required controls, assignment/publication scope, author-only drafts, historical version retention, off-shift/demo-active states, pagination/filter/search and unchanged originals on correction. Browser cases cover the user-facing workflows, long text, keyboard choices, invalid/wrong-client/template/draft URLs, versioned details, Cancel/navigation confirmation, responsive controls and source comparisons. Existing Admin desktop gating remains tested.

## Limits and next step

- Drafts, submissions, corrections and demo attendance live only in the Staff React session. Reload/remount resets them; seeded direct links resolve again and session-created IDs show unavailable. The UI explains this before data entry.
- Unknown/unassigned client/template routes return server HTTP 404. Invalid care record IDs within an authorised profile show generic unavailable content with HTTP 200. The fixed fictional employee's scoped snapshot is serialised for the preview; no authenticated access-control service exists.
- Published configurations have no editing operation in this phase and submitted records are read-only in the staff UI. Database immutability, review decisions, corrected versions, durable audit, concurrency and server-enforced permissions remain future work.
- Forms are fictional demonstration configurations, not clinical assessment standards. Medication receipt is documentation only. Advanced clinical validation, medication administration/prescribing, calculations and recommendations are excluded.
- Reference details are inline and correction is modal; full-page views extend the same source design. Added actions/version/status/metadata and safety copy change height. Exact visual parity, physical-device/mobile-keyboard testing, Safari/Firefox and exhaustive accessibility certification are not claimed.
- Host verification uses Node 25.9.0/pnpm 10.15.1; Node 22 LTS CI verification remains outstanding. External font/photo/tile availability/licensing/privacy review and production operational acceptance remain later work.

See [configurable form model](../configurable-forms.md), [route map](../route-map.md), [UI migration notes](../ui-migration-notes.md) and [visual evidence](../ui-comparisons/phase-1c2/). No Phase 1C.2 implementation blocker remains for review. Recommended next: review this phase, then a bounded **Phase 1C.3 Charting and repeating editable table UI migration**. Do not automatically begin backend or Admin CMS implementation.
