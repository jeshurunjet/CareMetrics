# Implementation status — Phase 1A

Login, Clock-in / My Shifts, Dashboard and the shared Staff shell are implemented as a **development-only UI prototype**. Phase 1A stops here: no database, production authentication, attendance service or remaining feature modules have been implemented. [Phase 0 checkpoint](phase-0-status.md) remains available for historical context.

Statuses: `original` = retained source; `ported` = adapted; `UI-matched` = inspected against source rendering with documented differences; `backend-connected` = authorised persistent service; `tested` = relevant passing checks; `blocked` = external decision/integration required. Visual inspection is not independent designer approval.

| Area | Status | Evidence and limits |
| --- | --- | --- |
| Login | ported, UI-matched, tested | Source branding/fields/reveal/validation/loading/recovery UI; explicit development mock session, no password branches or fake email success. Production sign-in remains unavailable. |
| Clock-in / My Shifts | ported, UI-matched, tested | Original highlighted hero/map/rows/detail/CTAs; current or nearest upcoming, three rows including highlighted. Both real attendance controls disabled; unavailable/denied/retry and separate visual demo-active state. |
| Staff Dashboard | ported, UI-matched, tested | All source sections: profile, shift summary, both assigned houses, three scoped clients, four shifts, selectable coworkers and published notices. |
| Shared Staff layout | ported, UI-matched, tested | Source-derived sidebar, mobile header/bottom navigation/menu, container, page header/back, cards, modal, empty/loading/error presentation. URL navigation, refresh/back and deep entry. |
| Development adapter | ported, tested | One typed fictional employee/house/assignment/client/shift/notice model and read interface; shared snapshot. Tests cover another employee and excluded houses/clients/notices. This is not access-control enforcement. |
| House/Client routes | ported placeholder, tested | Cards open `/houses/[id]` and `/clients/[id]`; unassigned client returns not-found. Actual approved detail/NOK screens remain original for Phase 1B. |
| Other Staff routes | original | Houses listing, Roster, Search, Notifications, Profile, Leave and Settings have functional navigation to labelled placeholders. No business workflows ported. |
| Admin CMS | prior ported shell, tested | Separate desktop-only presentation retained; width-gate smoke checks and build pass. No Admin page implementation changed in Phase 1A. |
| Styles/assets | original, tested | Three source CSS copies byte-identical. Remote fonts now load correctly, source image URLs retained. Screenshot fixtures replace images/tiles only during comparison. |
| Preview boundaries | ported, tested | Development opt-in required on server layouts and pages. Production 404/content checks cover seven preview/detail URLs even with flag enabled. No fake business endpoints. |
| Auth.js / permissions | blocked | NOT IMPLEMENTED. Mock session marker is not trusted identity. No real role/organisation/house enforcement. |
| Prisma / Neon / persistent records | blocked | NOT IMPLEMENTED. No schema/migrations, database credentials or services added. |
| GPS / attendance | blocked | NOT IMPLEMENTED. No device location request, radius/accuracy rule, persisted clock-in/out or success claim. Clock-out policy pending organisational sign-off. |
| Files / Blob / other care workflows | original, blocked | NOT IMPLEMENTED in active migrated screens. Original prototypes preserved for future migration. |
| Production deployment | blocked | No Vercel deployment or privacy/security/operational acceptance performed. |

No feature is `backend-connected`. `UI-matched` above means close source-rendering parity with the safety differences recorded in [UI migration notes](../ui-migration-notes.md), not a pixel-exact certification.

## Final verification

| Command / inspection | Result |
| --- | --- |
| `pnpm lint` | PASS, zero warnings; no rule disabled to accommodate the migration |
| `pnpm typecheck` | PASS, strict TypeScript and generated route types |
| `pnpm format:check` | PASS, active source/config/tests/scripts |
| `pnpm test` | PASS, 10 tests across preview/time and Staff adapter/selection/visibility/URL cases |
| `pnpm test:e2e` | PASS, 30 tests: 6 cases × 375, 390, 768, 1280, 1440px Chromium viewports |
| `pnpm build` | PASS, production webpack build including Admin and new detail placeholders |
| `pnpm test:production` | PASS, seven preview/detail paths refuse production requests and contain no fixture identities, even with preview flag set |
| Source integrity | PASS, archive extraction and all three original CSS copies unchanged |
| Visual comparison | Inspected five paired comparison boards plus upper/lower captures. Original and migrated typography metrics agree; no unintended document horizontal overflow. |

Tests cover development form → shifts → dashboard without attendance; current/nearest shift selection and three-row limit; multi-house and scoped client visibility; dashboard detail/team navigation; coworker selection; GPS unavailable/denied/retry with disabled attendance; demo-only active appearance; modal Escape; reveal/validation/recovery; desktop/mobile navigation; Admin width gate; refresh/back; source-rendering screenshots. Implemented screen flows report no pageerror events in the browser cases that collect them. All five-width captures and metadata are in `docs/ui-comparisons/`.

The comparison runner uses original JSX/CSS with the same fictional snapshot and frozen time. External photos/map tiles are deterministic substitutes in tests, not in the app. Captures are reviewed source comparisons, not an automated pixel-diff threshold or Figma screenshot acceptance.

## Remaining limitations

- Production authentication, password delivery, real attendance/location policy, persistence and file handling remain unimplemented. No real personal/health data has been introduced.
- The browser UI marker stores no entered credentials and grants no access. Direct development preview entry remains possible by design; only server development gating exists today.
- The extra development/safety text changes vertical positions and some wrapping; normal Clock In/Out stay disabled. Static demonstration-house map is not verified location or continuous tracking.
- Existing remote fonts/photos/tiles need availability/licence/privacy review. No font binaries were copied. No physical-device/Safari/Firefox, exhaustive accessibility or independent design acceptance was performed.
- Host verification used Node 25.9.0/pnpm 10.15.1; Node 22 LTS CI verification is outstanding. Existing ESLint 9 deprecation and webpack-vs-sandboxed-Turbopack limitations remain as documented in Phase 0.
- No new dependencies, schema, API, deployment or remaining feature-module implementation was added. At Git publication, inherited `.next` build artifacts were removed from the index and ignored; local copies were retained. The local `reference/` archive is also ignored and excluded from the commit.

No blocker remains for reviewing Phase 1A. Next: **Phase 1B Houses and Client/NOK UI**, reusing the same development adapter and URL patterns. Do not automatically start backend integration.

## Git publication

`reference/` is local-only and omitted from Git. Functional tests and migrated-screen captures run on fresh clones; original-export comparisons additionally run when local reference sources exist. `CAREMETRICS_SKIP_REFERENCE=true pnpm test:e2e` verifies this path without moving or deleting the local archive.
