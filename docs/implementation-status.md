# Implementation status — Phase 1D.1

Roster and Timesheets extend the existing fictional Staff UI. One snapshot now serves scheduled shifts, own attendance and separate attendance correction requests; no production attendance/backend service is connected. Previous status: [Phase 1C.4](history/phase-1c4-status.md).

## Checkpoint

Completed Phase 1C.4 is already committed/pushed at `bc4b5e1` on `phase-1c4-complete`, superseding the brief's older uncommitted note. Its baseline passed lint, strict types, formatting, 72 unit tests, all 275 browser cases, build and 41 production-isolation checks again. No duplicate checkpoint commit was needed. Phase 1D.1 is isolated on new local branch `phase-1d1`; previous branches and the local reference/duplicate screenshots are preserved. No push is authorised for this phase.

| Area | Implementation and boundary |
| --- | --- |
| Roster landing/navigation | Source header, shared Staff shell and three tabs; Dashboard/My Shifts links connect to the same `/roster` destination. |
| My Roster/calendar | Source month calendar and ShiftCard, all assigned houses, current/selected date, keyboard arrows, month navigation, selected-day shifts, chronological upcoming list and house filter. Overnight shifts appear on both overlapping dates. |
| Shift details | Shared source modal now includes employee, scheduled duration, notes, attendance and house/attendance links. Cancelled shifts are excluded from ordinary eligibility. |
| Team Schedule | Source operational table with house/date selectors, day navigation and collapsible house group. No private coworker attendance/GPS/leave information. |
| My Timesheets | Source summary/table with date/house filters, newest-first/six-row pages, scheduled versus actual values, missing attendance states and details links. |
| Attendance details | Source-styled modal with fictional event metadata, durations, original/proposed corrections and explicit GPS/payroll limitations. |
| Correction requests | Structured NZ time proposals/reason, validated own-record association, unsaved-change prompts, session-only Pending Review, originals unchanged. No staff approval or roster editing. |
| Earlier UI/Admin | Existing regression suite retained. Admin content and real clock-in/out remain unchanged/unavailable. |

## Verification

Status: the new UI is `ported`, `UI-matched` with documented extensions, and `tested` within the boundaries below. No scheduling or attendance feature is `backend-connected`.

| Check | Result |
| --- | --- |
| `pnpm lint` | PASS, zero warnings |
| `pnpm typecheck` | PASS, strict source/tests and generated routes |
| `pnpm format:check` | PASS |
| `pnpm test` | PASS, 81 unit tests across eight files |
| `pnpm test:e2e` | PASS, 325 cases across all five widths; includes all previous 275 cases |
| Final targeted roster regression | PASS, 50 cases across five widths after date-filter styling changes |
| `pnpm build` | PASS |
| `pnpm test:production` | PASS, 49 preview routes refused with the preview flag enabled; login inert |
| Local smoke | PASS, Roster/Timesheets/Correction HTTP 200 on port 8443 |
| Source integrity | PASS, 51 reference files and three original active CSS copies unchanged |
| Production client chunks | PASS, restricted employee/shift and private coworker attendance fixture markers absent |
| Visual evidence | 90 raw captures and 15 paired boards at 375, 390, 768, 1280 and 1440px |
| `git diff --check` | PASS |

Unit coverage includes stable fixture consistency, assignments/ownership, cancellation, timezone/month/leap-day and overnight date handling, actual/scheduled/missing/zero/reversed duration, operational team projection, private snapshot filtering, pagination and correction validation/original retention. Browser coverage includes existing navigation, calendar keys/month/house/empty states, overnight labels, deep links/Back/refresh, Team grouping/filters, timesheet data/filter/page controls, validation/cancel/session-reset, invalid/unrelated HTTP 404 and all earlier Staff/Admin-gate workflows.

Final visual review preserves the source calendar, cards, table/stat styling and modals with documented metadata/filter/correction extensions. Mobile filter wrapping and original date-input styling were corrected. Final captures report no page errors or unintended page-level horizontal overflow; wide tables retain labelled keyboard-focusable scrolling. No exact pixel parity or independent design approval is claimed.

## Limits and next step

Identity, access checks, shifts, event-location evidence, attendance and reviews are fictional development previews. New correction requests reset on reload/provider remount. No real attendance/GPS, persistence, management approval, corrected event versions, payroll, database or production audit was added. The existing demo active-appearance flag does not create recorded timesheets. No shift-swap feature exists in the exported Staff roster, so none was invented.

Node 22 is unavailable in the supported local locations checked; verification uses Node 25.9.0/pnpm 10.15.1. Intended-runtime CI, other browsers/physical devices, exhaustive accessibility and independent design acceptance remain outstanding. No UI implementation blocker remains for review. Review Phase 1D.1 before agreeing the next bounded Staff UI task; no Leave, Notifications, Admin or backend phase starts automatically. Changes remain uncommitted on `phase-1d1`; no push.

See [scheduling model](scheduling-and-attendance.md), [routes](route-map.md), [migration notes](ui-migration-notes.md) and [visual comparisons](ui-comparisons/phase-1d1/README.md).
