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

## Phase 1A checkpoint recommendation (completed below)

Phase 1B: migrate the approved Houses and Client/NOK detail interfaces using this same adapter and URL navigation. Then roster/remaining Staff and Admin UI in bounded phases. Do not begin database/authentication integration or claim production security from this work.

## Phase 1B — Houses, Clients, Contacts and Search

Completed Assigned Houses, House Profile overview, Client Profile overview, read-only Contacts/NOK and Search. Original sources are `staff/pages/Houses.tsx`, the profile/overview portion of `Client.tsx`, Search in `Other.tsx`, and Tabs/SearchInput in `staff/ui.tsx`. The new screens reuse their JSX structure, class names and approved CSS plus Phase 1A's Avatar, Card, Btn, Modal, Empty, icons, navigation provider, page container and Staff shell. The three source CSS files remain byte-identical; scoped accessibility/photo-fallback additions live in `bootstrap.css`. Admin, Login, My Shifts and Dashboard screen implementations were not changed.

### Data and navigation

The existing fictional adapter now includes optional house overview/email, client preferred name, date of birth, general summary and typed contact records with primary/emergency flags and permitted notes. No second store exists. The demonstration employee retains two assignments, three authorised clients and their shifts/notices; a third house and its client remain excluded. Examples cover multiple contacts, no contacts and a contact missing phone/email. Telephone numbers and `.invalid` email addresses are fictional.

`queries.ts` exposes typed house/client/contact/by-house/search operations and rechecks assignment scope on every lookup. Search returns small result DTOs without contact details, DOB, summary, alerts or NHI, matching full/preferred client names or house name/address. A matching house includes its scoped clients. The client bundle imports these pure queries and the scoped snapshot, not the seed builder. Tests inspect broader snapshots and alternative employees; unassigned seed names were absent from built client chunks. These development rules are not a substitute for future authenticated server permissions.

`record-loader.ts` is server-only, gates preview and validates the selected ID before rendering. Unknown/unassigned records and invalid tabs return generic HTTP 404. The shared loading boundary previously caused rejected IDs to stream HTTP 200; loading skeletons now belong to listing/dashboard/shifts/search routes while detail validation completes before streaming. `/houses/(listing)` is an internal route group with no public URL change. Local Next.js guides for async route parameters, native history and not-found streaming were consulted.

The canonical routes support house switching, Dashboard → House → Client, Dashboard → Client, Search → House/Client, Client → House, breadcrumbs and query tabs. Back/refresh retain the selected record and query. The contacts shortcut includes an overview query/hash and focuses/scrolls to the selected client's contacts; the shell respects hash targets. Tabs support keyboard arrow/Home/End navigation and clear focus. Search has a visible label, clear control and result announcement. Photo failure retains usable source-styled fallback presentation.

### Intentional visual and functional differences

- Existing development warning remains and shifts content vertically. Source fonts, palette, card geometry, responsive breakpoints, sidebar and mobile navigation are retained.
- Contacts retain the original highlighted primary card and secondary list, adding required primary/emergency text, read-only guidance, notes and larger identifiable telephone/email targets. These additions increase the card height. Missing values are stated rather than invented.
- A small contacts shortcut makes NOK easy to reach on mobile. Client house is a real link. Profile editing is disabled; Admin editing is future work.
- Search replaces the prototype's NOK name/phone subtitle with preferred name. Sensitive contact details never appear in search result DTOs.
- House overview includes its fictional description; missing telephone is explicit. The house concerns tab says “Notifications & concerns”.
- Diary, care plan, charting, gallery/files and house concerns destinations are labelled Phase 1C placeholders. Their original tabs/shortcuts work, but do not create records. Counts do not imply loaded care records.
- Photo-update and concern controls open explicit preview-only dialogs. There is no file chooser, upload, persistence or success claim. Client fixtures without photos use the source initials Avatar fallback.

### Visual evidence and validation

[Phase 1B screenshots](ui-comparisons/phase-1b/) contain 50 original/migrated captures for Houses, House Profile, Client Profile, Contacts and Search across 375, 390, 768, 1280 and 1440px. Ten paired boards were inspected: `comparison-[width]-profiles.png` and `comparison-[width]-contacts-search.png`. Original appears left, migrated right. Typography, card layout, desktop columns, mobile contact wrapping, tabs and navigation retain close source parity with the additions above. No unintended document-level horizontal overflow was detected. Source mobile tab scrolling remains intentional.

The source renderer uses the same fictional snapshot/frozen time. Both sides receive deterministic photo/map substitutes only in browser tests. Development-tool overlays are hidden during Phase 1B capture. This validates rendered source layout, not remote asset availability, exact pixels, clinical content or independent Figma/design approval. Physical devices, Safari/Firefox and exhaustive accessibility remain unverified.

All checks passed: lint (zero warnings), strict typecheck, formatting, 22 unit tests, 75 Chromium browser cases (15 × five widths), production build and 12 production-isolation URLs with the preview flag enabled. Prior Phase 1A cases and Admin desktop gating remain in the browser suite. Tests cover current-house highlighting, multiple assignments, relationships/NOK, missing values, scoped search, unknown/unassigned IDs, query tabs, hash navigation, preview actions, image failures, Back/refresh and screenshot capture.

Generated type directories from other dev/test output trees were excluded from TypeScript input after stale generated route validators referenced a moved source path. Canonical `.next-build` route generation and strict source/test checks remain enabled; generated cache was refreshed. No source rule or access restriction was weakened.

### Phase 1B changed files and next step

- `src/modules/staff/data/{types,development-mock-adapter,queries,record-loader,sections}.ts`: shared fictional records, scoped queries, route validation and tab definitions.
- `src/modules/staff/ui/{HouseList,HouseProfile,ClientProfile,ClientContacts,Search,Tabs,SearchInput,SourcePhoto,FeaturePlaceholder,PreviewActionDialog,PageLoading}.tsx`: source-derived screens and reusable UI. Removed the now-unreferenced `StaffPlaceholder.tsx` after replacing both detail placeholders.
- `src/app/(staff)/houses`, `clients/[id]/page.tsx`, `search`, `not-found.tsx`, route-local loading files: composition and explicit invalid/unavailable states. Shared global loading moved to route-local boundaries.
- `src/components/layout/StaffShell.tsx`, `src/lib/time.ts`, `src/styles/bootstrap.css`: query/hash scrolling, NZ calendar-date/age helpers and scoped accessibility/fallback styles.
- `tests/unit/staff-records.test.ts`, `tests/e2e/houses-clients.spec.ts`, one exact-heading selector in the prior browser test, reference/production check scripts, `tsconfig.json`, README and phase docs/evidence.

No backend integration or Phase 1C feature was started. Recommended next: migrate original House/Client Diary UI first, then care-plan/charting/gallery UI in bounded Phase 1C slices, retaining the shared adapter and documented route structure. Authentication, organisation/role enforcement, persistent records, secure file storage and operational approval remain later work. No blocker remains for Phase 1B review.

## Phase 1C.1 — Client and House Diary

Git checkpoint before changes: `0398957` on `main`, containing completed Phase 1A/1B and already pushed at the user's request. The only pre-existing untracked files were duplicate `… 2.png` Phase 1A screenshots; these were left untouched. No Phase 1C.1 commit or push is part of this task.

### Source reused and shared components

Read the original `staff/pages/Shared.tsx` DiaryList (six records per page), `Forms.tsx` NewDiary/ContextBar, and `staff/ui.tsx` HistoryItem, Pagination, Select, FormField, OffShiftField and CorrectionDialog. Their history card markup, toolbar, form-page/context, off-shift block, action row, metadata and correction wording supply the migrated presentation. The active `DiaryHistoryList`, `DiaryEntryCard`, `DiaryEntryDetails`, `DiaryEntryForm`, `CorrectionRequestForm` and record metadata/status helpers share explicit `{scope,targetId}` context. Client and house histories never merge. Existing Avatar, Banner, Btn, Card, Empty, Icon, Modal, PageHeader, SearchInput, Staff shell and navigation remain shared. New source-derived FormField, Select and Pagination are reusable.

All three source CSS copies and original reference files remain untouched. Scoped additions in `bootstrap.css` wrap long content and keep focus/action controls visible. Admin CMS is unchanged. Login, Dashboard and My Shifts retain their existing screens; the only ClockIn change promotes its explicitly labelled demo attendance appearance into the existing shared provider so diary forms can read the same demo state.

### Adapter and validation

The existing typed snapshot now contains DiaryCategory, DiaryEntry, separate CorrectionRequest arrays and optional demo attendance. `diary-seed.ts` supplies fictional categories and multiple-page histories, an own draft, another author's excluded draft, distinct house/client records and inaccessible subjects. The seed remains server-side; UI imports pure operations from `diary-adapter.ts`. `developmentMockAdapter` exposes those operations alongside the preceding read interface. The existing StaffDataProvider owns the mutable development snapshot; there is no competing store, localStorage diary, database, API, browser upload or external write.

The adapter checks assignment scope on reads/creates, subject and author on drafts, and author/submitted status/no pending request on corrections. Querying applies case-insensitive title/content/author search, category, covered-date range, newest submission/creation first and six-record pagination. Drafts require a title; submissions also require an active category of the correct scope, at least ten non-whitespace content characters, a valid non-future covered time and an off-shift reason when demo attendance is absent/ineligible. Explicitly selected categories come from the adapter. Creation time is retained while editing a draft; covered/created/submitted times remain distinct.

Covered-time fields explicitly use Pacific/Auckland, independent of device timezone. Missing and repeated daylight-saving wall times are rejected instead of silently shifted. Event timestamps use UTC ISO strings; displayed metadata uses the existing NZ time helpers. A scheduled shift alone never counts as active attendance. The existing demo toggle can allow an on-shift form without a required reason, but never claims verified location/real attendance. Reasons entered in the demo are retained.

Submitted entries expose no edit/delete operation. Correction submission adds a separate pending request, displays reason/proposed content/status, and leaves the original entry unchanged. No staff approve/reject operation or button exists. The type/display supports a corrected status, but management approval, revised record versions and audit integrity are future backend/Admin work; this phase does not simulate approval.

### Working UI and navigation

Client/House profile Diary tabs now show history. New entries use the planned `/clients/[id]/diary/new` and `/houses/[id]/diary/new` routes. Existing `item` queries select details; `action=correction` selects the full-page correction form; `draft` selects the author's editable draft. Breadcrumbs, history return, submission return, Back and seeded deep links are covered. Unknown/unassigned subjects return server HTTP 404; invalid/wrong-subject/private draft IDs show a generic unavailable view inside the authorised profile without exposing that record. This last state is HTTP 200, not an asserted server authorisation response.

Drafts, submissions, demo attendance and correction requests survive navigation in the Staff layout's current React session. They reset on a page reload or leaving/remounting the layout. New ID deep links then show unavailable; seeded IDs still resolve. A visible diary banner explains that nothing is saved to a server. Success is represented only by the development record/status, never by a claim of persisted care documentation.

Cancel uses the existing discard-confirmation modal. Navigation/Back use a native confirmation while dirty, with a same-URL history guard so declining Back keeps the editor mounted; completion replaces the guard location. Reload/close uses before-unload where the browser supports it. Browser-controlled prompts are not branded screens. Keyboard labels, required indicators, errors/descriptions, expand state, current page and focus styling are explicit. Modal focus handling is reused from Phase 1A.

### Intentional visual differences and evidence

- Existing development warning plus a diary-specific session-reset banner add vertical height. Author/read-only context and source cards/forms retain their original styling.
- Required Submitted/Draft/off-shift/pending-review badges and a separate Created timestamp extend the source metadata. A View details link supplements the original inline expandable history.
- Original details exist only as expanded cards; the standalone details view is a documented extension using source Card/metadata styles. Original correction is a modal with reason/proposal but no original body. The migration uses a full-page correction form with original content to support the confirmed workflow on mobile. These are source-derived extensions, not claims of identical reference states.
- Form breadcrumbs and explicit Pacific/Auckland help are additions. New forms identify Off-Shift Entry explicitly. Category fixtures are fictional configuration rather than real clinical rules.
- The original 375px form action row slightly exceeds available width. A narrowly scoped mobile padding/grid adjustment keeps all three migrated buttons inside the viewport. Native controls retain the original style; proper medium/small button classes are applied to Next links.

The test-only original renderer adapts the same scoped fictional entries/categories into the original store shape. Original reference files on disk remain unchanged. Matching screenshots use frozen time and deterministic photo substitutes; no font binaries are copied. Captures cover Client history/create/details/correction and House history/create at 375, 390, 768, 1280 and 1440px. The expanded source card is the reference for details; the source modal is the reference for the full-page correction extension. Screenshots are stored under `docs/ui-comparisons/phase-1c1/`. They establish reviewed layout evidence, not pixel-diff acceptance, independent designer approval or physical-device/browser certification.

### Changed files

- `src/modules/staff/data/{types,context,development-mock-adapter,diary-adapter,diary-seed}`: typed relationships, scoped pure queries/transitions, one session snapshot and fictional fixtures.
- `src/modules/staff/diary/*`: shared history/card/details/form/correction/metadata/status/navigation and unsaved-change handling.
- `src/modules/staff/ui/{FormField,Select,Pagination}`; ClientProfile/HouseProfile Diary tab composition; ClockIn demo-state connection; scoped bootstrap CSS; NZ wall-time conversion in `src/lib/time.ts`.
- Both planned `src/app/(staff)/{clients,houses}/[id]/diary/new/page.tsx` routes validate preview and subject before rendering.
- `tests/unit/diary.test.ts`, `tests/e2e/diary.spec.ts`, updated Phase 1B tab expectations, reference/production scripts, README, route/status/history docs, generated-type cache exclusion in `tsconfig.json`, and screenshots. Next regenerates `next-env.d.ts`; no dependency changes.

No Care Plan, Charting, Gallery, Admin editing, authentication, GPS, persistent services or production file handling was implemented. The next task after diary review is a bounded Care Plan/Assessments UI migration, reusing these documentation patterns and keeping the later configurable template/version/correction model in view.

### Phase 1C.1 final verification

Lint (zero warnings), strict typecheck, formatting and all 33 unit tests passed. The final full `pnpm test:e2e` run passed **120 cases** (24 × five widths), including all 75 prior regression cases; a preceding original-export breadcrumb animation instability was corrected by using its existing Houses navigation for capture. The final production build passed; all 20 production preview-isolation paths returned 404 with preview explicitly enabled. Unassigned fixture names/record IDs were absent from production client chunks. All 51 extracted reference files and three active CSS copies remained byte-identical. No Admin source file changed.

Captured **100 raw images** and inspected **15 paired boards** at the five requested widths: `comparison-[width]-history.png`, `comparison-[width]-forms.png`, and `comparison-[width]-details.png`. Focused list and field captures supplement context/header views. Cards, typography, filters and field styling retain close source parity; required metadata/banners and full-page extensions account for visible differences. The mobile action bounds are checked explicitly, in addition to document overflow, and all five capture cases reported no pageerror events. No exact-pixel claim is made.

Phase 1C.1 has no implementation blocker for review. Remaining limitations are session-only data and the unimplemented backend, identity, management review/version/audit and secure files. No new phase was started and no commit/push was performed.

Final type verification encountered sync-style generated duplicates (`routes.d 2.ts`, `cache-life.d 2.ts`) under `.next-build/types`, causing conflicting declarations after earlier successful checks. TypeScript now excludes only space-containing generated `.next-build` TypeScript filenames; canonical generated routes and all source/tests remain checked. No user source or duplicate screenshot was deleted. Typecheck and formatting passed again with this narrow cache exclusion.
