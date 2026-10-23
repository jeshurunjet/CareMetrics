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

## Phase 1C.2 — Care Plan / Assessments

Checkpoint: `9cecc8b` on `main`, containing completed Phase 1C.1. Before changes, all existing checks passed: lint, strict typecheck, formatting, 33 unit tests, 120 browser cases, build and 20 production-isolation URLs. Only the pre-existing duplicate `… 2.png` screenshots were untracked; they were left untouched. This phase has not been committed or pushed.

### Scope and source reuse

Migrated the original Client.tsx CategoryList, SubHeader, TemplateHistory and RecordValues patterns; Forms.tsx NewRecord/ContextBar; and ui.tsx FormRenderer, field controls, ValueView, HistoryItem, off-shift and correction presentation. The existing Staff shell, Client profile/tabs, Avatar, Banner, Card, Btn, Icon, FormField, SearchInput, Select, Pagination, Modal and diary unsaved-change handling are reused. Shared RecordMetadata/RecordStatus accept the metadata shape used by both record types. The correction form and pure request helpers are shared between Diary and Assessments, with a record-type discriminator preventing ID collisions.

Care Plan now shows only assigned published categories, their descriptions, record counts/latest dates, assignment versions and explicit View records/Add entry actions. Scoped category history supports search, covered-date ranges, newest-first order, six-record pages, expandable answers, details and own drafts. Full-page assessment forms support save/resume draft, validation, off-shift reasons, session submission feedback, immutable submitted UI and separate pending correction requests. Seeded direct URLs, Back, breadcrumbs and refresh work; newly created records reset on reload as visibly explained.

No original reference file or source CSS was edited. Admin CMS, Login, My Shifts and Dashboard screen implementations remain unchanged. No dependency or font binary was added. Only bootstrap CSS contains scoped wrapping/focus/section/action extensions.

### Configurable model and rendering policy

The shared foundation is documented in [configurable-forms.md](configurable-forms.md). `src/modules/forms` separates types, pure visibility/validation/normalisation, DynamicFormRenderer, FormFieldRenderer, ChoiceField and read-only answers. It branches on configured field types, never on assessment names. Templates contain published versions → sections → fields → stable option values. Active client assignments select the version used for new entries; every care record retains client, author and template version. Old drafts and historical answers use their own published version, not a silently upgraded configuration.

Supported controls: text, textarea, number, yes/no, dropdown, radio, multiple choice, date, time, datetime and scale. Labels, help, required state, options, bounds/steps and defaults come from the configuration. Basic validation rejects missing visible requirements, invalid options, non-finite/out-of-range numbers, invalid dates/times and ambiguous/missing NZ DST wall times. Datetime fields display Pacific/Auckland and save valid answers as UTC ISO; calendar date/time fields retain their separate semantics. Covered, created and submitted metadata remain distinct.

Section/field rules use field ID, equals/not-equals/includes and a scalar value; no template code executes. Dependencies must exist and be visible/non-empty. Missing controllers and cycles fail closed. Policy: clear hidden values immediately and exclude them again from saved drafts/submissions, along with unknown IDs and unsupported file/table values. Hidden required fields never prevent submission. Tests cover hiding/revealing answers and conditional sections.

Fictional fixtures include Skin Integrity, Medical Cares Record and Medication Receipt Record; a client with multiple assignments, one with none, scoped submitted records, own/other-author drafts, a pending correction and Skin Integrity v1 history alongside current v2. Templates/records are added to the existing typed adapter snapshot/provider, not a second store. Medication Receipt is documentation only, with no prescribing, administration, dosage calculation or clinical recommendations. Numeric ranges and scales are demonstration configuration, not clinical standards.

### Access, lifecycle and corrections

The server preview gate remains unchanged. The planned records/new route and Care Plan `sub` routes validate client assignment against the fixed fictional employee before rendering. Unknown/unassigned subjects/templates return HTTP 404. Missing, wrong-client, wrong-template, submitted-as-draft and another-author record IDs show generic unavailable content within an authorised profile (HTTP 200); session-only IDs lost on reload use the same state. The scoped snapshot filters unpublished/unassigned templates, inaccessible records and other authors' drafts before serialisation. This is a development demonstration, not production authentication or organisation/role permission enforcement.

The adapter checks scope, draft ownership, published version, visible-field validity and off-shift reason. A scheduled shift alone does not count as attendance; forms use the same explicit demo attendance state as Diary. Drafts can remain incomplete; submission records author/timestamps/version and makes the record read-only. The existing provider retains changes only during client-side navigation. No API, database, localStorage assessment store or upload service was introduced.

Corrections use the existing request array with `recordType: care | diary` (missing type remains diary-compatible). Shared helpers retain request author/reason/proposal/time/status and prevent duplicate pending requests. Assessment correction shows original structured answers; proposals identify affected fields and intended values in text. It never replaces original values or offers staff approve/reject controls. Review, corrected-version creation and durable audit remain future work.

### Intentional differences and comparison limits

- The existing development warning plus a session-reset/fictional-form banner add height. Categories add required explicit actions and the assigned version; source styling remains intact.
- Source history pins drafts first. Migrated history follows the requested newest submission/creation-first order, with six records per page. Submitted badges, submission metadata, Created time, date filtering and details links extend the source presentation.
- Original submitted details are expanded cards, and correction is a modal without original answers. Full-page details/correction extend the same card/field styles, retaining mobile usability and displaying the original structured record.
- Source sections/fields are adapted from the same fictional typed configuration for comparison, rather than using real or original seeded care content. Conditional body-area/findings/device questions, date/time fields and defaults demonstrate the requested renderer capabilities.
- Photo/file/table variants display explicitly unavailable source-styled controls. No file chooser or editable table is active. The source's Medical Cares table remains visible in its reference rendering; the migration uses clearly labelled table deferral and configured numeric observations. Repeating tables are Phase 1C.3.
- Configured defaults (pressure-area demonstration value 1 and delivery reference DEMO-) are applied to new forms; the original new-form implementation did not apply its configuration defaults.
- Radio/scale controls add roving focus and arrow/Home/End support, multi-choice exposes pressed state, and errors/help are associated with controls. Long labels wrap. The longer Submit assessment label wraps within the preserved mobile action row.

The original renderer still copies the export to ignored `.ui-reference` and adapts only fictional data. Its pure mock modules now compile into isolated ESM files. Trace inspection identified repeated reference hot reloads during captures; the test-only server now uses an isolated dependency cache, prebundled dependencies and disabled file watching/HMR for a static comparison snapshot. This does not change the source archive or application. External photos/tiles are deterministic test substitutes, fonts remain the original remote stylesheet, and captures do not certify remote assets or clinical content. Focused screenshot scrolling resets outer hidden ancestors so headers are not displaced by automation.

### Changed files and remaining boundary

- `src/modules/forms/*`: shared typed renderer, choices, read-only answers and pure form engine.
- `src/modules/staff/care/*`: fictional template/record model and seed, scoped adapter, category/history/card/details/form components and URL helpers.
- `src/modules/staff/data/{types,development-mock-adapter,record-loader,diary-adapter,correction-service}`: single snapshot extension, server preview lookup and shared correction operations.
- `src/modules/staff/documentation/RecordCorrectionForm.tsx`, diary correction wrapper/status/metadata/details: shared workflow and record-type separation.
- `src/app/(staff)/clients/[id]/page.tsx`, planned `records/new/page.tsx`, Staff navigation `sub` support, ClientProfile Care Plan count/content and bootstrap CSS.
- `tests/unit/care.test.ts`, `tests/e2e/care.spec.ts`, updated prior placeholder expectations, reference/production scripts, README, route/status/history/model docs and comparison evidence. No dependency changes.

No Charting, Admin builder, backend integration, real files/GPS, advanced clinical validation or production audit storage was started. After review, Phase 1C.3 can reuse the configurable foundation for Charting and repeating editable table UI in another bounded migration.

### Final verification and visual findings

The final implementation passes lint, strict typecheck, formatting, all 49 unit tests, all 175 browser cases (including 120 prior regression cases), the production build and all 27 production preview-isolation checks. The full browser run was repeated after the final scale-value and date/time-help display adjustments. Original source integrity checks confirm all 51 extracted files and the three active source CSS copies remain byte-identical.

Evidence contains 120 raw screenshots and 20 paired comparison boards across 375, 390, 768, 1280 and 1440px. Review covered category/history cards, all supported field types across the three examples, conditional questions/sections, draft editing, submitted answers and corrections. Typography, colours, navigation, card and input treatment follow the export. No unintended document overflow or action overlap was found in the reviewed states; automated bounds checks also pass at every width. The added metadata, warnings, defaults, unavailable controls and full-page workflows account for the documented differences above. These comparisons support fidelity with those extensions, not exact pixel parity or independent design approval.

## Phase 1C.3 — Staff Charting and repeating editable tables

### Checkpoint, scope and source

The local Phase 1C.2 checkpoint is `6a5c939` on `phase-1c2`. Before changes, lint, strict typecheck, formatting, 49 unit tests, all 175 browser cases, build and 27 production-isolation checks passed again. Work is isolated on the new local `phase-1c3` branch. `main` remains at `9cecc8b`, and `phase-1c2` remains at `6a5c939`. No changes have been reset/discarded or pushed. Existing duplicate `… 2.png` screenshots are untouched.

Source references: `staff/pages/Client.tsx` CategoryList, SubHeader, ChartView, RecordValues; `staff/pages/Forms.tsx` NewRecord, ContextBar and Bristol reference; `staff/ui.tsx` RepeatTable and ValueView; original category/table/bar/repeat CSS. Category cards, search/filter toolbars, history table, bar chart, full-page entry and stacked/grid row patterns retain those classes and presentation. All 51 extracted reference files and three active source CSS copies remain byte-identical. No dependencies, font binaries, Admin changes, backend or unrelated feature module were added.

### Architecture and workflows

One shared `CareTemplate`/version/assignment/`CareRecord` domain now serves separate Care Plan and Charting staff areas. The existing adapter/provider owns both; no second store or Charting-only form engine exists. `getAssignedCareTemplates` accepts the expected kind, defaulting to Care Plan for earlier callers. Scoped record reads/writes retain the same house/client/author/publication checks. Profile routes also validate the selected area against the template kind. Form route selection resolves the assigned template and uses the shared AssessmentForm workflow with Charting context/action labels. Shared AssessmentDetails, category cards, renderer, metadata, draft/off-shift handling, discard prompts and correction form are reused.

Fictional templates: Bowel Movement Chart (seven source text reference tiles, stool dropdown, size radio, incontinence and notes), Exercise Chart (setting/type/duration in minutes/notes and numeric bars), Equipment Register (configured repeating items). Existing clients/houses/employees are reused; c1 has three chart assignments, c2 has one, c3 has none. Fixtures include multiple history pages, a partial two-row own draft, another-author excluded draft, submitted two-row equipment, pending exercise correction, older equipment v1 with original column labels, plus an inaccessible client/record. No clinical standards, advice or medication administration were introduced.

Repeating fields contain stable table/column IDs and ordered `{id, values}` rows. Generic scalar controls support text, number, date, time, Yes/No, dropdown and radio cells; no category-name renderer branches exist. IDs survive row removal, draft save/resume and submission. Table/cell validation, configured minima/maxima, empty guidance, maximum explanation and new/nearest-row focus extend source behaviour. Hidden table values follow the existing clear/exclude policy. Submitted row tables resolve original-version columns and offer no edit/remove controls. Details retain author, covered/created/submitted times and off-shift reason. See [configurable form contracts](configurable-forms.md).

History tables are separate derived navigational projections: configured columns, scoped records, newest submission/creation-first, search, date/author filters and six-record pages. Equipment history shows row-count summaries; details show all cells. Original-version scalar formatting is used per row. Exercise bars display up to ten actual numeric submitted observations chronologically, filtered before pagination, with units, zero values, empty states and an expandable semantic data-table alternative. No fabricated missing points, clinical averages/recommendations or extra charting dependency.

Corrections continue to use the shared CareRecord discriminator `care` (for either template kind), distinct from Diary. Chart correction forms optionally select one stable original field/cell target; adapter validation preserves field/row/column references separately alongside the reason/proposed values and Pending Review. Text may describe additional changes. Original values remain unchanged, and staff have no approve/reject/edit/delete controls. Management review and corrected versions remain future work.

### Intentional visual differences

- Existing preview warning/session-reset banners add height; categories show explicit View chart/history/Add entry actions and assigned versions. Shared staff fonts, palette, cards, inputs, sidebar and mobile navigation remain.
- Source chart history pins drafts first, paginates eight rows and opens record/correction modals. Migration uses the requested newest-first/six-row pattern, explicit keyboard-accessible detail links and the established full-page details/correction pattern. Metadata/status/version and covered/created/submitted distinction extend the source.
- The original mobile chart-history layout can overflow the document; migrated tables are bounded, labelled keyboard-focusable scroll regions with visible guidance. All columns remain reachable. Table row headers preserve semantics while using readable body styling.
- Source RepeatTable uses array-index identity and labels/removal only. Migration adds stable IDs, visible row numbers, row/column input names, validation associations, focus management, required/min/max enforcement, and an explicitly disabled Add Row at maximum. Empty copy matches the assignment. Source classes/grid spacing remain.
- The export contains seven Bristol text tiles, not separate illustration assets. Those tiles are retained using generic version reference metadata; green typical-range emphasis and clinical advisory wording are omitted from the fictional configuration.
- Exercise bars retain the source CSS and short NZ numeric date ticks. The source average badge is omitted; a data-table alternative and empty state are added. Missing data is excluded rather than coerced to zero.
- Equipment repeating columns are fictional configuration supplied to both renders; the source seed had flat equipment fields. Historical v1/v2 column variation, structured correction targets and table validation are intentional extensions. The source cannot demonstrate all new lifecycle semantics.
- Legacy undefined-column `table` placeholders in Care Plan remain expressly unavailable; the new typed `repeatingTable` is implemented. Photo/file fields/cells remain unavailable, without file pickers or pretend storage.

The test-only reference harness still copies untouched source into ignored `.ui-reference`. It now adapts Charting presentation metadata, repeating column definitions/options and `{id, values}` rows to the original store's flat rows; original JSX/CSS are unchanged. Comparisons use the same fictional snapshot/frozen time and deterministic photos/tiles; fonts remain the source remote stylesheet. Source overflow is retained as evidence, not hidden by modifying reference CSS. Captures do not certify external content, exact pixels, physical devices, other browsers or independent design approval.

### Changed files

- `src/modules/forms/{types,engine,ChoiceField,DynamicFormRenderer,FormFieldRenderer,ReadOnlyFormValues}` and new `RepeatingTableField`: shared typed rows/columns, scalar reuse, validation, reference metadata, editing/read-only presentation.
- `src/modules/staff/charting/{seed,history,Charting,ChartingHistoryTable,ChartHistoryVisualisation}`: fictional configuration, numeric projection and source-derived presentation.
- Existing Care Plan adapter/types/navigation/category/form/details/shared components: expected-kind support and shared Charting workflow context.
- Staff data snapshot/loader/types/correction helper; shared RecordCorrectionForm optional validated targets; ClientProfile Charting content/counts; existing profile/new-record route validation; scoped bootstrap CSS.
- Charting unit/browser tests, prior placeholder assertion updated to check actual categories, reference/production scripts, README, route/model/status/history notes and comparison evidence.

### Boundary and next step

This is UI-only and session-only. Reload/remount resets drafts/submissions/corrections/attendance; seeded links still resolve. Production authentication, organisation/role permissions, database persistence, private files, GPS, Admin publishing, clinical validation, management review and durable audit remain unimplemented. Node 22 is not installed locally (host Node 25.9.0/pnpm 10.15.1); intended-runtime CI remains outstanding. After review, agree the next bounded Staff UI migration (for example Gallery with explicitly deferred real files); do not automatically begin Phase 1C.4, Admin, backend or deployment.

### Phase 1C.3 final verification

Final lint (zero warnings), strict typecheck, formatting, 63 unit tests, all 225 browser cases, production build and all 35 production-isolation URLs pass. The full browser run retains all 175 previous cases and adds 50 Charting cases across the five widths. Original extracted source (51 files) and three CSS copies remain byte-identical; inaccessible Charting fixture markers are absent from production client chunks. Local Charting history/equipment form smoke checks return HTTP 200. No Admin/Login/My Shifts/Dashboard screen implementation changed.

Final evidence: 90 raw screenshots and 15 paired boards across 375, 390, 768, 1280 and 1440px in [phase-1c3 comparisons](ui-comparisons/phase-1c3/). Review retains source typography/palette/cards/table/repeating-row/bar presentation with the documented extensions. Numeric date ticks avoid mobile overlap. Only invalid cells receive error borders; errors name row/column. Semantic row headings use readable body styling. A 768px failure was traced to absolute screen-reader-only action labels escaping the table's containing block; positioning the scroll region fixes document overflow without hiding data or removing accessible names. All ten targeted 768px Charting cases and then the complete 225-case suite passed after the fix. All five final capture cases report no pageerror events, document overflow or out-of-bounds form actions. Source temporary validation toasts are allowed to expire before later comparison states.

There are no remaining implementation blockers for this UI phase. Node 22 CI, other-browser/physical-device/exhaustive accessibility checks and independent design acceptance remain outstanding. Work is uncommitted on local `phase-1c3`; prior branches/checkpoints and reference source are preserved. Nothing was pushed and no subsequent phase began.

## Phase 1C.4 — Client and House Galleries / Documents

### Checkpoint and shared implementation

Completed Phase 1C.3 is preserved at local checkpoint `2913cd0` on `phase-1c3`; baseline checks passed before committing. Work continues on `phase-1c4`, without resetting changes or pushing. The original reference and existing duplicate screenshots remain untouched.

Source references are the client/house Gallery tabs, FileGrid, FileInfo, ImagePreview, UploadZone and profile-photo controls in the exported staff pages/UI. Original card, thumbnail, modal, dropzone, progress, filter and empty-state classes are retained. Existing Icon, Modal, SourcePhoto, Empty, Pagination and profile navigation are reused. Shared `files/` components now provide Gallery, FileCard, FileTypeIcon, FileMetadata, FileDetailsPanel, FileImage, DownloadAction, FileUploadArea and ProfilePhotoPicker, plus typed adapter, policy, seed, navigation and asset registry. A single snapshot attachment array serves both parents; no second mock store was introduced. See [file architecture](file-architecture.md).

### Intentional differences and safety boundaries

- The export has a grid with no list/grid switch. It remains a semantic list of source-styled cards, with document icons; no alternate view control was invented. Filename/type filtering, six-file pagination and complete metadata extend the original presentation.
- Source staff Delete buttons are removed to meet the confirmed permission rule. Only unsent selections can be removed. Existing attachments cannot be deleted or reassociated.
- Visible development warnings, uploader/type/size, accessible action names, wrapping filenames, real download controls and unsupported explanations add height. Mobile cards therefore differ from the shorter original. Original fonts, palette, navigation, icons and card treatment remain.
- Downloads use only genuine local harmless PNG/TXT/CSV files. The export contains no usable PDF asset: PDF and unsupported previews display metadata/placeholders, with downloads disabled. No unknown remote file URL or fake signed URL is used.
- Source selection immediately starts a simulation. The migrated upload explicitly validates and queues files, permits description/removal/cancel, then requires the labelled simulation action. Failure/retry is deliberately controllable. No upload request is sent. Only temporary metadata enters the existing session provider; contents are never persisted. The configurable 15 MiB example limit is labelled provisional, not organisational policy.
- Source photo selection applies immediately. The shared picker adds preview/cancel and explicitly temporary application. Local object URLs are revoked on replacement/unmount. There is no gallery deletion or durable profile write.
- Image loading/failure/retry, bounded mobile metadata, focus/keyboard controls and URL-backed details extend source interactions. Native downloads are enabled only through the closed asset registry.

### Evidence methodology and limitations

Nine representative original/migrated views at each of 375, 390, 768, 1280 and 1440px cover images, documents, house files, details, image preview, selection, validation error, empty state and photo selection. The test-only reference harness supplies the same fictional attachments and local assets to untouched source JSX/CSS. Frozen time and deterministic external profile/house imagery follow prior phases. Added PNG illustrations and TXT/CSV material contain no health information.

The original has no document filter; its document capture focuses document cards. Its validation example uses an oversized PDF because the original does not reject the migrated unsupported-type example. Original selection captures its immediate progress; original photo selection captures its immediate application rather than a nonexistent picker. Empty comparisons use the empty house: the original client profile crashes for a fixture whose optional contact phone is absent (`nok.phone.replace`). The migrated empty-client case remains covered functionally; reference source was not modified to conceal this limitation. Source overflow remains visible; bounds assertions apply to migrated screens.

Captures demonstrate source fidelity with these documented extensions, not exact pixel parity or independent design acceptance. Other browsers, physical devices, exhaustive accessibility, remote font availability and intended Node 22 runtime verification remain outstanding. No backend, Admin CMS, secure file service or next phase was started.

Tablet visual review found a thumbnail image extending over its filename, an overflow also visible in the source. The migrated thumbnail now has an explicit fixed-height clipping container; geometry assertions ensure the image ends within the thumbnail and metadata begins below it at every tested width. The local dev server generated the normal `.next-local` type includes in `tsconfig.json`.

### Phase 1C.4 final verification

Lint, strict TypeScript, formatting, 72 unit tests, the complete 275-case browser suite, production build and all 41 production-isolation checks pass. After the final thumbnail fix, all 50 gallery cases passed again across the five required widths, including image/metadata geometry checks. Final evidence includes 90 raw screenshots and 15 paired boards; reviewed mobile/tablet/desktop states retain the source design with the differences above, with no collected page errors or document-level overflow. Original 51 reference files and three active source CSS copies remain byte-identical. Client/house galleries return HTTP 200 on the local development preview at port 8443. Node 22 remains unavailable. Changes are uncommitted on `phase-1c4`; nothing was pushed and no subsequent phase began.

### Git publication checkpoint

After implementation review, the user authorised committing and pushing the complete tracked application on a new branch, `phase-1c4-complete`. This branch includes the earlier application history and the Phase 1C.4 source, tests, harmless demo assets, documentation and comparison evidence. Prior branches are preserved; `reference/`, secrets, generated output and unrelated pre-existing duplicate screenshots are excluded.

## Phase 1D.1 — Staff Roster and Timesheets

### Checkpoint and source inspection

The brief's uncommitted Phase 1C.4 note was superseded by the user-authorised publication: `bc4b5e1` on `phase-1c4-complete` already preserves the full application. Before integration, lint/typecheck/format, 72 unit tests, all 275 browser cases, build and 41 production-isolation checks passed again. Work is isolated on new local `phase-1d1`; no reset/discard/push. Existing reference and unrelated duplicate screenshots remain untouched.

Inspected original Roster/ShiftRow in `staff/pages/Other.tsx`, ShiftDetail/shiftStatus in `ClockIn.tsx`, shared Tabs/CorrectionDialog/Calendar/table CSS, store shift/attendance fixtures and the active Clock-in/Dashboard selectors. The export contains one Roster page with calendar/upcoming, Team Schedule and Timesheets tabs; it has no shift-swap request UI or separate Attendance Details screen. No unreachable legacy roster page was substituted.

### Shared components and data

Reused Staff shell/navigation, PageHeader, Tabs, Card, ShiftCard, ShiftDetail, Status, Avatar, Empty, Banner, FormField, Select, Pagination, Icon and unsaved-change handling. Source calendar grid/head, date chips, shift rows, two-column layout, stat row, table and modal classes remain. New `staff/roster/` modules separate Roster orchestration, RosterCalendar, HouseFilter, TeamSchedule, Timesheets, AttendanceDetails, AttendanceMetadata, AttendanceCorrectionForm, date helpers, adapter, typed contracts and fictional seed.

Existing stable shifts and times remain shared with Clock-in and Dashboard. The single snapshot/provider adds own attendance and a separate attendance-correction array. No second roster store, browser persistence or fake API was created. Pure queries enforce own-shift/attendance association and assigned-house team scope; serialisation excludes coworker/private attendance and corrections. Team queries project operational data only. Shared status selectors handle cancellation and completed/current/upcoming consistently. Diary/Care Plan/Charting demo appearance remains distinct from timestamped attendance and does not silently populate timesheets. See [scheduling-and-attendance.md](scheduling-and-attendance.md).

### Routes and interaction boundaries

The existing `/roster?tab=…` now renders the three real views. URL-backed day/month/house, own shift/attendance details and `action=correction` support deep links, refresh and browser Back. Server preview validation rejects unrelated/unknown IDs, malformed/repeated parameters and inaccessible houses with generic HTTP 404. No new API or competing route hierarchy. Existing Dashboard/Clock-in roster links remain connected. House/attendance links extend the shared ShiftDetail. Filters/pagination in Timesheets are view state.

Corrections validate own immutable association, reason, at least one changed valid NZ event time, resulting chronology, non-future proposal and no pending request. Completion creates separate Pending Review metadata only; original events remain unchanged. Historical approved/rejected fixtures demonstrate display without applying changes or exposing review controls. Cancel/Back/unsaved navigation use existing prompts. Real Clock In/Out, GPS, Admin review, persistent audit and payroll remain unimplemented. No automatic GPS bypass or invented attendance policy was introduced.

### Intentional visual differences

- Breadcrumbs, existing preview strip, feature warning and house/date filters add vertical height. Shared shift cards add attendance state and preserve the existing manager/date metadata; original fonts/palette/card geometry remain.
- Original calendar groups by start date; migrated overnight entries appear on each overlapping date with explicit end-date text. Calendar navigation uses explicit NZ date keys, selected/current semantics and arrow-key focus rather than device-local/UTC slicing.
- The source's team table contains all future authorised shifts. The migrated view requires house/day selection and groups the operational rows with collapse/expand. It reveals no coworker event/location/private personnel information.
- Timesheets add date/house filters, newest-first ordering, six-row pagination, actual versus scheduled distinctions, missing clock-out labels and details links. Wider columns remain contained horizontal scroll regions with labels/focus and visible instructions; text is not shrunk to fit a phone.
- Attendance Details is a new source-styled modal. The original overnight ShiftDetail provides its nearest metadata reference. Structured proposed dates/times and the existing full-page correction pattern replace the source's free-text-only correction modal. Original values, development limits and requests remain separate.
- Source cancellation logic ignores cancelled status and ready-to-clock-in implies verification; migrated shared selectors exclude cancelled assignments and keep real attendance controls disabled. Historical approval labels explicitly say fixture; no staff review buttons exist.
- Initial mobile review caught a date input squeezed beside its label. Scoped toolbar flex wrapping now gives date filters readable width. Tablet review also restored the original `cm-input` treatment and stacked labels for these date controls. A test failure reading a stale house-filter result was corrected by waiting for URL/render completion, preserving the scope assertion.

The test-only reference harness compiles the pure scheduling modules and adapts only fictional data, not source JSX/CSS. All source originals remain unchanged. Roster comparisons use frozen time and explicit Pacific/Auckland browser timezone, same fixtures and deterministic external-image/tiles. Nine states at each agreed width cover landing/calendar, shifts, team, timesheets, attendance, correction, validation and empty state. Original source limitations and the added workflows mean exact pixel parity is not claimed.

### Changed files and remaining limits

New roster modules and unit/browser tests; existing StaffSnapshot/adapter/selectors, Roster route, shared ShiftCard/ShiftDetail, a Dashboard cancelled-coworker exclusion and scoped bootstrap CSS. Reference/production verification scripts and README/route/status/model/history/evidence docs are updated. No dependencies, font binaries, original CSS, Admin screens or backend services changed.

Node 22 was checked in common local Homebrew/mise/nvm locations and remains unavailable; host Node 25.9.0/pnpm 10.15.1 is explicitly documented. Physical devices, other browsers, exhaustive accessibility, independent design acceptance, trusted identity/server authorisation, persistence and management review remain future work. No Leave/Notifications/Admin/backend phase begins automatically; no push is part of this assignment.

The original source treats a past open attendance fixture as active in its sidebar. The migrated Timesheets explicitly labels it Missing Clock-out and does not infer verified current attendance. This source limitation remains visible in comparisons.

### Phase 1D.1 final verification

Final lint (zero warnings), strict TypeScript, formatting, all 81 unit tests, all 325 browser cases, production build and 49 production-isolation checks pass. All prior 275 browser cases remain included, without weakening their assertions. After the final date-filter appearance adjustment, the complete 50-case Roster suite passed again across all five required widths. The final captures report no collected page errors or document-level horizontal overflow. Local Roster, Timesheets and attendance correction routes return HTTP 200 on port 8443. Restricted scheduling/private attendance fixture markers are absent from production client chunks. All 51 source reference files and the three active source CSS copies remain unchanged.

Final evidence contains 90 raw captures and 15 paired comparison boards at 375, 390, 768, 1280 and 1440px, with reviewed mobile/tablet/desktop layouts and documented source limitations/extensions. See [Phase 1D.1 comparisons](ui-comparisons/phase-1d1/README.md). Node 22 verification remains outstanding. There are no remaining UI implementation blockers; work is uncommitted on local `phase-1d1`, checkpoint `bc4b5e1` and previous branches are preserved, and nothing was pushed. No later phase has begun.
