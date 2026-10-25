# Phase 2D — PostgreSQL shift scheduling

Admin scheduling and own Staff schedules use one existing Prisma `Shift` table. This phase does not implement attendance, browser location or payroll. The original Figma CSS and preview interactions remain intact.

## Contracts and modules

- `src/server/scheduling/shifts.ts`: safe DTO reads, validated create/edit/cancel, NZ wall-time conversion, conflict/history rules.
- `src/modules/scheduling/types.ts`: shared serialisable DTOs. All instants are ISO UTC; IDs are the original database UUIDs. `clockInAvailable` is always `false`.
- `src/modules/scheduling/StaffSchedule.tsx`: My Shifts, own Roster and details; Dashboard imports the same summary component/query.
- `src/modules/scheduling/AdminSchedule.tsx`: source Calendar, List, editor, drawer and cancellation dialog, using committed service responses. Existing Calendar/ShiftCard/editor field markup is shared with the preserved preview.

| HTTP route | Contract |
| --- | --- |
| `GET /api/shifts` | Authenticated employee's month/calendar and upcoming shifts; optional `day`, `month`, `house`, `shiftId`. `employee` cannot select a coworker. |
| `GET /api/shifts/:id` | Own authorised detail, otherwise 404. |
| `GET /api/admin/shifts` | Management's organisation roster; optional `day`, `month`, `house`, `employee`, `shiftId`. |
| `GET /api/admin/shifts/:id` | Organisation-scoped management detail. |
| `POST /api/admin/shifts` | Create with `employeeId`, `houseId`, `startsLocal`, `endsLocal`, `status: SCHEDULED`, `notes`. |
| `PATCH /api/admin/shifts/:id` | Same scheduling fields plus mandatory `expectedUpdatedAt`. |
| `POST /api/admin/shifts/:id/cancel` | `confirmed: true`, `expectedUpdatedAt`. Retains the record. |

Unknown fields, duplicate filters and invalid UUID/date/month values are rejected. Read responses are private/no-store. Mutation requests reuse the same-origin, JSON-only, actual 32 KiB body limit and safe error envelope from Phase 2C. No browser actor/org/role is trusted. Expected validation is 400; stale/overlap/history conflict is 409; missing or inaccessible records are 404; unexpected database failures are generic 503. Protected pages redirect anonymous users to Login, reject malformed/inaccessible routes and show an unavailable state on database failure.

Calendar queries cover the original Monday-first 42-day display window. Upcoming means noncancelled with end after server time, sorted start then UUID, limited to three; current shifts therefore remain visible. Detail queries are independently scoped and can open outside the displayed month. Calendar UI has previous/next/date selection and employee/house filters; List adds employee/house/status/search/month controls. Filters only narrow already authorised DTOs. Staff house filtering does not expand access.

## Schema and migration

`202610250003_shift_scheduling` adds nullable `Shift.assignedById` and `notes` (maximum 4,000 characters), a same-organisation composite FK to User, an upcoming-query index, and extends existing closed AuditEvent action/target constraints. Existing employee/house/attendance associations are unchanged. Creation derives assigning identity from the trusted management session; edits preserve the original creator. Legacy seed shifts have no recorded creator and display **Not recorded**; there is no invented historical attribution or backfill.

Migration was first exercised in a disposable local database with all existing migrations and repeat seed. It was then applied only to verified Neon `phase-2a`, without resetting/reseeding the populated development database. Production was not modified.

## Mutation authority and consistency

`managementWrite('admin.shiftManagement')` requires an active Auth.js account and Administrator or Manager capability, locks the organisation and actor, then rechecks current account/org/session/capability inside the transaction. Staff and Senior Staff cannot mutate. Scheduling grants no account-administration privileges. The same organisation lock is used by Phase 2C relationship/status writes, so concurrent assignment removal and shift creation cannot bypass dependency rules.

Create/edit require a current active employee, active house, same organisation and active EmployeeHouseAssignment. No request may choose its actor/organisation. Staff reads bind employee ID to the trusted session and require current active house assignments, including detail lookups. Managers using Staff screens still receive only their own shifts. No coworker private attendance or personnel data is returned. Assignment removal and inactivity are rechecked on subsequent reads/writes; historical IDs are retained. Client transfers do not alter Shift associations.

Active overlap policy: reject another SCHEDULED shift for the same employee when `existing.start < proposed.end` and `existing.end > proposed.start`, across houses, excluding the current shift during edit. Exactly adjacent shifts are allowed. Organisation transaction serialization prevents simultaneous successful double bookings through these services. No minimum rest period, weekly-hour limit or employment policy is invented. Future direct DB writers must follow the same locking policy or introduce an approved database exclusion constraint; the application lock is not a global SQL overlap constraint.

Edits/cancellations require the exact loaded `updatedAt`; revisions advance monotonically even for same-millisecond writes. Any AttendanceRecord reference blocks both operations, without changing original event times. Cancel requires confirmation, sets CANCELLED and never deletes. Cancelled shifts cannot be edited/reactivated and are excluded from upcoming/highlighted selection. They remain available in authorised historical month/details. No shift is clock-in eligible in this phase.

Successful create/update/cancel appends `shift.created`, `shift.updated` or `shift.cancelled` with tenant, trusted actor, target UUID, time and minimal field/status summary in the same transaction. Notes and personal content are not copied into audit. Failed validation, stale/conflicting writes and failed audit/transaction commits do not create successful records/events. Existing append-only audit protection remains.

## New Zealand time

Inputs are exact `YYYY-MM-DDTHH:mm` Pacific/Auckland wall times, independent of browser timezone. Conversion round-trips both NZST (+12) and NZDT (+13) candidates through Intl; zero matches (spring gap) or two matches (autumn repeated hour) are explicitly rejected. Choose another unambiguous wall time. Storage uses existing timestamptz instants, and durations use actual UTC subtraction.

The existing form treats an earlier end clock time as the next calendar day. An optional explicit end date supports overnight/year boundaries and longer intervals. End must be strictly later; no arbitrary maximum duration is imposed. Overnight calendar membership uses the exclusive end instant. DST-spanning 01:00–04:00 correctly represents two spring hours or four autumn hours; an ordinary 22:00–06:00 year-boundary shift is eight hours. Presentation adds the actual end date/day count rather than assuming every overnight is exactly one day.

## UI and mode boundaries

Login → My Shifts → Dashboard remains intact, including visible Continue to dashboard links at mobile and desktop widths. My Shifts shows current/nearest upcoming shift, house/address, schedule-only status, manager when recorded and other upcoming shifts. Own Roster and Dashboard read the same IDs and open the same scoped details/House Profile. Refresh/navigation reflects committed Admin edits/cancellation without adapter updates.

Database mode keeps Clock in disabled, requests no geolocation, makes no attendance write and labels actual attendance unavailable. Timesheets, team schedule, corrections, Leave, care/documentation persistence, private files and delivery remain Future Development. No mock fallback exists on errors. Isolated nonproduction preview retains its original simulated interactions; production with backend disabled denies both data APIs and preview routes even if preview is opted in.

## Verification

Final results are recorded in [implementation status](implementation-status.md). Targeted service coverage includes active/inactive/scope/assignment validation, trusted actor, overnight/year/DST, ambiguous/gap rejection, concurrent overlap, adjacency, stale edits, retained cancellation, immutable attendance history, audit counts and failed database reads. The authenticated browser acceptance creates through Admin at 1280px, opens the same ID in Staff at 390px (My Shifts, Roster, Dashboard and House link), then confirms edits/cancellation and disabled clock-in. All generated scheduling test records are fictional and cancelled through the service; audit/history remain.

## Next boundary: Phase 2E

GPS policy must be approved/versioned before enabling acquisition or persistence: distance, accuracy, freshness, eligibility window, measurement/receipt times, configuration validation, permission/HTTPS and retry/contact-management behaviour. Location is spoofable and must not become a browser-authorised security control. Phase 2E should build on these authorised Shift IDs and current assignments, keep Dashboard access independent and avoid mock success. Clock-out, attendance corrections, payroll and Phase 2F remain separate work. No production deployment or Android APK is included.
