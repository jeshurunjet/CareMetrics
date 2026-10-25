# Implementation status — Phase 2B

Essential Staff employee/house/client/NOK reads now use trusted Auth.js sessions and Prisma/PostgreSQL in explicit database mode. Essential Admin directories/details read the same records with management/tenant checks. Original Figma preview remains separately available; deferred writes remain unavailable.

See [Staff data integration](../staff-data-integration.md) for routes, contracts, permissions, safe DTOs, mode/loading/error boundaries and the next-phase handover. [Phase 2A historical status](../history/phase-2a-status.md) preserves the previous checkpoint's evidence and limitations.

## Git and preservation

Phase 2A checkpoint: **a7c5747928f68882b72da1aae34caf60568b7d67**. Current working branch: **phase-2b**. Phase 1E.5: **a66b54612898009b4cabd71fbbc55325fb61d204**. Earlier iterations are preserved. No reset, automatic commit/push or frontend deployment. Fifty pre-existing untracked duplicate screenshots are excluded from the phase. Original reference and CSS remain untouched.

## Implemented

- Session employee identity, active assignments, Dashboard summaries, Assigned Houses, House/Client Profiles, NOK, scoped Search and safe Profile information.
- Server-only route-specific read DTOs; safe failure/empty states without fixture fallback; private/no-store search API.
- Tenant-scoped management employee/house/client read directories/details using existing presentation primitives. Management writes/global search remain unavailable.
- Shared Staff shell/cards/contacts/listing support real reads without mock state; mobile navigation and Continue to dashboard remain.
- Database/browser coverage for session identity, multiple assignments, inactive/deactivated accounts, transfers, NOK, search isolation/minimisation, safe faults and read-only Admin.

No blocking check failures remain. Work is uncommitted and unpushed on `phase-2b`.

No dependency, Prisma schema or migration changes. Next/React/TypeScript and Auth.js/Prisma versions remain as Phase 2A.

## Neon

Development branch **phase-2a / br-billowing-rice-a78isrig** verified ready and extended until **24 November 2026 at 11:18 NZDT** (`2026-11-23T22:18:28Z`). TLS connectivity and applied foundation migration verified before testing. No production data/schema changes. Local preview default remains unchanged; backend tests explicitly enable database mode.

## Final verification

| Check | Result |
| --- | --- |
| Lint, strict TypeScript, formatting | Passed |
| Units | 393 passed / 17 files |
| Disposable PostgreSQL migration/repeat seed/service tests | 18 passed |
| Local authenticated browsers | 21 passed across 375, 390 and 1280px |
| Neon authenticated browsers | 21 passed across 375, 390 and 1280px; 1.1 minutes |
| Complete Chromium preview regression | 619 passed / 126 intentional narrow-Admin skips; 375, 390, 768, 1280 and 1440px; 14.1 minutes |
| `npm run build` | Passed; compiled successfully in 3.2s |
| Production isolation | 141 preview routes blocked with opt-in flag, six disabled-backend APIs fail closed |
| Production client bundles | Nine configured secrets / ten restricted fixture markers absent from 98 chunks |
| Preservation | 51 reference files and three original CSS copies unchanged; dependencies/lockfile/old unit and preview tests unchanged |

Representative real Staff Dashboard/Profile/Client screens were reviewed at 390px, with no viewport overflow, plus Admin Client at 1280px. Four small temporary captures were used. Review found and corrected a missing-photo placeholder that hid Dashboard house-card labels; the existing image height is retained without CSS edits. One incomplete preview run was stopped before that fix; it is not counted as a completed regression run.

All 398 authored source/test/tooling hashes remained fixed throughout the complete preview run. Afterward only the separate backend browser test was refined to wait for a visible, hydrated card before checking its label geometry; application source remained unchanged.

During development, new test locator/composite-key cleanup/readiness errors were corrected. The dev server sometimes logs a closed-stream message during rapid route changes; a production deployment/runtime acceptance is not claimed.

## Remaining limits and next phase

Only fictional development data. Real GPS/shift/attendance/Diary/Care writes, files, notifications, Leave, corrections and full Admin CRUD are not connected. Production deployment and operational/privacy/security acceptance remain outside this phase. Firefox's pre-launch profile-folder blocker, Safari/physical-device and exhaustive accessibility/security testing remain unverified.

Recommend a separately authorised bounded Phase 2C for management mutations with validation, tenant/role enforcement, audit, conflict handling and revocation tests. Preserve this read integration checkpoint first. No Phase 2C starts automatically.
