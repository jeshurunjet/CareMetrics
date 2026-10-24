# CareMetrics — context for planning the next phase

## Completed baseline

Phase 2A follows the complete Phase 1E.5 UI freeze at `a66b54612898009b4cabd71fbbc55325fb61d204`. The `phase-2a` Git branch contains the complete application plus the new backend foundation; earlier branches remain previous iterations. Original Figma references and CSS are preserved locally. Reference files, secrets, generated Prisma code and fifty unrelated duplicate screenshots are excluded from the new commit.

The approved stack remains Next.js App Router, React, TypeScript, Auth.js, Prisma, Neon PostgreSQL, eventual private Vercel Blob and Vercel. Installed framework versions remain Next 16.3.8, React 19.3.1 and TypeScript 5.9.3. Verified runtime is Node 22.23.4 with pnpm 10.15.1. Backend additions include matching Prisma/client/pg adapter 7.10.1, Auth.js `next-auth` 5.0.0-beta.32 and Argon2 0.45.1. Auth.js beta status is explicit; do not silently change authentication providers.

## What actually works

- A versioned transactional initial Prisma migration, applied to an isolated Neon development branch, plus repeatable fictional seeding.
- Database-backed email/password authentication, Argon2id hashes, Auth.js encrypted JWT sessions, real sign-out and database-backed login throttling. No default passwords or open registration.
- Server-derived active employee/organisation identity; current role and house/client checks. Client-supplied roles/employee IDs and development session markers grant no authority.
- Current role/assignment changes affect the next protected operation. Account password/status changes invalidate previous sessions; sign-out deliberately invalidates all sessions for that employee.
- Explicit safe employee/house/client/NOK DTOs with private/no-store responses and sanitised errors. Cross-house and cross-organisation access is denied.

Read APIs are `GET /api/me`, `/api/houses`, `/api/houses/[id]/clients`, `/api/clients/[id]` and a bounded management-only `/api/admin/foundation`. Auth.js uses `/api/auth/[...nextauth]`. There is no general model/CRUD API.

The schema includes Organisation, User/Role, House, EmployeeHouseAssignment, Client/ClientContact, Shift/AttendanceRecord, CareTemplate/Version/Assignment, ClientDiaryEntry, CareRecord and security counters. Composite tenant foreign keys, uniqueness, timestamp/coordinate checks and triggers protect relationships and immutable published/submitted originals. Having tables does not mean those business services exist.

## UI/backend separation — essential for the next instructions

The full approved 43-page Staff/Admin UI still works in deliberate **development preview mode**, using fictional in-memory records. Its components, layouts, styles, interactions and navigation are preserved.

Explicit `CAREMETRICS_BACKEND_MODE=database` disables that mock provider even if the preview flag is true. Real mode has the original Login design plus bounded authenticated My Shifts, Dashboard and management entry views. These are foundation views, **not the finished original business screens connected to Prisma**. Other feature pages remain unavailable in real mode so genuine login cannot unlock fictional CRUD as if it were persistent.

The normal local configuration deliberately preserves preview mode by default. The documented separate real-mode command selects database mode explicitly. Keep Login → My Shifts → Dashboard, including continuing without clock-in. Do not make attendance a prerequisite for accessing assigned houses/clients.

## Neon state and environment

The requested CareMetrics Neon project was linked. `neon deploy` reported that `production` already matched the PostgreSQL-only policy. No managed Neon Auth, storage, Functions, Data API or frontend deployment was introduced; Auth.js remains the application authentication provider.

An isolated Neon `phase-2a` development branch was created and its public schema verified empty before migration/seed. Production schema/data was not migrated, reset or seeded. The development branch inherited a **seven-day TTL**; review its expiry/lifecycle before relying on it for the next phase.

Runtime uses pooled `DATABASE_URL`; migrations use direct `DATABASE_URL_UNPOOLED`, with `DIRECT_URL` as a legacy alias. Remote certificate verification is retained. Actual connection values, Auth.js secrets and generated account credentials remain private and ignored. They are not supplied by Git checkout. See `.env.example` and the backend foundation runbook for setup. Restart a real backend process after switching branches/connection configuration.

Neon CLI and official skills were installed and used successfully. Codex MCP is configured with project-scoped OAuth, but its first-use OAuth/tool connection was not verified in the agent runtime. CLI operations and actual PostgreSQL integration were verified independently.

## Verification evidence

All final checks passed on frozen application source:

- Lint, strict TypeScript and authored-file formatting.
- 393 unit tests across 17 files.
- Isolated PostgreSQL migration, repeat seed and 12 service/constraint/security tests.
- 10 real-auth browser tests against local PostgreSQL and 10 against actual Neon, at 375/1280px.
- Full existing development-preview Chromium suite: 619 passed, 126 intentional narrow-Admin skips; all 745 cases accounted for.
- Explicit `npm run build` passed.
- All 141 prior production-preview URL checks retained, plus five disabled-backend API probes with forged browser identity.
- Nine configured secret values and ten restricted fixture markers absent from 98 production client chunks.
- All 51 original export files and three CSS copies unchanged; no existing unit/e2e assertions weakened.

Chromium viewport tests are not physical-device acceptance. Firefox remains blocked before launch; Safari, physical devices, exhaustive accessibility, penetration testing and production operations remain unverified.

## Recommended next bounded phase

Prepare a separately authorised **Phase 2B: Employee/House/Client frontend read integration**, based on the actual current repository and [backend foundation](backend-foundation.md), [implementation status](implementation-status.md), [route map](route-map.md), [frozen MVP](submission-mvp-scope.md) and [UI handover](ui-freeze-and-backend-handover.md).

Connect the existing approved Staff presentation incrementally to authorised server DTOs: own identity, assigned houses, current clients/profile/NOK and the Dashboard context those reads support. Specify the precise screens and required safe DTO extensions first. Preserve the independent preview, current responsive behaviour, direct URLs/refresh/Back, Admin desktop gate and negative access tests. Decide explicitly whether any essential Admin read-only integration belongs in that bounded phase; do not assume Phase 2A supplied Admin CRUD or permission to implement it.

Do not broaden this into GPS, attendance writes, Diary/Care persistence or the entire backend. Do not replace the UI, duplicate stores, expose whole database models or authorise from browser roles. Do not activate deferred modules as permanent services.

Remaining submission services need later phases: actual shifts, policy-approved GPS clock-in/clock-out/attendance, persistent Client Diary and predefined-version Care Plan submissions/history, plus essential Admin management. Advanced Charting, secure galleries/uploads, full Leave, both correction approval workflows, live builder publication, notification delivery, concern review and advanced reporting remain deferred.

Before production: separately approve provisioning/recovery, session/throttle policy, GPS/clock-out policies, least-privilege DB roles, HTTPS/Vercel deployment, secrets, backups/restoration, monitoring/retention and organisational NZ privacy/security acceptance. Continue using fictional data. No next implementation phase starts automatically.
