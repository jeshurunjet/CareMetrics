# Implementation status — Phase 2C

Essential Admin management now uses transactional PostgreSQL services and minimal persistent audit events, with current server permissions and session revocation. Staff reads the same employees/houses/clients/NOK. The original Figma preview remains separately available. [Mutation contracts](admin-backend-mutations.md) describe routes, permissions, validation, transactions, conflicts, audit, provisioning limits and the next boundary.

## Git and preservation

Completed Phase 2B is checkpointed locally at **8bafa57550f3bb2bf4a1870764800e29e422957e**, on `phase-2b`. Work is on **phase-2c**, uncommitted/unpushed. Phase 2A remains **a7c5747928f68882b72da1aae34caf60568b7d67**; earlier branches remain intact. No reset, reference deletion, production deployment or push. Fifty pre-existing duplicate screenshots are excluded. [Phase 2B historical status](history/phase-2b-status.md) preserves its evidence.

## Implemented

- Invited employee creation, permitted details/role/status edits, controlled activation/deactivation, active house assignments/removal with scheduled dependencies checked.
- House create/edit/address/contact/status and paired provisional coordinates; unsafe deactivation is blocked.
- Client create/edit/status, exactly one house, confirmed transfer, stable history and IDs; transactional NOK create/edit/primary/emergency/confirmed removal.
- Administrator-only existing role changes; Managers cannot promote themselves or edit Administrator accounts/assignments. Self/last-admin protections remain server enforced.
- Role/password/status changes revoke old sessions through the database trigger. Removed assignments/transfers affect the next protected Staff operation.
- Append-only tenant/actor-scoped AuditEvent, non-sensitive summaries and timestamps in the same transaction as successful management changes.
- Existing forms/pickers/contacts/source CSS reused with saving/error/conflict feedback; unsupported model fields and operational writes remain disabled, with no mock fallback.
- Explicit same-origin, bounded JSON mutation APIs and optimistic revision checks; no generic CRUD/password endpoint.

Prisma architecture and dependencies remain unchanged. Migration `202610250002_admin_audit` adds the required audit/primary-contact/revocation foundation and was applied only to verified Neon development after disposable-database testing.

## Neon

Development **phase-2a / br-billowing-rice-a78isrig** is healthy, expires **24 November 2026 at 11:18 NZDT**. Endpoint/database identity, client TLS and existing primary-contact consistency were verified before migration. No populated database reset/reseed and no production changes. Fictional integration test data is archived through authorised operations; audit remains. Normal local preview on 8443 remains unchanged; real mode is explicitly enabled separately.

## Verification

All required final checks pass on Node 22.23.4. Application, test and tooling source remained frozen throughout final verification/resume.

| Check | Result |
| --- | --- |
| Lint / strict TypeScript / formatting | Passed; zero lint warnings |
| Prisma schema validation | Passed |
| Unit tests | 393 passed / 17 files |
| Disposable PostgreSQL migration, repeat seed and security/services | 36 passed / 2 files |
| Local authenticated Admin–Staff browsers | 25 passed / 2 intentional narrow Admin UI skips; 375, 390 and 1280px |
| Actual Neon authenticated integration | 25 passed / 2 intentional narrow Admin UI skips |
| Existing focused Admin preview core | 16 passed at 1280px |
| Complete Chromium preview coverage | 619 passed / 126 intentional narrow Admin skips; 375, 390, 768, 1280 and 1440px, combined interrupted + resumed runs |
| `npm run build` | Passed; compiled successfully in 4.0s |
| Production isolation | 141 historical preview routes blocked; six read/auth plus ten mutation API probes fail closed |
| Production client bundles | Nine configured secrets and ten restricted fixture markers absent from 109 chunks |
| Preservation | 429 source/test/tooling hashes unchanged; 51 reference files and three original CSS copies match the source archive; dependencies/lockfile and original unit/preview tests unchanged |

The original full browser process was interrupted before its summary: 476 cases passed, 126 skipped, 106 failed (predominantly navigation/load timeouts) and 37 were unfinished. On resumption, the exact 143 failed/unfinished cases were selected from the unchanged 745-case inventory using Playwright's test-list support. **All 143 passed in 4.2 minutes without source, assertion or configuration changes.** Combined coverage is therefore 619 passes / 126 intentional skips; this is not presented as one uninterrupted green run. No already successful case needed repeating. Earlier focused Login navigation was made to wait for usable DOM readiness while retaining every security assertion.

Security coverage includes all ten write endpoints against Staff/forged roles/origins, Manager escalation, cross-tenant targets, uniqueness, stale edits, dependency conflicts, audit rollback/immutability, current assignment/client transfer visibility, preserved historical Care/Diary/template identifiers, NOK persistence, failed saves and revoked sessions. The real UI journey uses Admin at 1280px and separate authenticated Staff at 390px. One small representative temporary screenshot was reviewed; no additional large screenshot collection was created. The original regression's source-comparison cases remain intact.

## Remaining limits

Creating an employee does not provision credentials. New records remain Invited; initial credentials/invites/recovery require a separately reviewed secure operator flow. Existing eligible accounts can be deactivated/reactivated. Extra profile/photo/NHI/manager/radius fields not in the current schema remain visibly unavailable in real forms.

No real shift mutations, GPS clock-in/out, attendance writes, Diary/Care submissions, builder publishing, private files, Leave approvals, notifications/concern review, corrections, full reporting or deployment. The audit foundation is not a complete compliance/retention/tamper-proof logging solution. Direct operator SQL is outside the service audit boundary. Auth.js remains beta; production roles, HTTPS/hosting, privacy/security/retention/backup/operational acceptance remain separate requirements. Firefox's historical pre-launch blocker, Safari/physical devices and exhaustive accessibility/security acceptance remain unverified.

Recommend a separately authorised scheduling slice with explicit employee/house/dependency checks before GPS attendance. Location and clock-out policies remain undecided. No Phase 2D begins automatically.
