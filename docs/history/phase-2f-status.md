# Implementation status — Phase 2F

Persistent clock-out now completes the existing PostgreSQL attendance record under an explicit development-only no-location test policy. Staff own attendance history and management read-only attendance use the same records. Original GPS clock-in evidence remains immutable. Production attendance is deliberately disabled; organisational policy approval and physical HTTPS/Android acceptance remain outstanding. [Service and policy contracts](../clock-out-attendance-backend.md) describe the current boundary; [Phase 2E status](phase-2e-status.md) preserves the prior iteration.

## Git and preservation

The user authorised pushing Phase 2E before Phase 2F. Complete checkpoint **862c074d8d21aa4025807d11b9dd5dd468be9162** is pushed on `phase-2e-complete`. The completed Phase 2F checkpoint was pushed on `phase-2f-complete` at **28540084c4f87802dc49bec0c782aff67ee74a5a**, at the user’s request before starting `phase-2g`. Phase 2D **470dcaa485803165e8f351e7d2a893082c79e351** and older branches remain intact. No reset, reference deletion or deployment. Fifty pre-existing duplicate screenshots remain untouched and excluded.

## Implemented boundary

- Active Auth.js session/account/org/session-version checks; owner-scoped clock-out, own history and capability-scoped same-organisation management reads.
- Strict two-field clock-out request, server receipt timestamp, existing record update and atomic minimal audit. Original clock-in metadata/audit are preserved. Completed evidence cannot be rewritten, reopened or ordinarily deleted.
- Organisation/actor transaction locks, request uniqueness and HMAC exact retries. Lost-response retry reads the committed timestamp; a conflicting completion fails safely. Audit failure rolls back closure. Completing attendance releases its single-open-record slot.
- Explicit UNCONFIGURED / NO_LOCATION_REQUIRED / LOCATION_REQUIRED policy boundary. Only acknowledged fictional development NO_LOCATION_REQUIRED is executable. Required location is unavailable rather than bypassed. Production always fails closed; normal app environment enables no test policy.
- Closure after scheduled end, overnight/year/DST boundaries and historical cancelled/changed shifts. Withdrawn assignment/inactive house permits only minimal own historical attendance and safe closure; House/Client access stays denied. Inactive/revoked employees cannot close.
- Mobile My Shifts committed open/completed states, actual in/out, UTC-derived elapsed attendance and history links survive refresh. Dashboard remains accessible without clock-in. No new location capture during no-location closure.
- Staff `/roster?tab=timesheets`: own bounded history, dates/house/status filters, detail and pagination. Management `/admin/roster?tab=attendance` and `tab=timesheets`: bounded tenant read view, employee/house/date/status filters and source Drawer. No overrides, approvals, correction or payroll actions.
- Safe DTOs exclude location evidence, request digests and policy snapshots. Empty/error/unavailable results never substitute fictional records. Original development demonstrations remain separately isolated.

## Neon and schema

Only development **phase-2a / br-billowing-rice-a78isrig**, project `fragrant-snow-30323119`, was used. Ready branch, matching pooled/direct target, verified client TLS and exact four baseline migration checksums were checked before applying **202610250005_clock_out**. Expiry: **24 November 2026, 11:18 NZDT**. Production was untouched; populated data was not reset/reseeded.

Migration 005 adds five nullable completion policy/request fields to existing AttendanceRecord, reuses clockOut, enforces metadata completeness/positive new intervals/request uniqueness, extends evidence immutability and allows minimal `attendance.clocked_out` audit. Legacy records are not falsely backfilled. All 11 original clock-in evidence hashes match the pre-migration snapshots; those original records remain open and unchanged. Five applied migration checksums match source. Final development checks found 12 completed Phase 2F test records with 12 corresponding completion audits, all explicitly test-only; generated GPS/clock-out accounts are inactive. Original seed attendance remains zero and raw-coordinate columns remain absent.

Guarded tests use a separate fictional Phase 2F organisation and explicit test policies. Generated accounts are deactivated; attendance/audit history remains. The existing Phase 2E organisation still has no clock-out policy. Destructive rollback tests run only in disposable local PostgreSQL.

## Verification

Node 22.23.4, Prisma 7.10.1 and existing dependency versions are retained. Focused and final stable checks passed; physical-device acceptance and organisational approvals remain outstanding.

| Check | Result |
| --- | --- |
| Lint / strict TypeScript / formatting / Prisma validation | Passed |
| Unit tests | 459 passed / 19 files |
| Disposable PostgreSQL services/security | 130 passed / 5 files |
| Focused Staff/Admin browser journey at 390px | 3 local and 3 actual Neon passes |
| Complete authenticated local and Neon browser suites | Local: 53 passed / 4 intentional narrow Admin skips; actual Neon: 53 passed / 4 identical intentional skips |
| Original Chromium preview regression | 619 passed / 126 intentional narrow Admin skips, one uninterrupted 15.4-minute run at 375/390/768/1280/1440px |
| `npm run build` | Passed; compiled in 8.7s |
| Production isolation | Passed: 141 preview routes refused; 15 read/auth and 15 mutation API probes failed closed |
| Secret/bundle scans | Nine configured secret values and ten restricted markers absent from 123 production chunks; changed source scan and private-file permissions passed |
| Reference/CSS/dependency preservation | 475 authored hashes unchanged; 51 reference files and three original CSS copies exact; dependencies and old unit/preview assertions unchanged |

The full preview run used frozen source/tests/tooling throughout. Final 475-file manifest, original reference/CSS, dependencies, source scans and workspace checks were verified afterward. No unresolved automated-check blocker remains.

One initial local authenticated run reported an existing management login submission with empty-field feedback (52 passed, one failed, four skipped). Its unchanged isolated rerun passed. The complete unchanged local rerun passed all 53 cases with four intentional skips (3.2 minutes), alongside all 130 database tests; no assertion or authentication relaxation was introduced.

One old scheduling fixture teardown stopped deleting completed evidence because the stronger retention trigger correctly rejects deletion; its assertions remain intact and disposable cluster teardown handles cleanup. Existing unit and original preview assertions are unchanged. Browser GPS is mocked test evidence, never physical-device acceptance.

## Remaining limits and next step

No hosted HTTPS/physical Android acceptance, production policy activation, APK/PWA packaging or deployment was performed. Production policy values, location requirement, privacy/evidence retention/dispute procedures and exceptional resolution for inactive employees require organisational decisions. Browser GPS can be spoofed and does not conclusively establish presence.

Recorded elapsed attendance is not certified payable time. Payroll, breaks/overtime calculations, approvals/corrections, manual overrides, Leave, Client/House Diary or Care Plan persistence, private files, notification delivery and template publishing remain deferred. Preview functionality remains labelled simulation.

Recommended next assignment: separately authorised **Phase 2G — persistent Client Diary**, with trusted client/house/author scope, immutable submissions/history, an explicit draft decision and transactional audit. Phase 2G has not been started. Production attendance activation requires separate policy approval and physical HTTPS/Android acceptance.
