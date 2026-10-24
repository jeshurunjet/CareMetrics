# Implementation status — Phase 1E.2

Admin workforce UI is ported over the same fictional development records as Staff. No feature is backend-connected or production-ready. [Workforce contracts](admin-workforce-management.md) explain transitions, limitations and changed files; [route map](route-map.md) lists canonical URLs. Earlier results are retained in [Phase 1E.1 status](history/phase-1e1-status.md).

## Git checkpoint

Phase 1E.1 is preserved locally at **9cf2104169a14d2cd122456f27dcc02568faca11**, branch `phase-1e1`. Baseline Node 22 checks passed before committing: lint/types/format, 203 units, 57 Admin browser passes/45 intentional narrow skips, build and 92 isolation checks. Current work uses `phase-1e2` and remains uncommitted/unpushed. Previous full versions, reference source/CSS/evidence and unrelated duplicate screenshots are preserved.

| Area | Ported development behaviour |
| --- | --- |
| Roster | Source day/week/month calendar, employee/house/status/date filters, shift list, create/edit/details/confirmed cancellation, stable IDs and shared Staff updates. |
| Shift policy | Active employee/house/current assignment required; employee overlaps blocked across houses; explicit NZ overnight/DST semantics; recorded attendance blocks schedule edit/cancel. |
| Attendance | Source monitor, operational timesheets/details, scheduled versus actual/effective durations, missing events, fictional location and issue states. No real clock-in/GPS/payroll. |
| Corrections | Same Staff request queue; original/effective/proposed comparison, confirmed approval/rejection, required rejection reason, reviewer/time/notes and stale-base conflict rule; immutable original events. |
| Leave | Same Staff Pending/All requests, review decisions, roster conflicts/confirmation and private-reason-free month calendar; no roster/balance mutation or cancellation policy. |
| Integration | Staff roster/My Shifts reflect shift edits/cancellation; Staff-submitted corrections/leave reach Admin and reviewed results return to own Staff views. Employee operational tabs/Dashboard use shared records. |
| Existing core and Staff | Prior Employee/House/Client/contacts/assignments/profile and mobile-first Staff features retained. Future documentation, files, publication/concerns, reports and settings stay deferred. |
| Roles | Management operations recheck Administrator/Manager preview role; ordinary Staff/Senior reject. Existing Manager restrictions on Administrator accounts remain. Browser role switching is not security. |

## Verification

Checks use isolated **Node 22.23.4 / pnpm 10.15.1**, without replacing system Node or the user's running preview.

| Check | Result |
| --- | --- |
| Lint / strict TypeScript / formatting | PASS, zero lint warnings |
| Unit tests | PASS, **237 across 13 files**, retaining all 203 earlier tests |
| Complete five-width Chromium regression | PASS, **551 tests**, **69 intentional narrow Admin skips**, 10.5 minutes; all earlier Staff tests retained |
| Final six-width Admin suite | PASS, **93 tests**, **69 intentional narrow management skips**, 2.2 minutes |
| Final same-record visual refresh | PASS, **6 cases** at all six widths; capture-only original timesheet selection adjustment |
| Production build / isolation | PASS, **106 preview URLs refused** with the flag enabled; production login inert |
| Final conflict-link presentation | PASS, 3 desktop workflows / 3 intentional narrow skips |
| Existing local preview | PASS, **14 workforce and Staff URLs** return HTTP 200 on the existing 8443 server |
| Reference / original CSS | PASS, all **51 reference files and three original stylesheet copies unchanged**; zero tracked reference paths |
| Visual evidence | **87 raw PNGs / 18 paired boards**, reviewed at 375/390/768/1280/1440/1600px; captures collect no page errors or document overflow |

After the complete regression, Admin-only presentation/default-filter/row-interaction/focus refinements were verified through the complete six-width Admin suite, all static/unit/build/isolation checks and the further six-case visual refresh. No Staff domain/layout logic changed after the full pass. The final source-list styling adaptation for conflict links is checked again with the three desktop Staff-leave conflict workflows; narrow management remains deliberately skipped. Private fixture markers are absent from production client chunks. No dependency/lockfile change or earlier passing test/assertion removal.

Earlier development runs are not counted as passes. They found an intercepted drawer footer and incorrect new-test selectors/route waits. The first final Admin capture run also exposed shared Monitor/Timesheets date-filter state; independent keyed tab mounts correct it. Pending Leave ignores a hidden status filter from All Requests. The fresh complete Admin run passes after these corrections. See [visual findings](ui-comparisons/phase-1e2/README.md) for intentional differences; no exact parity or independent design acceptance is claimed.

## Remaining limitations and next step

All mutations and role checks are same-session development demonstrations. Reload/logout resets edits. After visiting Admin the broader fictional dataset resides in the browser; projection/role changes are not confidentiality controls. Auth.js, trusted server organisation/role/house checks, Prisma/Neon transactions/persistence, concurrent decisions, durable audit, real GPS/attendance, private Blob files, notifications, payroll and deployment remain unimplemented. Break values are informational, not payroll deductions. Approved-leave changes, pending withdrawal, partial days, entitlements, historical-edit policy and approved GPS/clock-out rules need decisions.

Firefox remains previously blocked before app launch by its local profile-folder error; no passing Firefox result is claimed. Safari/WebKit, physical devices, exhaustive accessibility, external asset/privacy review, independent design and organisational security/privacy/operational approval remain outstanding. No real personnel/client/health data was introduced.

Recommended next step: review this bounded workforce migration and its policies, then agree the next Admin documentation/correction slice. Do not automatically start Phase 1E.3, backend integration or deployment.
