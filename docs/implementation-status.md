# Implementation status — Phase 1D.2

Staff Leave now extends the existing development-only application, using the same typed snapshot/provider. No production leave, management review or payroll service is connected. Earlier status: [Phase 1D.1](history/phase-1d1-status.md).

## Checkpoint

Verified completed Phase 1D.1 and committed local checkpoint `7aa4677` on `phase-1d1`. Baseline lint, strict TypeScript, formatting, 81 unit tests, all 50 roster browser cases at five widths, build and 49 production-isolation checks passed again; the prior complete 325-case run is preserved in its phase documentation. Phase 1D.2 is isolated on new local `phase-1d2`. Previous branches, reference files and unrelated duplicate screenshots remain untouched. No reset, discard or remote push.

| Area | Implementation and boundary |
| --- | --- |
| Overview and navigation | Source Leave header, balance/stat cards, request action and history; added approved count, upcoming approved periods and Dashboard My Leave shortcut. Existing sidebar/mobile Menu reused. |
| Own history | Source-styled cards with type/dates/submission/status/notes/details; own search, status/type/date filters, newest submission first and six-row pages. |
| Request modal | Original field/modal presentation, configured active types, read-only employee, date validation, optional notes, advisory overlaps and read-only roster context. |
| Details and status | New source-styled modal for ID/employee/type/dates/notes/submission/status and available fictional decision/reviewer/management notes. Pending Review, Approved and Rejected remain consistent. |
| Submission | Creates a forced-pending own request with clear session-only feedback and details/history entry. No management delivery, database or durable storage. |
| Balances and permissions | Supplied fictional snapshots, no deduction/accrual/entitlement calculation. No staff approval, decision edit, submitted withdrawal or approved cancellation operation. |
| Roster/attendance separation | Same own shift IDs for overlap links; requests leave shifts, attendance, corrections and balances unchanged. Team Schedule reveals no leave details. |
| Modal and mobile handling | Modal retains focus while typing and includes textarea in focus containment. Mobile leave content occupies a full row rather than a narrow column beside actions. |

## Verification

Status: `ported`, `UI-matched` with documented extensions, and `tested` within these boundaries. No Leave feature is `backend-connected`.

| Check | Result |
| --- | --- |
| `pnpm lint` | PASS, zero warnings |
| `pnpm typecheck` | PASS, strict source/tests and generated routes |
| `pnpm format:check` | PASS |
| `pnpm test` | PASS, 91 unit tests across nine files |
| `pnpm test:e2e` | PASS, 375 cases across five widths, retaining all prior 325 cases |
| Focused mobile Leave run | PASS, ten cases before the full regression; final mobile-card bounds also pass in the complete suite |
| `pnpm build` | PASS |
| `pnpm test:production` | PASS, 56 preview routes refused with the flag enabled; login inert |
| Local preview | PASS, overview/new-request/approved-details HTTP 200 on port 8443 |
| Source integrity | PASS, 51 reference files and three original active CSS copies unchanged |
| Production client chunks | PASS, private coworker/restricted leave fixture markers absent |
| Visual evidence | 90 raw captures and 15 paired boards across 375, 390, 768, 1280 and 1440px |
| `git diff --check` | PASS |

Unit coverage includes own/broad-snapshot scope, no-request/no-balance employee, configured/archived types, date/leap/DST handling, advisory overlap, forced pending own identity, unchanged decision/balance/shift/attendance state, newest-first filters/pagination and absent staff review/cancel/withdraw operations. Browser cases cover navigation, all request statuses/decisions, validation, non-blocking overlap, session submission/history/reset, typing focus/keyboard/discard, Back/refresh/roster links, private/unknown IDs, responsive bounds and unchanged previous workflows.

Final comparisons preserve source fonts, palette, cards, fields, modal and navigation with the documented workflow extensions. Mobile history content now occupies a full row. All final migrated captures report no collected page errors or unintended page-level horizontal overflow. Source detail/overlap/empty-state limitations and balance/status differences remain explicit; exact pixel parity is not claimed.

## Limitations and next step

All records, balances, reviews and identity/access controls remain fictional development previews. New requests reset on reload/provider remount; seeded details survive refresh. Invalid/other-employee IDs show generic unavailable content without private metadata (HTTP 200), matching existing session-only record routes; malformed query combinations return server 404. Real authentication and server organisation/employee permissions remain unimplemented.

No real approval, emails/notifications, Prisma/Neon persistence, payroll, accrual, supporting uploads, automatic roster changes or attendance/GPS changes were added. Pending withdrawal policy remains undecided; source Withdraw is deferred with contact-management guidance. Approved cancellation is unavailable. Whole-day date ranges/counts do not calculate paid entitlement; partial days are a future extension.

Node 22 is unavailable in the checked local Homebrew/mise/nvm locations; host checks use Node 25.9.0/pnpm 10.15.1. Intended-runtime CI, physical devices, Safari/Firefox, exhaustive accessibility and independent design approval remain outstanding. No UI implementation blocker remains for review. Review this bounded phase before selecting the next Staff UI task. No Notifications/Profile/Admin/backend phase starts automatically. Changes remain uncommitted on local `phase-1d2`; nothing was pushed.

See [Leave contracts](leave-management.md), [routes](route-map.md), [migration notes](ui-migration-notes.md) and [visual evidence](ui-comparisons/phase-1d2/README.md).
