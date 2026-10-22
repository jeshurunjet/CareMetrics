# Implementation status — Phase 0, 22 October 2026

This checkpoint is a runnable **UI-only application foundation**. It is not the completed application or a production deployment. Read the source audit and route map alongside this matrix.

Status vocabulary: `original` (retained export), `ported` (adapted source), `UI-matched` (verified visual parity), `backend-connected` (authorised server database reads/writes), `tested` (relevant passing checks), `blocked` (external decision/dependency required). A tested preview does not make its future business feature tested.

| Area | Status | Evidence / remaining work |
| --- | --- | --- |
| Source and legacy audit | original, tested | All 51 files inventoried; static/lazy import graph has no missing imports. Archive extraction verified byte-for-byte. Only LoginView is active among latest-export views; 17 other views and three old map components are legacy. |
| Original reference preservation | original, tested | Zip and complete extraction retained; previous workspace source/config copied separately before replacement. |
| Next.js App Router / TypeScript | ported, tested | Next 16.3.8, React/DOM 19.3.1, strict TypeScript; build and route type generation pass. No Vite runtime used. |
| Styling/assets | ported, tested | Global/staff/admin CSS byte-identical to export; fonts remain remote CSS, no font binaries copied. Icons extracted without demo store. Additional router-link CSS is separate. |
| Login presentation | ported, tested | Approved markup retained with truthful unavailable-service errors and local preview buttons. Password/OTP demo branches and fake recovery success absent from active implementation. |
| Staff application shell | ported, tested | Original responsive chrome adapted to real URLs; sidebar/mobile menu and content frame retained. No full content migration or UI-matched claim. |
| My Shifts bootstrap | ported, tested | Three deterministic fictional read-only rows, highlighted example, NZ timezone formatting; continue to dashboard without attendance. Fixed examples are not eligible/current shift calculations. |
| Dashboard and other staff screens | original | URL placeholders only. Source content, forms, detail tabs and interactions await Phase 1. |
| Admin shell / desktop gate | ported, tested | Approved classes/layout adapted; desktop and mobile gate smoke checks. Search disabled; no account/role switching or review drawers implemented. |
| Admin management screens | original | Main navigation URLs have explicit placeholders. Detail/new/edit routes, drawers and forms remain reference only. |
| Production preview refusal | ported, tested | Server layouts AND every preview page guard execution. HTTP checks return 404 for five representative routes with flag forcibly enabled, and no fictional page content. This is not user authentication. |
| Auth.js / invitations / recovery / real 2FA | blocked | NOT IMPLEMENTED. Provider and account lifecycle decisions needed; no trusted session or role/organisation/house policy exists. |
| Shared domain / Prisma / Neon | original, blocked | Store types audited as design evidence; no competing domain schema introduced. No database/client/schema/migration/seed service configured. Relational model and constraints need Phase 2/3 work. |
| Attendance / GPS | original, blocked | NOT IMPLEMENTED in active shell; clock-in disabled. No invented locations/radius/window. Policy decisions, location evidence and server transactions outstanding. |
| Diary/templates/records/corrections | original | Reference-only prototype local mutations. Published immutability, correction history and concurrency not implemented on server. |
| Files / Vercel Blob | original, blocked | NOT IMPLEMENTED. No active upload/download. Private storage configuration and authorised operations need implementation and verification. |
| Notices/concerns/leave/audit/reports | original | No active writes/exports/reviews. All business workflows remain reference prototypes. |
| Vercel deployment | blocked | Target only; no deploy/provisioning performed. Authentication, privacy, external asset policy and operational reviews remain prerequisites. |

No feature is `backend-connected` or `UI-matched` at this checkpoint.

## Verification results

Executed on host Node 25.9.0 and pnpm 10.15.1. Node 22 LTS is the intended toolchain and still needs a clean CI verification run.

| Check | Final result |
| --- | --- |
| `pnpm lint` | PASS, zero warnings (active code/config/scripts; reference and generated output excluded) |
| `pnpm typecheck` | PASS, route types generated before strict tsc |
| `pnpm test` | PASS, 5 tests: development opt-in, production/test refusal, Auckland summer/winter time |
| `pnpm build` | PASS, optimised webpack build and all 23 app/system routes emitted |
| `pnpm format:check` | PASS, active TypeScript/JS configuration and scripts |
| `pnpm test:e2e` | PASS, 6 Chromium tests at iPhone 13 emulation (390 CSS px) and desktop 1440 px |
| `pnpm test:production` | PASS, production login has no preview button/prototype credential; five preview URLs return 404 with flag enabled and no fixture content |
| Archive / CSS integrity | PASS, all extracted files and three copied stylesheets match archive bytes |
| Visual shell inspection | Inspected mobile My Shifts and 1440 px Admin screenshots; readable responsive chrome and explicit placeholders. No comparison screenshots supplied, so no pixel-parity approval. |

Browser checks cover staff preview → My Shifts (3 rows) → dashboard without clock-in, disabled attendance, refresh and browser back, admin width gate, and honest login/recovery errors. Staff flow captures no pageerror events. These tests do not cover business workflows, screen-reader/keyboard accessibility, Safari/Firefox, real devices or the unported UI. 1280 px visual comparison is deferred to Phase 1.

Initial failures were resolved: invalid inherited TypeScript deprecation option; stale generated route types from earlier migration; copied JSX apostrophes/lint; old formatter CLI syntax; test selector collision with Next route announcer. The first production negative check found child content in a 404 response behind a layout-only gate; adding page-level guards fixed the response content and the check passes.

The default Turbopack build failed under the sandbox because PostCSS worker IPC could not bind a port. The build script uses supported `next build --webpack`, which passes within the sandbox. Browser/server verification required permission to bind localhost; Chromium was installed and those checks subsequently passed. No automatic approval rejection remains.

## Limitations and follow-up decisions

- No blocker remains for reviewing this bootstrap locally. Run `cp .env.example .env.local` then `pnpm dev`, or set CAREMETRICS_UI_PREVIEW=true for that command. Local review server uses port 8443.
- ESLint 9.39.5 is deprecated by the registry; the installed Next lint plugins declare peer support through 9, not 10. Keep the compatible configuration for this checkpoint and revisit before deployment. pnpm also reported an ignored unrs-resolver install script; lint succeeds without enabling it.
- Root AGENTS.md gained the framework-generated Next guidance when `next dev` ran; original instructions remain preserved under reference. Inherited tracked/dirty `.next` output is left untouched; source snapshots exclude generated dependencies/output. Generated output should be untracked in a separate repository cleanup.
- Remote Google Fonts, Unsplash photos, CARTO/OSM tiles and old unpkg marker URLs require availability/licence/privacy review. Active shell uses fonts but no photos/maps/location requests.
- No real personal/health data, credentials, production services or deployment were added. Blank future service names in `.env.example` do not represent connected services.

## Recommended next implementation step

Phase 1: port the approved Staff ClockIn and Home screen content, then Houses/Client/NOK and navigation, reusing existing JSX/CSS. Use one isolated development-only mock adapter and real URL/query state. Keep attendance visibly simulated or disabled; fix SSR map boundaries and explicit NZ time formatting. Compare the supplied design at mobile, 1280 and 1440 widths; verify interactions/accessibility before marking UI-matched. Then migrate Admin against the same adapter. Introduce Auth.js and server-side permissions in Phase 2 before exposing any real records; implement the approved shared Prisma/Neon model in verified vertical slices thereafter.
