# Phase 2F — Persistent clock-out and attendance history

This completes an authenticated clock-in/out lifecycle and bounded Staff/Admin history over the existing AttendanceRecord. Production attendance remains disabled: the organisation has not approved clock-out GPS policy, and only an explicitly acknowledged development NO_LOCATION_REQUIRED test policy is supported. Recorded elapsed attendance is not payroll approval.

## Checkpoint and database safety

At the user's request, the completed Phase 2E application was committed and pushed to `phase-2e-complete` at **862c074d8d21aa4025807d11b9dd5dd468be9162**, preserving earlier branches and excluding reference/secrets/duplicate screenshots. `phase-2f` was created from that checkpoint. The user subsequently authorised pushing the completed Phase 2F checkpoint on `phase-2f-complete` before starting `phase-2g`. No application deployment is authorised.

Only Neon **phase-2a / br-billowing-rice-a78isrig**, project `fragrant-snow-30323119`, is used. Before writes, ready state, actual matching pooled/direct endpoints, database identity, certificate-verified client TLS and the exact four existing migration checksums were verified. Original evidence from all 11 existing clock-ins was hashed for later preservation checks. Migration 005 was tested in disposable PostgreSQL before development application. No populated reset/reseed or production modification. Expiry remains **24 November 2026, 11:18 NZDT**.

## Server-controlled clock-out policy

Clock-out configuration is independent of GPS clock-in configuration:

- `CAREMETRICS_CLOCK_OUT_POLICIES`: JSON array keyed by organisation UUID.
- `CAREMETRICS_CLOCK_OUT_TEST_POLICY_ACK=fictional-development-only`: explicit test opt-in.
- Each entry contains exactly organisationId, `version: test-…`, `approval: test-only`, `enabled: true` and a mode.
- Accepted modes: `UNCONFIGURED`, `NO_LOCATION_REQUIRED`, `LOCATION_REQUIRED`.
- Missing, malformed, disabled, unapproved, duplicate-tenant or unknown-mode configuration fails closed.
- NODE_ENV production or VERCEL_ENV production disables policy, even with test flags/values supplied. Only the explicitly isolated `local-test`/`phase-2a` development contexts are accepted.

UNCONFIGURED returns unavailable with Contact Management guidance. LOCATION_REQUIRED always returns unavailable in this phase: no clock-out GPS flow is implemented/approved, and previous clock-in evidence is not reused as a bypass. NO_LOCATION_REQUIRED is executable only under the explicit development test configuration; it does not call geolocation or accept position fields. There is no production activation path or implicit fallback from required GPS to optional GPS.

The organisation must approve the clock-out location requirement, associated verification/freshness/eligibility rules, exception handling, retention/evidence/dispute policy and production activation before deployment. No wage, overtime, rest, break deduction, automatic clock-out or maximum attendance duration policy is invented. `.env.example` contains blank settings; normal `.env.local` is unchanged. Guarded test runners alone load a separate fictional Phase 2F GPS/clock-out fixture; the previous Phase 2E test organisation still has no clock-out policy.

## Clock-out contract

`POST /api/attendance/clock-out` accepts exactly `{ attendanceId: UUID, requestId: UUID }`. The browser cannot select employee/org/role, supply an authoritative clock-out time, override mode or submit unnecessary latitude/longitude/measurement data. Unsupported/missing fields and malformed UUIDs fail validation.

The shared HTTP guard requires the configured origin, same POST Origin, JSON and an actual streamed body no larger than 32 KiB. The service independently requires the active Auth.js account/org/session version, takes the same organisation-then-actor locks as scheduling/clock-in/management, rechecks current identity and scopes the AttendanceRecord to that employee/organisation. Management identity grants no manual closure of someone else's record.

A successful operation requires an existing clock-in and no existing clock-out, an executable no-location test policy, and server receipt time strictly after the recorded clock-in. It updates the same attendance UUID/shift association, records immutable clock-out policy/request metadata and appends one `attendance.clocked_out` audit inside the same transaction. The response follows commit. A failure leaves the original open record and no successful completion audit.

Receipt time is captured after bounded JSON decoding, before authentication/locking. Browser time is never authoritative. Scheduled end/cancellation/current house activity do not determine whether an existing owned attendance can be closed; clock-out can legitimately occur after scheduled end, midnight, year boundary or DST change. No second Shift or AttendanceRecord is created.

Safe statuses: 400 invalid request, 401 inactive/revoked/anonymous, 403 origin/capability denial, 404 missing/out-of-scope record, 409 no clock-in/already completed/conflicting request/nonpositive interval, 503 unconfigured/unapproved/location-required policy or unexpected service failure. Responses are private/no-store. Errors contain no credentials, GPS values or internal database details; no fictional fallback exists.

## Historical scope and access withdrawal

New clock-in still requires all Phase 2E checks, including active current house assignment/house and approved test coordinates. Those rules were not relaxed.

For an attendance already owned by the signed-in active employee, limited historical employment metadata remains readable and an explicit no-location test policy can permit closure even after assignment removal, house deactivation or historical shift cancellation/modification. This avoids silently abandoning the open record. It does **not** grant House Profile, client, address/phone/GPS or other employee access. History shows only the linked house's name/ID and schedule/attendance metadata. General House/Client services continue to deny withdrawn access.

Inactive/revoked employees and inactive organisations cannot self-close. Their evidence remains retained and management can inspect relevant records through its authorised read view; an exceptional management-resolution process is future work, not a hidden override. Production-unapproved policies also remain unavailable while recorded history is retained. Read-only own/management history does not require today's write-policy activation to display an already recorded event.

Normal scheduling services already reject edits/cancellation when attendance exists. For externally modified legacy relationships, closure preserves recorded identity/house/clock-in evidence and does not rewrite it to match a changed schedule. Displayed linked schedule fields may reflect privileged legacy changes; no missing historical schedule snapshot is invented.

## Open/completed state and immutable evidence

State is derived: clock-in with no clock-out is OPEN; a recorded clock-out is COMPLETED; an existing incomplete legacy row is labelled INCOMPLETE. No duplicate status table or unrelated attendance store is added. An open event stays visible on My Shifts/Dashboard after the scheduled end. After closure, actual in/out and recorded elapsed remain visible after refresh/fresh login and through the history link.

Migration **202610250005_clock_out** adds nullable clockOutRequestId/digest, policy version/snapshot and verification label to existing AttendanceRecord. The existing clockOut timestamp is reused. Legacy completed records remain without fabricated policy/idempotency metadata. A unique clock-out request key and complete-metadata/positive-interval check protect new completions.

The existing evidence trigger is extended: original nonnull clock-in, IDs/ownership/house, measured accuracy/time, GPS result, original policy/request metadata and creation time cannot change. Completed clock-out time and completion metadata cannot be changed or reopened; completed/verified records cannot be deleted through ordinary writes. The house-match check still applies on insert/association changes, without falsely rejecting safe closure merely because an externally modified schedule points elsewhere. Original clock-in policy/evidence/audit is never overwritten by clock-out metadata. Phase 2E introduced no raw staff coordinate columns, and this phase adds none.

Audit action `attendance.clocked_out` retains tenant, trusted actor, attendance/shift UUID, policy version and test verification label, without position/accuracy metadata. Audit remains append-only. Audit failure rolls back closure and its metadata. This is minimal mutation audit, not a full compliance or tamper-proof storage system; privileged operator access/retention still need review.

## Concurrency and uncertain responses

Organisation/actor locks serialize competing lifecycle and relationship changes. Existing unique attendance-per-shift and single-open-per-employee constraints remain. Completing a record releases its open-record slot without reopening or deleting anything.

The clock-out request digest is HMAC-SHA256 over an operation-specific canonical tuple, using the existing server secret. Same request ID/payload returns the original committed result with replayed true and no new audit/timestamp. Another request attempting to change a completed record conflicts. Request-key collisions and concurrent competing writes fail safely. Exact retry is an authorised read of a committed completion and can still return it after current write policy is removed; active identity/ownership are rechecked. Secret rotation can require refreshing history instead of replaying an old attempt.

Clock Out uses a confirmation dialog and an immediate in-flight guard. A lost response retains the same request key in memory and offers Retry previous request; refresh reads PostgreSQL. A disabled button alone is not the duplicate guarantee. No location is collected during no-location closure. Navigating away cannot promise cancellation of a transaction already sent; check recorded history on return.

## Recorded elapsed time and NZ presentation

Elapsed milliseconds are actual clockOut UTC instant minus clockIn UTC instant. Missing/reversed/invalid values do not generate invented hours. New completions require a positive interval. Display uses hours and whole minutes, with `<1 min` for a positive sub-minute interval; legacy exact zero remains zero rather than being rewritten. No scheduled hours, rounding-up entitlement, overtime, paid/unpaid break or certified payable hours are inferred.

Pacific/Auckland is explicit for display, including actual dates/years. UTC subtraction naturally handles overnight/year boundaries and NZ's two-/four-hour DST examples. Date filters refer to the scheduled NZ shift date using explicit UTC range conversion, never the browser timezone. Open records show no completed duration.

## History and management read contracts

| Endpoint | Authority |
| --- | --- |
| GET `/api/attendance` | Current employee's own tenant records only |
| GET `/api/attendance/:id` | Own record detail, otherwise unavailable |
| GET `/api/admin/attendance` | `admin.attendanceViewing`, Manager/Administrator, same organisation |
| GET `/api/admin/attendance/:id` | Same management scope and record tenant |

Staff cannot supply another employee selector or call management reads. Optional validated filters are from/to scheduled date, house, status and page; management additionally has employee. Unknown/duplicate/array filters, malformed IDs/dates/status/page and reversed ranges fail safely. Retrieval is bounded to six Staff or twenty Admin rows, with deterministic ordering and Previous/Next pagination. Detail lookup is independently scoped so a selected record can be opened outside the current page/filter.

DTOs contain only attendance/shift/employee/house IDs and display names, linked schedule times/status, actual clock-in/out, derived state/elapsed and safe action availability. They exclude raw coordinates, measured accuracy/time, original verification evidence, request digests and policy snapshots. Admin action availability is read-only and no management Clock Out, manual override, approval, payroll export or correction action is provided.

Staff `/roster?tab=timesheets` reuses the source table/cards/filters/pagination/modal presentation; it is basic recorded attendance history, not timesheet approval. Admin `/admin/roster?tab=attendance` and `tab=timesheets` reuse the existing desktop shell, tabs, table, filters and attendance Drawer. Empty results, incomplete/open/completed events, unavailable detail IDs, revoked/unauthorised scope and database failures have distinct safe outcomes. No fake entries fill errors/empty states. Existing preview wrappers/interactions/CSS remain isolated and unchanged.

## Verification and next boundary

Final verification passed: 459 unit tests, 130 disposable PostgreSQL service/security tests, 53 local authenticated browser cases and 53 actual Neon cases (each browser suite has four intentional narrow Admin skips), and 619 original Chromium preview cases with 126 intentional skips in one 15.4-minute run. Lint, strict types, formatting, Prisma validation and `npm run build` passed. Production probes refused 141 preview routes and failed closed on 15 read/auth and 15 mutation APIs. Nine configured secrets and ten restricted markers were absent from 123 production chunks. All 11 original clock-in hashes and five applied migration checksums match source; 12 fictional completed records have 12 completion audits. [Implementation status](implementation-status.md) records final results. Existing GPS policy, validation, permission, duplicate and privacy assertions remain. One old scheduling fixture teardown stopped deleting completed evidence because the stronger retention trigger correctly rejects it; all assertions remain and the disposable cluster handles teardown.

Physical hosted HTTPS/Android acceptance remains unverified. Browser GPS in these tests is explicitly mocked; no APK, real phone GPS claim or production deployment is included.

Recommended Phase 2G is a separately authorised persistent Client Diary slice consistent with the frozen submission MVP: current client/house/author scope, immutable submission/history, safe draft decision and transactional audit. Do not assume its detailed requirements or start it automatically. Attendance corrections, payroll, approvals, Leave, care submissions, files and delivery remain deferred. Production attendance activation and clock-out location policy require separate approval.
