# Implementation status — Phase 1C.4

Client and House Galleries/Documents now extend the existing development-only Staff UI. One typed attachment model and the existing adapter/provider serve both contexts. No production file service is connected. Earlier status: [Phase 1C.3](../history/phase-1c3-status.md).

## Checkpoint and scope

Phase 1C.3 checkpoint: `2913cd0` on local `phase-1c3`. Before the checkpoint, lint/typecheck/format, 63 unit tests, 225 browser cases, build and 35 production-isolation checks passed. Phase 1C.4 was implemented on local `phase-1c4`; the complete version is prepared on `phase-1c4-complete` for the user-authorised Git push. `main` remains `9cecc8b`. No previous branch was reset or overwritten. Pre-existing duplicate screenshots and the local reference are preserved.

| Area | Completed behaviour and boundary |
| --- | --- |
| Client and House Galleries | Shared source-derived cards, thumbnails/icons, filename/type/size/author/date, scoped filename search and type filter, newest-first and six-file pagination. Contexts remain separate. |
| Details and previews | Source modal treatment, complete metadata, URL-selected information/image preview, Escape/Back/refresh, loading/error/retry and honest unsupported/PDF-unavailable states. |
| Downloads | Four allowlisted harmless bundled PNG/TXT/CSV assets have working downloads. Missing, unsupported and session-only contents have no enabled download or invented URL. |
| Upload selection | Shared browse/drop area, metadata and temporary image preview, optional description, duplicate-name support, remove-unsent-selection, centralized configurable provisional validation, progress, success/failure/retry/cancel. Completion adds session-only metadata, never file contents. |
| Profile photos | Shared image-only picker for client/house; preview, cancel and temporary application with object-URL cleanup. No permanent change. |
| Access and removal | Existing fictional role/house scope, explicit association IDs and generic unavailable responses for unrelated file IDs. No staff delete or reassociation operation. This is not production authorisation. |
| Design and earlier workflows | Original reference/CSS retained; scoped additions. Diary, Care Plan, Charting and earlier Staff/Admin-gate regressions retained. No Admin file management. |

## Verification

| Check | Result |
| --- | --- |
| Lint / strict TypeScript / formatting | PASS, zero lint warnings |
| Unit tests | PASS, 72 tests across seven files |
| Complete browser regression | PASS, 275 cases across five widths, retaining all earlier 225 cases |
| Final gallery regression after thumbnail fix | PASS, all 50 cases across five widths, including image/metadata bounds |
| Production build | PASS |
| Production isolation | PASS, 41 preview routes refused with preview flag enabled; login inert |
| Source integrity | PASS, 51 reference files and three original CSS copies byte-identical |
| Local preview smoke | PASS, client/house galleries HTTP 200 on port 8443 |
| Visual evidence | 90 raw captures and 15 paired boards, five required widths |
| Whitespace check | PASS, `git diff --check` |

Visual review found and corrected tablet thumbnail overlap; the final gallery run verifies containment at all widths. Captured migrated states have no collected page errors or document-level horizontal overflow. Source layout limitations and added metadata/warnings/confirmation flows remain documented. Exact visual parity is not claimed.

## Remaining limitations and next step

All identity, assignments, attendance and records remain fictional development state. Simulated upload completion retains metadata only until provider reset/reload; selected contents and temporary photos exist only in browser memory. There are no real uploads, storage, signed URLs, database writes, secure production retrieval, antivirus checks, GPS or management removal. Downloadable public assets contain only harmless demo material and are not a private-storage pattern. PDF has no bundled example and shows an explicit placeholder.

Unknown/unassigned parents and malformed repeated gallery parameters return 404. Invalid/unrelated file IDs within an authorised profile return a generic unavailable state with HTTP 200, including session-only IDs after reload. No unrelated metadata is displayed. Future server-side organisation, role, house and record checks remain required on every read/write.

Host Node 25.9.0/pnpm 10.15.1; Node 22 is unavailable locally, so intended-runtime verification remains outstanding. Chromium viewport checks do not certify physical devices, Safari/Firefox, exhaustive accessibility or independent design approval.

No Phase 1C.4 UI implementation blocker remains. Review this bounded migration, then specify the next Staff UI phase. Do not start Phase 1D, Admin, backend or deployment automatically. The full tracked application is checkpointed on `phase-1c4-complete` for the user-authorised push; previous branches remain unchanged. Reference files and unrelated duplicate screenshots remain local-only. See [file architecture](../file-architecture.md), [routes](../route-map.md), [migration notes](../ui-migration-notes.md) and [visual evidence](../ui-comparisons/phase-1c4/README.md).
