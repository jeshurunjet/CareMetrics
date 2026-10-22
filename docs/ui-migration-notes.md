# Phase 1A — Staff UI migration

## Scope and source

Implemented `/login`, `/shift-check` and `/dashboard`, plus shared staff layout/navigation and House/Client detail placeholders. Original export under `reference/figma-export` and Phase 0 references remain intact. Admin content is outside this phase.

| Original source | Migrated implementation | Treatment |
| --- | --- | --- |
| `views/LoginView.tsx` | `src/modules/auth/ui/LoginView.tsx` | Original branding, inline styles, fields, password reveal, recovery panel and loading presentation reused. Fake password/OTP branches and false email success removed. |
| `staff/pages/ClockIn.tsx` | `src/modules/staff/ui/ClockIn.tsx` | Original header, highlighted hero, facts, status, map frame, upcoming rows, detail modal, desktop/mobile dashboard CTAs reused. Real attendance controls disabled. |
| `staff/pages/Home.tsx` | `src/modules/staff/ui/Dashboard.tsx` | Full original profile summary, current/next shift, My Houses, My Clients, collapsible My Schedule, house-selectable coworkers and Notifications markup reused. |
| `staff/StaffApp.tsx` | `src/components/layout/StaffShell.tsx`, `StaffSidebar.tsx`, `StaffMobileHeader.tsx`, `StaffMobileNavigation.tsx`, `StaffPageContainer.tsx`, `staff-navigation.ts` | Original chrome extracted into reusable components; browser URLs replace the prototype navigation stack. Menu focus trap/Escape and scroll reset added. |
| `staff/ui.tsx` | `src/modules/staff/ui/*` | Safe buttons/cards/avatars/status/header/section titles/empty/skeleton/spinner/banner reused. House, Client, Notification and Shift cards extracted without restyling. Modal adds focus containment and restoration. Store/form mutations not imported. |
| `staff/ShiftMap.tsx` | `HouseMap.tsx`, `PreviewMap.tsx` | Original Leaflet house marker, zoom and palette; Next client-only dynamic mounting, attribution and tile failure message added. Device marker and simulated verification removed. |
| `index.css`, `staff/staff.css`, `admin/admin.css` | Existing active copies | Byte-identical to the export. Only a separately scoped `.cm-app .cm-map-failure` overlay was added in bootstrap.css. |

## Data and development session

`src/modules/staff/data/types.ts` defines Employee, House, HouseAssignment, Client, Shift, Notice and StaffSnapshot with a `StaffReadService` interface. `development-mock-adapter.ts` is the single fictional read adapter. The server layout invokes it only after the development preview gate; the client provider receives one consistent snapshot for navigation and screens. No fake business API was introduced.

The fictional employee Jamie has two house assignments and sees three clients. Each client belongs to one house; shifts reference an employee and house. Related employees, shifts, clients and published notices are filtered to those assignments; a second-employee unit case and an unassigned-client route check exercise filtering. These are mock visibility rules, not security guarantees.

Fixture timestamps are relative to a captured server `now`, so a current shift and three upcoming rows remain reviewable. Tests set `CAREMETRICS_DEMO_NOW=2026-10-22T01:00:00.000Z`. Current means the scheduled start/end interval; it does not imply attendance eligibility. No pre-shift window, accuracy threshold or radius has been invented. All display dates use Pacific/Auckland. Clock-out location policy remains explicitly undecided.

Development sign-in accepts any syntactically valid fictional email and non-empty password, shows the exported loading state and opens `/shift-check`. No entered value is persisted or sent. Session storage contains only a fixed `fictional-staff-preview` UI marker; sign out clears it. This marker grants no server access. Production refuses the preview on layouts and every page, even with its flag set. Auth.js, invitations, reset delivery and real 2FA remain unimplemented.

## Visual comparison and deliberate differences

The test-only `scripts/ui-reference-server.mjs` copies the original export into ignored `.ui-reference/`, substitutes the same fictional snapshot and renders its original LoginView/StaffApp through the Vite runtime already supplied by Vitest. It is never imported into Next or deployed. Original JSX/CSS are otherwise unchanged. Browser time is fixed for comparison. This substitutes a reproducible source rendering for unavailable Figma screenshots; it is not a claim of Figma acceptance.

Five-width original/migrated screenshots, upper/lower content captures and computed typography metadata are retained under [ui-comparisons](ui-comparisons/). Side-by-side boards:

- [375px](ui-comparisons/comparison-375.png)
- [390px](ui-comparisons/comparison-390.png)
- [768px](ui-comparisons/comparison-768.png)
- [1280px](ui-comparisons/comparison-1280.png)
- [1440px](ui-comparisons/comparison-1440.png)

Inspection preserves the original teal/orange palette, typography, corner radii, shadows, responsive breakpoints, desktop column layout and mobile scrollable house strip. Typography inspection caught Next dropping the remote Google CSS import: the root now loads the **same** remote stylesheet using React's supported [preinit stylesheet API](https://react.dev/reference/react-dom/preinit). No font binaries were copied. Original and migrated heading/font metrics now match (for example 28px/weight 400 heading and 240px/16px-radius mobile house cards).

Intentional differences, rather than a pixel-exact claim:

- The small development warning above staff content shifts it downward. The login demo-credential paragraph is replaced by honest mock-session guidance and the existing Admin preview entry; the taller panel changes its vertical centring slightly.
- Location text expressly says preview/unimplemented; no success state claims verification. Normal Clock In/Out remain disabled. A separate Demo active attendance toggle changes only the local appearance, labels itself demo and never records attendance.
- Retry returns to unavailable. Permission-denied preview and management-contact guidance are shown without requesting permission or inventing contact numbers. Extra safety copy slightly increases the hero's height.
- The house-only map retains source geometry while removing the invented device location and adding required provider attribution. Missing tiles show a clear failure message. The map is not continuous tracking.
- Shift rows add the assigning manager and explicit date; all other original row styling is retained. Status says “Current · preview” rather than claiming readiness to clock in.
- Image elements use Next Image with original remote URLs and unoptimised mode to preserve source sizing; browser screenshots replace remote Unsplash photos and map tiles with deterministic placeholders **in tests only**, equally for original and migrated renders. Therefore the captures validate layout, not third-party image/tile content or availability.
- The original mobile sticky dashboard CTA intentionally floats above content and bottom navigation. It remains scroll-accessible in the same pattern. No unintended document-level horizontal overflow was observed; the horizontal house strip is intentional.

Known verification limits: Chromium viewport emulation, not physical devices or Safari/Firefox; no independent designer sign-off, exhaustive accessibility audit or all future detail screens. External fonts/photos/tiles still require availability/licence/privacy review. Font network access is needed for full intended typography; normal system fallbacks remain available.

## Navigation and checks

The form → My Shifts → Dashboard path works without clock-in. Browser back/refresh/deep entry work. House/client cards lead to scoped detail placeholders with Back; Team Schedule retains `?tab=team`; notice links retain `?item=…`. Sidebar, mobile header, bottom navigation and menu connect to Houses, Roster, Search, Notifications, Profile, Leave and Settings placeholders. Admin retains its separate desktop gate and shell.

Unit coverage includes highlighted current/nearest shift, three-row limit, multiple-house assignments, client/notice filtering, unknown employee handling, URL construction, preview isolation and Auckland daylight saving. Browser coverage includes loading/validation, password reveal, safe recovery, assignments/coworkers, detail routes, denied/unavailable GPS, disabled attendance, modal Escape, navigation, Admin width gate and original/migrated screenshots at all five requested widths. See implementation status for final command results.

## Changed files

- `src/modules/staff/data/*`, `src/modules/staff/navigation.tsx`: typed adapter, selectors, provider and URL mapping.
- `src/modules/staff/ui/*`: migrated screens and reusable source-derived presentation components.
- `src/components/layout/Staff*.tsx`, `staff-navigation.ts`: shared chrome and page container.
- `src/modules/auth/ui/LoginView.tsx`, `LoginPreview.tsx`, `mock-session.ts`: honest development login/recovery.
- `src/app/(staff)/{layout,loading,error}.tsx`, `dashboard/page.tsx`, `shift-check/page.tsx`, `houses/[id]/page.tsx`, `clients/[id]/page.tsx`: composition, failure/loading and destination routes.
- `src/app/layout.tsx`, `src/lib/time.ts`, `src/styles/bootstrap.css`: original font loading, explicit NZ dates and map failure state.
- `tests/unit/staff-adapter.test.ts`, `tests/e2e/bootstrap.spec.ts`, `playwright.config.ts`, `scripts/{ui-reference-server,verify-production}.mjs`, lint artifact ignore and docs.
- Removed the unreferenced Phase 0 `modules/workforce/preview-shifts.ts`; all screens now use the single adapter. No original reference file was removed.

## Next phase

Phase 1B: migrate the approved Houses and Client/NOK detail interfaces using this same adapter and URL navigation. Then roster/remaining Staff and Admin UI in bounded phases. Do not begin database/authentication integration or claim production security from this work.
