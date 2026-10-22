# Implementation status — Phase 1B

Login, Clock-in / My Shifts, Dashboard and the shared Staff shell are implemented as a **development-only UI prototype**. Phase 1B adds Assigned Houses, House Profile, Client Profile, read-only Contacts/NOK and scoped Search. Documentation destinations remain Phase 1C placeholders; no backend integration has been implemented. [Phase 1A checkpoint](history/phase-1a-status.md) records the preceding verification. [Phase 0 checkpoint](history/phase-0-status.md) remains available for historical context.

Statuses: `original` = retained source; `ported` = adapted; `UI-matched` = inspected against source rendering with documented differences; `backend-connected` = authorised persistent service; `tested` = relevant passing checks; `blocked` = external decision/integration required. Visual inspection is not independent designer approval.

| Area | Status | Evidence and limits |
| --- | --- | --- |
| Login | ported, UI-matched, tested | Source branding/fields/reveal/validation/loading/recovery UI; explicit development mock session, no password branches or fake email success. Production sign-in remains unavailable. |
| Clock-in / My Shifts | ported, UI-matched, tested | Original highlighted hero/map/rows/detail/CTAs; current or nearest upcoming, three rows including highlighted. Both real attendance controls disabled; unavailable/denied/retry and separate visual demo-active state. |
| Staff Dashboard | ported, UI-matched, tested | All source sections: profile, shift summary, both assigned houses, three scoped clients, four shifts, selectable coworkers and published notices. |
| Shared Staff layout | ported, UI-matched, tested | Source-derived sidebar, mobile header/bottom navigation/menu, container, page header/back, cards, modal, empty/loading/error presentation. URL navigation, refresh/back and deep entry. |
| Development adapter | ported, tested | One typed fictional employee/house/assignment/client/shift/notice model and read interface; shared snapshot. Tests cover another employee and excluded houses/clients/notices. This is not access-control enforcement. |
| Houses, House/Client profiles, Contacts/NOK | ported, UI-matched, tested | Source-derived listing, overview, photos/initials, tabs, notices, breadcrumbs and read-only contact cards. All assigned houses appear; current-shift house highlighted. Invalid/unassigned IDs return HTTP 404 without identifying details. Photo/concern controls open honest preview-only dialogs. |
| Search | ported, UI-matched, tested | Typed scoped queries match full/preferred names and houses; house matches include associated clients. Search DTOs exclude contacts, identifiers and profile details. Clear, empty, no-results, query URL, back and refresh covered. |
| Other Staff routes | original | Roster, Notifications, Profile, Leave and Settings have functional navigation to labelled placeholders. No business workflows ported. |
| Admin CMS | prior ported shell, tested | Separate desktop-only presentation retained; width-gate smoke checks and build pass. No Admin page implementation changed in Phase 1B. |
| Styles/assets | original, tested | Three source CSS copies byte-identical. Remote fonts now load correctly, source image URLs retained. Screenshot fixtures replace images/tiles only during comparison. |
| Preview boundaries | ported, tested | Development opt-in required on server layouts and pages. Production 404/content checks cover 12 preview/detail URLs even with flag enabled. No fake business endpoints. |
| Auth.js / permissions | blocked | NOT IMPLEMENTED. Mock session marker is not trusted identity. No real role/organisation/house enforcement. |
| Prisma / Neon / persistent records | blocked | NOT IMPLEMENTED. No schema/migrations, database credentials or services added. |
| GPS / attendance | blocked | NOT IMPLEMENTED. No device location request, radius/accuracy rule, persisted clock-in/out or success claim. Clock-out policy pending organisational sign-off. |
| Files / Blob / other care workflows | original, blocked | NOT IMPLEMENTED in active migrated screens. Original prototypes preserved for future migration. |
| Production deployment | blocked | No Vercel deployment or privacy/security/operational acceptance performed. |

No feature is `backend-connected`. `UI-matched` above means close source-rendering parity with the safety differences recorded in [UI migration notes](ui-migration-notes.md), not a pixel-exact certification.

## Final verification

| Command / inspection | Result |
| --- | --- |
| `pnpm lint` | PASS, zero warnings; no rule disabled to accommodate the migration |
| `pnpm typecheck` | PASS, strict TypeScript and generated route types |
| `pnpm format:check` | PASS, active source/config/tests/scripts |
| `pnpm test` | PASS, 22 tests across preview/time, Staff adapter, scoped record/contact/search queries and tab validation |
| `pnpm test:e2e` | PASS, 75 tests: 15 cases × 375, 390, 768, 1280, 1440px Chromium viewports |
| `pnpm build` | PASS, production webpack build including Admin and migrated Staff detail screens |
| `pnpm test:production` | PASS, 12 preview/detail paths refuse production requests and contain no fixture identities, even with preview flag set |
| Source integrity | PASS, archive extraction and all three original CSS copies unchanged |
| Visual comparison | Inspected ten Phase 1B paired boards (profiles and contacts/search at five widths), in addition to Phase 1A evidence. Original and migrated typography metrics agree; no unintended document horizontal overflow. |

Tests cover development form → shifts → dashboard without attendance; current/nearest shift selection and three-row limit; multi-house and scoped client visibility; dashboard detail/team navigation; coworker selection; GPS unavailable/denied/retry with disabled attendance; demo-only active appearance; modal Escape; reveal/validation/recovery; desktop/mobile navigation; Admin width gate; refresh/back; source-rendering screenshots. Implemented screen flows report no pageerror events in the browser cases that collect them. All five-width captures and metadata are in `docs/ui-comparisons/`.

The comparison runner uses original JSX/CSS with the same fictional snapshot and frozen time. External photos/map tiles are deterministic substitutes in tests, not in the app. Captures are reviewed source comparisons, not an automated pixel-diff threshold or Figma screenshot acceptance.

## Remaining limitations

- Production authentication, password delivery, real attendance/location policy, persistence and file handling remain unimplemented. No real personal/health data has been introduced.
- The browser UI marker stores no entered credentials and grants no access. Direct development preview entry remains possible by design; only server development gating exists today.
- The extra development/safety text changes vertical positions and some wrapping; normal Clock In/Out stay disabled. Static demonstration-house map is not verified location or continuous tracking.
- Existing remote fonts/photos/tiles need availability/licence/privacy review. No font binaries were copied. No physical-device/Safari/Firefox, exhaustive accessibility or independent design acceptance was performed.
- Host verification used Node 25.9.0/pnpm 10.15.1; Node 22 LTS CI verification is outstanding. Existing ESLint 9 deprecation and webpack-vs-sandboxed-Turbopack limitations remain as documented in Phase 0.
- No new dependencies, schema, API or deployment was added. Diary, assessments, charting and gallery remain explicitly labelled Phase 1C placeholders. Contacts are read-only; the Admin editing workflow is not implemented. At Git publication, inherited `.next` build artifacts were removed from the index and ignored; local copies were retained. The local `reference/` archive is also ignored and excluded from the commit.

No blocker remains for reviewing Phase 1B. Next: **Phase 1C documentation UI migration**, starting with the original House/Client Diary screens and retaining the shared adapter and URL patterns. Do not automatically start backend integration.

## Git publication

`reference/` is local-only and omitted from Git. Functional tests and migrated-screen captures run on fresh clones; original-export comparisons additionally run when local reference sources exist. `CAREMETRICS_SKIP_REFERENCE=true pnpm test:e2e` verifies this path without moving or deleting the local archive.

## Phase 1B verification details

The browser suite retains all six Phase 1A cases and adds nine cases per width for houses, clients, contacts, search, placeholder tabs, invalid/unassigned routes, preview actions, failed images and source comparisons. All 75 passed. Unit tests include no-assignment and alternative-employee snapshots and recheck assignment scope even when passed a broader snapshot. Production checks cover search/query tabs and unassigned URLs with preview enabled. Unassigned seed names were absent from production client JavaScript chunks.

The server detail loader checks the fixed development employee's assignments before rendering; this demonstrates scope but is not authenticated authorisation. Production identity, organisation/role permissions and database/file operations remain outstanding. Source CSS and Admin files are unchanged. Phase 1B screenshots and side-by-side boards are under [ui-comparisons/phase-1b](ui-comparisons/phase-1b/). No pixel-exact or independent design acceptance is claimed.
