# Staff Leave contracts — Phase 1D.2

This is a fictional, development-only UI. No request is delivered to management, persisted to a database or checked against payroll/entitlement policy.

## Shared model and ownership

The existing StaffSnapshot/provider adds `leaveTypes`, `leaveRequests` and `leaveBalances`; no independent store or browser persistence is used. `LeaveRequest` contains a stable ID, employee ID, configured type ID, inclusive date-only start/end, optional notes, UTC submission timestamp and pending/approved/rejected status. Optional `LeaveDecision` groups reviewer ID/display name, UTC decision time and management notes. Fixture reviewers reuse the existing fictional manager display name; trusted reviewer identity/audit is a later server responsibility.

Pure adapter reads check the current employee, including against a broader snapshot. Snapshot serialisation includes only their own requests and supplied balances. House assignment does not grant access to coworker leave: Team Schedule remains an operational shift projection with no leave notes/history. An existing employee has no requests/balances; another employee's and an unrelated employee's fixtures exercise denial. No duplicate employees were added.

New submissions explicitly construct employee/status/timestamp metadata and ignore forged employee, approval and decision properties. Only an active configured type is accepted. Requests start Pending Review, become visible in the current provider session and reset on reload/remount. A new request never modifies existing request decisions, balances, shifts, attendance or attendance corrections. Staff have no approval, rejection, cancellation, withdrawal or submitted-record editing operation.

## Types, balances and dates

The configuration retains the export's Annual leave, Sick leave, Bereavement leave, Alternative holiday and Unpaid leave labels. An archived type remains readable in history but unavailable for new requests. The later Admin CMS must manage permitted types/policies; no legal eligibility or entitlement rule is inferred from a label.

Balance snapshots contain employee/type IDs, fictional numeric value, unit and as-of timestamp. They are supplied examples, not an accrual engine. No annual base entitlement is invented, no request days are subtracted, and missing balances remain unavailable rather than becoming zero. The source's hardcoded `15 minus approved days` calculation is intentionally replaced by supplied fictional snapshots.

Requests use whole calendar dates. Required type/start/end, real calendar dates and end-on/after-start are validated once in the adapter. Notes remain optional as in the original form; no clinical detail or supporting upload is requested. Calendar-day counts are inclusive UTC date-only arithmetic and explicitly do not mean paid days or statutory entitlement. Partial-day requests are absent from the source and deferred.

Own pending/approved date overlaps generate a non-blocking advisory warning. Rejected requests and other employees' requests are excluded. No blanket rejection or organisation-approved overlap policy is invented. History filters search own type/notes, status, type and inclusive requested-period intersection with the selected range; ordering is newest submission first, six per page.

## Staff interactions and management boundaries

Overview preserves source summary cards, request action and history row styling. Added approved count, upcoming approved periods, submission metadata, filters/pagination and details use existing components. The original request modal is retained with read-only employee identity, labelled inputs, inline errors, overlap warning, relevant roster links and honest session-only feedback. Shared modal focus setup no longer restarts on every callback change while typing; textarea participates in focus containment. Cancel/Escape/Back/unsaved navigation use the existing discard conventions.

Details show request ID, current employee, type/dates, optional notes, submission/status and available fictional decision data. Approved leave is read-only with contact-management guidance. Rejected records remain unchanged; a new request uses the normal form. No fake management review button exists.

**Pending withdrawal remains a policy decision.** Although the original export has a Withdraw button, the current brief states that only cancellation of an unsent form is automatically permitted and pending withdrawal is undecided. This migration therefore defers submitted withdrawal and shows contact-management guidance. Approved leave can never be directly cancelled by staff. This is a documented intentional source difference, not an inferred final withdrawal policy.

## Roster context and future integration

Overlapping own scheduled shifts use the same shift IDs, Pacific/Auckland date keys and overnight interval overlap as Roster; cancelled shifts are excluded. Links open the existing Shift Details. Leave, Shift and AttendanceRecord remain separate entities. An approved fictional leave period can coexist with an assigned shift to demonstrate management follow-up; it never silently deletes or reassigns shifts.

Future Auth.js identity and organisation/employee permissions must protect every server read/write. Prisma/Neon metadata, trusted management review, decision history/audit, concurrency, payroll/balance feeds and approved overlap/withdrawal/partial-day policies remain unimplemented. No notifications, emails, real uploads, attendance/GPS changes or Admin Leave Review UI were added.

## Verification and limits

Unit/browser results are recorded in [implementation status](implementation-status.md). Tests cover ownership, configured types, valid/invalid dates, advisory overlaps, forced pending status, immutable balances/roster/attendance, empty employees, read-only decisions, navigation, focus, responsive bounds and production isolation. Source comparisons document added workflow states and limitations, not exact parity. Node 22 remains unavailable in the checked local Homebrew/mise/nvm locations; host checks use Node 25.9.0/pnpm 10.15.1. Other browsers, physical devices, exhaustive accessibility and independent design approval remain outstanding.
