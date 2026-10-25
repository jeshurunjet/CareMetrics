# Shared scheduling and attendance — Phase 1D.1

## Phase 2F database-mode update

[Clock-out and attendance history](clock-out-attendance-backend.md) supersedes earlier clock-out limitations below. Explicitly acknowledged development NO_LOCATION_REQUIRED policies permit server-timed closure of an existing owned record, preserving clock-in evidence. Own Staff history and management-only read access now use PostgreSQL; recorded elapsed time is not payroll approval. Production attendance stays disabled. Historical assignment/house withdrawal permits only minimal own attendance access and safe closure, without House/Client access.

## Phase 2E database-mode update

[GPS clock-in integration](gps-clock-in-backend.md) now connects one-time, user-requested location to server-validated clock-in persistence and own confirmation. Policies and exact house-coordinate approvals are server-controlled and organisation scoped; only explicit development test policies are supported. Missing/unapproved configuration and all production environments remain disabled. GPS evidence and minimal audit commit atomically, with exact-retry, per-shift/request and single-open-record protections. No raw staff coordinates are persisted; preview simulations remain isolated. Clock-out, timesheets, payroll and correction review remain unavailable. Physical HTTPS/Android acceptance is outstanding.

The Phase 2D and earlier sections below preserve their historical contracts; the Phase 2E document supersedes statements that no clock-in service exists. Scheduled time remains separate from attendance, and Dashboard does not require clock-in.

## Phase 2D database mode

[Shift backend integration](shift-backend-integration.md) is the current scheduling contract. Admin Calendar/List/Create/Edit/Cancel/Details and own Staff My Shifts/Roster/Dashboard now share PostgreSQL Shift IDs. Authenticated current-account, organisation, capability and active-house-assignment checks run on the server; Staff cannot request a coworker's schedule. Strict Pacific/Auckland wall time is converted to UTC instants, with ambiguous and nonexistent DST times rejected. Adjacent shifts are allowed; active overlap is rejected under the shared organisation transaction lock. Optimistic revisions reject stale changes. Attendance references block edits/cancellation; cancelled records remain, with atomic audit events.

GPS acquisition, geofence validation, clock-in/out persistence, actual timesheets, corrections, Leave and payroll remain unavailable in database mode. Scheduled time is never presented as worked hours. Team Schedule is also deferred; only own shifts are returned. Continue to Dashboard without clock-in remains available. Database errors never fall back to fixtures.

The remaining sections describe the preserved, isolated development preview and its historical migration contracts. Their in-memory actions and attendance examples are not database-mode functionality.

This is a development-only UI contract over fictional records, not an attendance service, permission boundary or payroll system.

## One snapshot and stable relations

The existing `StaffSnapshot` retains Employee, House, HouseAssignment and Shift. Shift still has one stable ID, employee, house, UTC start/end and assigning-manager display name; optional cancelled state and notes extend the existing export shape. The same `sh1`–`sh4` and `co1`–`co2` fixtures/times serve Clock-in, Dashboard, Roster and Team Schedule. `roster/seed.ts` adds fictional historical shifts, an overnight shift, cancellation, several attendance states and review fixtures, using existing employees/houses. An excluded employee/house/shift exercises scope. No component seeds its own schedule.

`AttendanceRecord` has a stable ID, shift ID, employee ID, optional recorded clock-in/out, fictional event-location state and optional notes. Its employee must match its assigned shift. Snapshot serialisation includes only the current fictional employee's attendance and corrections. Coworker operational shifts remain available only for shared authorised houses; private coworker attendance is excluded even when that coworker's roster is visible. Pure lookups recheck ownership and house assignments against broader snapshots. The future server must derive scope from trusted identity, never client-supplied IDs.

The existing `demoAttendance` flag remains a labelled appearance/off-shift-form scenario, not a timestamped AttendanceRecord. Toggling it does not create timesheet events. Real Clock In/Out remain disabled and failed simulated location checks cannot bypass them. Dashboard access without clock-in is retained. Scheduled shifts do not prove attendance.

## Schedule and time rules

My shifts span all current assigned houses and sort by UTC start. Shared selectors exclude cancelled shifts from current/highlighted/upcoming eligibility. Status is Cancelled first, otherwise Completed when the scheduled end has passed, Current during the scheduled interval, or Upcoming. Completed schedule status does not assert clock-in; attendance is displayed separately. No invented early eligibility window, geofence radius, GPS accuracy policy or clock-out policy was added.

Calendar keys and date labels explicitly use Pacific/Auckland event dates. Date-only arithmetic uses UTC midday, avoiding device timezone drift. The original Monday-first six-week month grid remains, with previous/next month, current/selected dates, accessible date/shift-count names and arrow-key navigation. Overnight shifts appear on each calendar date they overlap (an exclusive midnight end is not counted on the following day). Cards show the following end date. Team Schedule uses the same overlap rule with house/date selection and grouped collapsible rows.

Recorded duration uses actual available event timestamps, never scheduled hours. Missing either timestamp shows a dash, not invented hours. Overnight duration uses UTC timestamp subtraction; for example an eight-hour roster has an 8h 10m fictional event duration. Zero duration is representable; reversed/invalid values are unavailable. No breaks, overtime or payroll deductions are inferred. Not Clocked In, In Progress, Completed and Missing Clock-out remain distinct. Timesheets sort newest scheduled start first, filter by scheduled NZ start date/house, and paginate six rows. Summary figures reflect the filtered set, including only completed actual intervals for hours.

## Operational Team Schedule

Both viewer and shift employee require the relevant house assignment. The projection returns only shift/employee IDs, display name, house, start/end and schedule status. No private contact, attendance, location, leave reason or personnel notes are returned by this query. House filters cannot expand the assigned-house scope. There is no unrestricted employee directory, coworker attendance detail or coworker shift-detail link. Staff cannot create, edit, cancel, delete or publish assignments.

## Attendance corrections

`AttendanceCorrectionRequest` is separate from care/diary corrections: stable request/attendance/shift/requester IDs, optional proposed UTC clock-in/out, reason, request time and pending/approved/rejected status. Ownership/association comes from the original attendance, not form fields. Browser controls cannot choose a different employee, house or shift.

The request validates own attendance, a non-cancelled related shift, no existing pending request, a reason and at least one changed proposed timestamp. Date/time inputs explicitly represent Pacific/Auckland. Missing/ambiguous DST wall times, invalid values, reversed resulting intervals and future event proposals are rejected. A blank proposal preserves that original timestamp. Requesting a clock-out without a resulting clock-in is rejected. The adapter adds a separate Pending Review request and never updates the original AttendanceRecord or roster. A shift with no attendance record links to Shift Details; it does not invent an attendance ID or offer a correction against a nonexistent record. Management handling of an entirely missing attendance record remains future work.

The UI shows original and proposed values separately, session-only confirmation/status and no approve/reject controls. Historical approved/rejected fixtures demonstrate display only; they do not simulate management review or apply corrected timestamps. Future Admin review must preserve originals, create reviewed versions/decisions and durable audit with reviewer/reason/time. Duplicate-pending protection here is only in-memory, not concurrency protection.

Corrections reuse existing form controls, status/modal conventions and unsaved-change navigation handling. Unlike the source's free-text modal, the new full-page form includes original metadata and structured proposed dates/times. Browser Back, Cancel and unsaved navigation prompts follow existing documentation workflows. Reload/remount resets new requests; seeded links remain resolvable. No API, localStorage timesheet, database, GPS permission request or attendance mutation endpoint is introduced.

## Future integration and verification limits

Auth.js trusted sessions, server organisation/role/house checks on each read and write, Prisma/Neon persistence, stable assignment history, transactions/concurrency constraints, policy-approved event-location validation, management review and durable audit remain unimplemented. GPS is event-only, not continuous tracking. Payroll integration, shift-swap workflows, leave and Admin roster editing are outside this phase; the exported Staff roster has no shift-swap control to migrate.

Node 22 was checked in common local Homebrew/mise/nvm locations and is unavailable; host verification uses Node 25.9.0/pnpm 10.15.1. Intended Node 22 CI remains outstanding. Chromium viewport emulation does not certify physical devices, Safari/Firefox, exhaustive accessibility or independent visual acceptance.

## Phase 1D.2 Leave relationship

Staff Leave is now a separate typed collection in the same development snapshot. Requests reference the existing employee and configured leave type, not an attendance record. Roster context derives overlapping own, non-cancelled shifts with explicit NZ/overnight date handling and links to their existing IDs. Creating or displaying approved leave does not cancel/reassign shifts, alter attendance/corrections or deduct balances. Management coordination remains a future workflow. Team Schedule exposes no leave notes, decisions or balances. See [Leave contracts](leave-management.md).

## Phase 1E.2 Admin workforce extension

The same snapshot now supports development management create/edit/cancel, operational attendance/timesheets and attendance correction review. See [Admin workforce contracts](admin-workforce-management.md). Scheduled inputs retain UTC event storage/NZ wall-time conversion; assigned active employee/house, overlap, date/time/DST and break information are validated in pure shared operations. Recorded attendance blocks schedule editing/cancellation; cancellation otherwise preserves IDs/history and excludes active Staff eligibility.

Original AttendanceRecord timestamps are never mutated by approval. An attendance request can hold a reviewed effective version, original/prior values, reviewer/time/notes and a base-correction ID. Staff/Admin effective rows/totals use the same resolver; original values remain visible in details. Manual corrected values are fictional-unverified, never GPS success. A competing request based on an older applied version cannot be approved; reject and resubmit against the latest effective version. Historical status-only fixtures remain unapplied display examples. These are session checks, not transactional concurrency or durable audit. Real attendance, payroll, GPS/eligibility/clock-out policy and authenticated services remain unavailable.

The earlier Node-unavailable and Admin-review-deferred paragraphs describe their historical phase. Current checks use isolated Node 22.23.4; production integration remains outstanding.
