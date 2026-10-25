# Implementation status — Phase 2D

PostgreSQL shift scheduling now connects Admin Calendar/List/Create/Edit/Cancel/Details to own Staff My Shifts, Roster, Dashboard summaries and authorised House links. All screens share stable Shift IDs, current server permissions and transactional audit. [Shift backend integration](shift-backend-integration.md) contains service contracts, migration, timezone and conflict rules. [Phase 2C historical status](history/phase-2c-status.md) preserves the previous core-management verification.

## Git and preservation

Phase 2C was checked and checkpointed locally at **b005307792f2fac46e7d513ae8435edf4d79a601** on `phase-2c`. The completed Phase 2D checkpoint is on **phase-2d-complete**, created from `phase-2d` at the user’s request to preserve previous iterations. This branch contains the full tracked application and its Git history. Phase 2B remains **8bafa57550f3bb2bf4a1870764800e29e422957e**; Phase 2A remains **a7c5747928f68882b72da1aae34caf60568b7d67**. Previous branches remain intact. No reset, production deployment or reference deletion. The user subsequently authorised committing and pushing this new Phase 2D branch. Fifty pre-existing duplicate screenshots are untouched and excluded.

## Connected functionality

- Admin source Calendar and Shift List, employee/house filters, Create/Publish, Edit, confirmed Cancel and Details use database services. Saving/error/validation/conflict states and committed success feedback are present.
- Current active account, tenant, management capability, active employee/house/assignment, permitted request fields and safe origin/body checks run on the server. Staff and Senior Staff cannot write; scheduling grants no account-admin powers.
- Active overlaps are rejected under the same organisation lock used by Phase 2C relationship changes; adjacent shifts are permitted. Stale revisions and any referenced attendance block unsafe edits/cancellation. Cancellation retains the original UUID/history.
- Staff sees only its own authorised current-house shifts, including current/next/upcoming, calendar/date selection and detail/address/assigner. Dashboard opens the same Roster detail; the House link is independently authorised.
- Pacific/Auckland wall times convert to UTC storage; missing/repeated DST times are rejected. Overnight, month/year boundaries and actual DST durations are handled explicitly.
- Create/update/cancel audit events commit atomically with the mutation; failed saves do not present success. Database failures do not load fixtures.
- Existing employee/house/client/NOK/assignment management and authentication remain connected. Login → My Shifts → Dashboard still permits continuing without clock-in. All original styles/assets/reference and isolated preview behaviours remain.

Migration **202610250003_shift_scheduling** adds nullable assigning-manager identity/notes, same-tenant FK, a read index and permitted audit actions to the existing model. Existing shifts are preserved; unknown historical creators display Not recorded. No duplicate scheduling store, package upgrade or invented manager backfill.

## Neon

The existing development branch **phase-2a / br-billowing-rice-a78isrig** was verified ready, with matching pooled/direct endpoint/database identity and client TLS before writes. Expiry remains **24 November 2026 at 11:18 NZDT**. Migration 003 was applied after disposable PostgreSQL service tests. Foundation/audit migrations and existing fictional records remain; no populated reset/reseed and no production changes. Authenticated integration tests use only fictional accounts; created scheduling records are cancelled through the authorised service, retaining audit history.

## Verification

Required final verification passed. Node 22.23.4, existing Prisma 7.10.1 and existing dependency lockfile are retained.

| Check | Result |
| --- | --- |
| Lint / strict TypeScript / formatting | Passed; zero lint warnings |
| Prisma validation | Passed |
| Unit tests | 393 passed / 17 files |
| Disposable PostgreSQL migrations, repeat seed, security/services | 48 passed / 3 files |
| Focused real scheduling browser | 2 passed at 1280px, with separate Staff 390px context |
| Focused preserved preview | 42 passed / 8 intentional desktop-only skips |
| Complete local authenticated browser suite | 29 passed / 4 intentional desktop-only skips; 375, 390 and 1280px |
| Actual Neon authenticated integration | 29 passed / 4 intentional desktop-only skips; final focused scheduling/calendar recheck 2 passed |
| Full Chromium preview regression | 619 passed / 126 intentional desktop-only skips, one uninterrupted run in 14.9 minutes across 375/390/768/1280/1440px |
| `npm run build` | Passed; compiled successfully in 7.0s |
| Production isolation | 141 preview routes refused; 10 read/auth and 13 mutation API probes failed closed |
| Production bundles / secret scan | Nine configured secrets and 10 restricted fixture markers absent from 114 production client chunks; authored-text scan passed and private files remain owner-only |
| Preservation | 443 final authored hashes verified; 51 reference files and three CSS copies match source archive; dependencies/lockfile/original unit and preview tests unchanged |

The complete preview run had no source/test/tooling changes during execution. A final contract review afterward made omitted notes optional and replaced database implementation wording in the connected UI; a boundary test and real Calendar day/week/month and employee/house filter assertions were added. Original preview code/CSS/assertions stayed unchanged. Lint/types/format/unit/schema, the complete local services/auth suite and production build/isolation/scans were rerun; the further focused Neon scheduling/calendar recheck also passed. The full preview suite was not repeated. No unresolved Phase 2D blocker remains.

The scheduling acceptance test verifies an Admin-created UUID in Staff My Shifts, Roster and Dashboard, opens the authorised House, commits an edit, refreshes Staff and cancels without deletion. It checks persistent actor/audit events, disabled clock-in and the real calendar filters. Read-only Neon verification confirms retained cancelled scheduling test records, create/update/cancel audit and zero attendance in the seed organisation. Representative 390px Staff and 1280px Admin screenshots were inspected; no new large screenshot collection was added. An initial read-validation error mapping and browser test synchronisation were corrected during focused checks. The broader local suite exposed an isolated test AttendanceRecord conflicting with an existing global zero-attendance assertion; the new fixture now removes only its own generated attendance after validation, preserving the existing test and seeded records.

## Remaining limits and next step

GPS acquisition/geofence verification, clock-in/out persistence, worked hours, timesheet approval, attendance corrections, Leave, Diary/Care submissions, secure uploads, notification delivery, live template publishing, APK and deployment remain unavailable in database mode. Team Schedule is also deferred. Preview simulations remain isolated demonstrations. Scheduled time is never attendance or payroll evidence.

New employee credential activation/invitation/recovery, real-data privacy/security approval, hosting/retention/backups and production operations remain separate requirements. The development database has an expiry and is not production readiness.

Recommended next assignment: **Phase 2E**, after approving/versioning GPS/eligibility/accuracy/freshness/receipt-time/geofence policy. Build event-only mobile location validation on the authorised shared Shift IDs and current assignments; preserve Dashboard access without clock-in. Phase 2E has not been started. Only the new Git checkpoint branch is authorised for pushing; no application deployment was performed.
