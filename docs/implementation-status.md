# Implementation status — Phase 2A

Phase 2A establishes the database/authentication/access-control foundation, with actual Neon development connectivity and bounded real read APIs. The complete Staff/Admin business frontend remains preserved in development-preview mode; it is not fully backend-connected. [Backend foundation](backend-foundation.md) contains configuration, schema, migration, accounts, access rules, commands, verification and limitations. [Phase 1E.5 status](history/phase-1e5-status.md) preserves the UI freeze.

## Git and preservation

Checkpoint **a66b54612898009b4cabd71fbbc55325fb61d204**, working branch **phase-2a**. All previous branches/reference/CSS/evidence/tests remain. The user subsequently authorised committing and pushing the full Phase 2A version on this branch; no reset/discard or frontend deployment. Fifty unrelated untracked duplicate screenshots remain outside this phase. The user's later Neon instruction separately authorised CLI/MCP and PostgreSQL infrastructure setup.

A planning summary is available in [context for the next phase](phase-2a-next-phase-brief.md).

## Implemented

- Matching Prisma 7.10.1 schema/client/pg adapter, versioned transactional initial migration, tenant foreign keys/uniqueness/indexes/checks, exact immutable template/submitted-original relationships.
- Auth.js 5.0.0-beta.32 Credentials with Argon2id hashes, encrypted JWT sessions, server-derived employee identity, current role/status/assignment checks, session-version invalidation, sign-out and durable atomic login throttling.
- Server-only Prisma/pg pool with Neon pooled runtime/direct migration URLs, verified TLS and Vercel pool lifecycle wiring. Missing security configuration fails closed.
- Minimal safe current-employee/house/client/NOK read APIs, management/capability helpers, generic errors and private/no-store responses. No generic CRUD API.
- Original Login appearance with real mode; protected My Shifts → Dashboard without clock-in; bounded management entry and desktop gate. The remaining completed UI stays development-only until its data is integrated.
- Repeatable nonproduction fictional seed, no default passwords or automatic production privileged accounts; safe private credential provisioning and disposable local PostgreSQL verification.
- Neon CLI 8.11.1, official Neon/Postgres skills and project-scoped OAuth MCP configuration. CLI setup verified after the user's sign-in; MCP first-use connection is not claimed.

Next/React/TypeScript remain **16.3.8 / 19.3.1 / 5.9.3**; package manager remains pnpm 10.15.1. Dependencies/lockfile are updated; no framework redesign/upgrade. Auth.js v5 beta status is explicit. The formatter now excludes generated Prisma files while retaining authored source/tests/configuration checks.

## Neon evidence

Specified org/project linked and environment pulled privately. `neon config plan` and `neon deploy` reported **No changes — branch production already matches the policy**, utilised service **Postgres**. No unrelated Neon service or frontend was deployed.

New isolated **phase-2a** Neon branch was verified empty before applying migration **202610250001_initial_foundation** and seeding fictional accounts twice. The production schema/data was not migrated/reset/seeded. Real Neon login, authenticated queries and role/house denial passed all **10 two-width browser tests** in the focused run. CLI-created development branch has a seven-day TTL; review lifecycle before relying on it long term. Ignored `.env.local` and `.neon` point to this development branch, with the normal mock preview still the default locally.

## Final verification

Verified on **Node 22.23.4 / pnpm 10.15.1**. Final source was frozen before database/browser checks; all **385 authored source/test/tooling hashes** remained unchanged. Existing assertions were retained.

| Check | Final result |
| --- | --- |
| Lint | Pass, zero warnings |
| Strict TypeScript | Pass, canonical generated types restored after servers stopped |
| Authored-file formatting | Pass |
| Unit tests | **393 passed / 17 files** |
| Disposable PostgreSQL integration | Migration and repeat seed pass; **12 service/constraint/security tests** passed |
| Disposable PostgreSQL real-auth browser | **10 passed** at 375/1280px |
| Actual Neon development real-auth browser | **10 passed** at 375/1280px after the successful build |
| Full original Chromium preview regression | **619 passed / 126 intentional narrow-Admin skips**, 745 total, 12.6 minutes; zero failures |
| Explicit `npm run build` | Pass: **Compiled successfully in 4.0s**, TypeScript and route generation completed |
| Production isolation | All **141 original preview URLs refused** even with flag enabled; inert disabled-mode login; **five added API probes** fail closed with forged browser identity |
| Client bundle isolation | **Nine configured secret values and ten restricted fixture markers absent from 98 chunks** |
| Source/reference preservation | **51 original export files and three CSS copies unchanged**; no existing unit/e2e assertions edited |
| Repository | git diff --check clean; no tracked env secrets, Neon pointer, generated Prisma client or reference files |

The complete original five-width regression ran once after stabilisation. Admin workflows/gating are included at its 375/390/768/1280/1440 widths; the separate six-width Admin repetition was not needed for this bounded backend phase. Real auth was independently exercised at mobile/desktop widths against both temporary PostgreSQL and the actual isolated Neon branch. No application/test/config edits occurred during the final browser runs; no new large visual collection was created.

Focused development failures were new-test type/alert-locator assumptions and the fact that Next.js streams a deferred unavailable page as HTTP 200 with a 404 signal after the authenticated layout waits. Those were corrected in the new tests without weakening old assertions; APIs continue to enforce explicit error statuses. Initial Neon linking was offline until the user signed in; it was subsequently verified and deployed successfully. No failed final checks remain.

## Remaining boundaries

No real GPS/geofencing/attendance writes, Diary or Care Plan submission service, full Admin CRUD, private files, Leave/correction/builder/delivery/concern/reporting backend or frontend deployment. Real entry pages are bounded foundation views, not finished business-data integration. Current preview role switching and session CRUD remain fictional and unavailable in real mode. No Phase 2B starts automatically.

No infrastructure credential blocker remains for the verified Neon development branch. MCP OAuth first-use connection/reload remains unverified; CLI provides verified access. Production account provisioning, least-privilege roles, HTTPS/Vercel deployment, organisational session/attendance/privacy/security policies, backups/restoration and operational acceptance remain prerequisites. Auth.js beta monitoring is required. Firefox remains blocked before launch; Safari, physical devices, exhaustive accessibility and penetration/production acceptance remain unverified.

Recommended next: separately authorise Phase 2B's bounded Employee/House/Client frontend integration using the trusted server DTOs, preserving the frozen design and development preview. Do not begin GPS, Diary/Care submission or deferred backends until their own scope is authorised.
