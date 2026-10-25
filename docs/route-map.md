# Approved export → App Router route map

Statuses: `original` = reference retained, `ported` = code adapted, `UI-matched` = inspected against source rendering, `backend-connected` = authorised database operations, `tested` = relevant checks pass, `blocked` = dependency/decision missing. Statuses are independent; a shell route does not mean a screen is migrated.

## Staff (first migration priority)

| Export stack page | Proposed URL | Current status |
| --- | --- | --- |
| LoginView login | `/login` | ported, tested; development mock sign-in |
| LoginView forgot/reset/expired/2fa | `/forgot-password`, `/reset-password`, `/verify` | original; no fake token/OTP flows ported |
| clock | `/shift-check` | ported, tested; source-derived UI with disabled real attendance |
| home | `/dashboard` | ported, tested; full source-derived dashboard |
| houses | `/houses` | ported, UI-matched, tested; all assigned houses |
| house | `/houses/[houseId]?tab=…` | ported, UI-matched, tested; overview, Diary, Gallery and Notifications/own Concerns migrated |
| client | `/clients/[clientId]?tab=…&sub=…&item=…` | ported, UI-matched, tested; overview, contacts, Diary, Care Plan, Charting and Gallery migrated |
| new-diary (house) | `/houses/[houseId]/diary/new?draft=…` | ported; development draft/create/submit form |
| new-diary (client) | `/clients/[clientId]/diary/new?draft=…` | ported; development draft/create/submit form |
| new-record | `/clients/[clientId]/records/new?templateId=…&draft=…` | ported; configurable assessment create/draft form, development only |
| search | `/search?q=…` | ported, UI-matched, tested; scoped house/client query |
| roster | `/roster?tab=…` | ported, UI-matched, tested; roster/team/own timesheets and attendance correction preview |
| leave | `/leave` | ported, UI-matched, tested; own requests, fictional balances and pending submission preview |
| notifications | `/notifications` | ported; official scoped notices, own concern submission/history/details, development only |
| profile | `/profile` | ported; current employee, allowlisted session contact edits and temporary shared photo |
| settings | `/settings` | ported; intentional Coming Soon with Dashboard return |

Development sign-in → My Shifts → Dashboard is implemented; continuing without clock-in remains possible. The form accepts fictional input only and establishes a UI marker, not a trusted session. Current/nearest shift and three-row selection use the shared adapter. Dates use Pacific/Auckland. House/client cards, roster team tab and notice links retain real URLs; remaining destination content is explicitly placeholder-only.

## Admin (desktop-only UX)

| Export stack page | Proposed URL | Current status |
| --- | --- | --- |
| dashboard | `/admin/dashboard` | ported source-derived summary/queues/shared data; development only |
| employees | `/admin/employees` | ported directory/search/filter/pagination |
| employee / employee-form | `/admin/employees/[id]`, `/admin/employees/new`, `/admin/employees/[id]/edit` | ported overview/assignments/account, create/edit and linked workforce records |
| houses | `/admin/houses` | ported cards/list/search/filter/pagination |
| house / house-form | `/admin/houses/[id]`, `/admin/houses/new`, `/admin/houses/[id]/edit` | ported core details, relationships/location, create/edit |
| clients | `/admin/clients` | ported directory/search/filter/pagination |
| client / client-form | `/admin/clients/[id]`, `/admin/clients/new`, `/admin/clients/[id]/edit` | ported profile/contacts/confirmed transfer, create/edit and bounded documentation summaries |
| roster + shift drawer | `/admin/roster?tab=…&shiftId=…` | ported roster/shift/attendance/timesheet/correction views and development-only query drawers |
| docs | `/admin/documentation?tab=…` | ported overview/categories/libraries/assignments/submitted records/correction review; development only |
| template | `/admin/documentation/templates/[id]` | ported draft builder/preview/publishing/versions/assignments |
| record | `/admin/documentation/records/[id]?kind=diary\|care` | ported original/effective submitted details and revision history |
| correction | `/admin/documentation/corrections/[id]` | ported comparison and development-only approve/reject |
| files + file drawer | `/admin/files?fileId=…` | ported shared gallery directory and query-backed details/removal drawer |
| notices | `/admin/notifications?tab=…` | ported development notices/concerns |
| notice-form / concern | `/admin/notifications/new`, `/admin/notifications/[id]/edit`, `/admin/concerns/[id]` | ported draft/read-only publication/withdrawal and concern review |
| leave + leave drawer | `/admin/leave?requestId=…` | ported pending/all/calendar and development-only request review |
| reports (incl. audit) | `/admin/reports?tab=…` | ported read-only summaries and Development Audit Preview |
| settings | `/admin/settings?tab=…` | original; routed placeholder |

Admin width gate comes from the preserved export CSS. It is not authorization. Both preview layouts and every preview page refuse requests unless NODE_ENV is development AND CAREMETRICS_UI_PREVIEW is exactly true. No route exposes real records; production login is inert until Auth.js is implemented. Unknown/deep routes not listed as implemented return 404.

## Earlier migration

The prior `/employee/*`, `/rostering`, `/care-records`, `/care-management`, `/attendance`, `/administration`, employee creation and related routes belong to a different source version. They are archived in `reference/workspace-before-bootstrap/src/app`, not carried forward as competing approved routes. No external redirect contract is assumed at this local bootstrap checkpoint.

## Phase 1B route behaviour

- `/houses/[id]`: `tab=overview` (default), `diary`, `files`, `concerns`. Overview is migrated; remaining tabs explicitly defer their feature implementation to Phase 1C.
- `/clients/[id]`: `tab=overview` (default), `diary`, `care`, `charting`, `files`. Overview/Contacts are migrated; remaining tabs are Phase 1C placeholders. Contacts shortcut uses `?tab=overview#contacts-[id]`, scrolls/focuses the read-only section and preserves browser navigation.
- `/search?q=…`: URL query follows input; house-name matches include that house's authorised clients. Results link to the same canonical detail URLs.
- Invalid/unassigned IDs and unknown tab values return not-found without record details. Detail pages validate before streaming. Listing loading boundaries live in a route group, preserving `/houses` while avoiding the streamed HTTP 200 that a shared loading boundary would otherwise cause for rejected detail URLs.

Dashboard → Houses → House → Client, Dashboard → Client, Search → either profile, Client → related House, house switching, breadcrumbs, tabs, Back and refresh are exercised at all five widths. These are fixed fictional employee preview lookups; Auth.js and production role/organisation/house permissions are unimplemented. Admin routes remain unchanged.

## Phase 1C.1 diary routes

The existing `tab=diary` destinations now render scoped Client/House Diary History, not placeholders. Six entries per page, search, category/date filtering and expandable cards reuse the source pattern. Other documentation tabs remain placeholders.

| Destination | Client | House |
| --- | --- | --- |
| History | `/clients/[id]?tab=diary` | `/houses/[id]?tab=diary` |
| Details | `/clients/[id]?tab=diary&item=[entryId]` | `/houses/[id]?tab=diary&item=[entryId]` |
| Create | `/clients/[id]/diary/new` | `/houses/[id]/diary/new` |
| Continue own draft | `/clients/[id]/diary/new?draft=[entryId]` | `/houses/[id]/diary/new?draft=[entryId]` |
| Request correction | `/clients/[id]?tab=diary&item=[entryId]&action=correction` | `/houses/[id]?tab=diary&item=[entryId]&action=correction` |

These use the already-planned diary/new paths and profile item query rather than introducing a second record URL scheme. Client/house association is checked before every mock read/write. Draft lookup also requires the author and draft state; submitted records cannot be reopened in the editor. Corrections require the submitted author and no pending request. No staff review/approval route or operation exists.

Unknown/unassigned subjects fail server validation with HTTP 404. A missing, wrong-subject, unassigned or other-author diary entry shows a generic unavailable state within the authorised profile (HTTP 200); it reveals none of that entry's content. This also covers session-only IDs lost on reload. Seeded authorised entry links survive reload; newly created entries survive only client-side navigation. The preview layout serialises only the fixed fictional employee's scoped snapshot, including their authorised diary data; it is not an authenticated service. Production refuses every preview route.

Form breadcrumbs return to the actual subject and Diary. Cancel and completion return to that subject's history. Unsaved changes require confirmation on Cancel, navigation and Back; reload/tab-close use the browser's before-unload prompt when supported. A same-URL history guard keeps the editor mounted when Back is declined. Editor completion replaces the guard location. Filters/pagination are view state and reset on a fresh visit.

## Phase 1C.2 Care Plan routes

| Destination | URL |
| --- | --- |
| Assigned category list | `/clients/[id]?tab=care` |
| Category history | `/clients/[id]?tab=care&sub=[templateId]` |
| Assessment details | `/clients/[id]?tab=care&sub=[templateId]&item=[recordId]` |
| New assessment | `/clients/[id]/records/new?templateId=[templateId]` |
| Continue own draft | `/clients/[id]/records/new?templateId=[templateId]&draft=[recordId]` |
| Request correction | `/clients/[id]?tab=care&sub=[templateId]&item=[recordId]&action=correction` |

These implement the already-planned `sub`/`item` profile queries and records/new path. No competing record URL hierarchy is introduced. Categories reflect only active client assignments to published Care Plan versions. Unassigned/unknown client/template URLs return server HTTP 404; wrong-client, wrong-template, missing record and another author's draft return generic unavailable content inside an authorised profile (HTTP 200), matching the session-only diary pattern. Seeded records survive refresh; session-created IDs become unavailable on reload.

Client → Care Plan → category history → new assessment → draft/details/submission → correction is connected. Details retain the record's own published template version; draft editing retains its version even if the current assignment changes. Breadcrumbs, return-to-history, browser Back and refresh use the same Staff shell. Assessment creation and corrections reuse its unsaved-change confirmations. No production authentication or organisation/role/house service is implemented; all previews still fail closed in production. At the Phase 1C.2 checkpoint, Charting and Gallery remained placeholders; Charting is implemented below.

## Phase 1C.3 Charting routes

Charting uses the same planned profile queries and records/new path as Care Plan. No competing route hierarchy is introduced.

| Destination | URL |
| --- | --- |
| Assigned charts | `/clients/[id]?tab=charting` |
| Chart history | `/clients/[id]?tab=charting&sub=[templateId]` |
| Submitted/draft details | `/clients/[id]?tab=charting&sub=[templateId]&item=[recordId]` |
| New entry | `/clients/[id]/records/new?templateId=[templateId]` |
| Resume own draft | `/clients/[id]/records/new?templateId=[templateId]&draft=[recordId]` |
| Request correction | `/clients/[id]?tab=charting&sub=[templateId]&item=[recordId]&action=correction` |

The server validates the fixed fictional employee's client assignment and the expected care/chart template kind before rendering profile history. The shared form route resolves the assigned template kind; breadcrumbs, draft/submission returns and correction returns preserve that area. Unknown/unassigned clients/templates and a chart template opened under Care Plan (or vice versa) return HTTP 404. Invalid/wrong-client/wrong-template/other-author record IDs show a generic unavailable view within an authorised profile (HTTP 200). Session-created IDs reset on reload; seeded links can refresh.

Chart history rows navigate using explicit links. Search, author/date filters and six-record pagination remain view state. Submitted cells are read-only; repeating editable rows exist only inside the shared form. Cancel, Back and ordinary in-app navigation preserve the existing unsaved-change prompts. Staff can save a draft before navigating and resume it within the same provider session. No browser record storage or authenticated service has been introduced. Production continues to reject all preview routes.

## Phase 1C.4 Gallery / Documents routes

| Destination | Client | House |
| --- | --- | --- |
| Gallery | `/clients/[id]?tab=files` | `/houses/[id]?tab=files` |
| Information | `/clients/[id]?tab=files&fileId=[fileId]&action=info` | `/houses/[id]?tab=files&fileId=[fileId]&action=info` |
| Preview | `/clients/[id]?tab=files&fileId=[fileId]&action=preview` | `/houses/[id]?tab=files&fileId=[fileId]&action=preview` |

Missing `action` defaults to information. Unknown actions or missing/wrong-subject file IDs show generic File unavailable content (HTTP 200) within an authorised profile, revealing none of that file's metadata. Unknown/unassigned parent client/house and repeated non-scalar file/action queries return server HTTP 404. Seeded file links survive refresh; session-only additions become unavailable after reload. These are fixed fictional preview lookups, not authenticated server authorisation.

The same Gallery component reads the explicit `{scope, targetId}` association. Client and house documents never merge. Links preserve query context, Browser Back and direct refresh; closing a modal pushes the subject's gallery URL. Existing modal focus containment/Escape are reused. Filter/page state stays mounted while opening details but resets after refresh. Upload files in the header focuses the existing selection area. File selection/progress is component-local and is cancelled/released when leaving the gallery; completed metadata survives navigation only in the existing provider session.

Profile-photo selection uses a shared modal from the existing client photo control and house Update house photo action. Applied photo previews remain only while that profile is mounted; leaving/reloading it restores its original photo. No new upload/download API route or object storage endpoint was introduced. `/demo-assets/*` contains only clearly labelled harmless public PNG/text/CSV examples and their SVG source illustrations. These assets are public in every environment; they are not private care attachments. Only their allowlisted genuine assets have download links. All Staff gallery routes still fail closed in production.

## Phase 1D.1 Roster and Timesheets

The existing `/roster?tab=…` placeholder is replaced by one Staff destination. `tab=roster` (default), `team` and `timesheets` retain the original segmented navigation. No new URL hierarchy or backend endpoint was added.

| View | URL |
| --- | --- |
| Calendar and upcoming shifts | `/roster?tab=roster&day=YYYY-MM-DD&month=YYYY-MM&house=[houseId]` |
| Team Schedule | `/roster?tab=team&house=[houseId]&day=YYYY-MM-DD` |
| My Timesheets | `/roster?tab=timesheets` |
| Own Shift Details | `/roster?tab=roster&shiftId=[shiftId]` (also accessible from timesheets) |
| Own Attendance Details | `/roster?tab=timesheets&attendanceId=[attendanceId]` |
| Request correction | `/roster?tab=timesheets&attendanceId=[attendanceId]&action=correction` |

Dashboard → Roster/Team, My Shifts → View full roster, calendar/list → Shift Details → House, and Timesheets → Attendance → Correction are connected. Shift/attendance modals support Escape, Back and direct refresh. Closing a modal retains its selected calendar/team context. Calendar/team house/day/month selection is URL-backed; timesheet range/house/page filters are view state and reset on refresh or opening the full-page correction editor.

The server preview gate validates scalar query values, tab/date/month/house and own shift/attendance scope before rendering. Unknown/unassigned house, coworker/unrelated/missing shift or attendance IDs, repeated parameters and invalid action/association combinations return generic HTTP 404 without unrelated record metadata. There is no streamed loading boundary that converts these validation failures into HTTP 200. Seeded deep links resolve; requests are session-only additions attached to a seeded attendance ID. Production still refuses all preview routes, even with the flag enabled. These are fixed fictional lookups, not production identity/authorisation.

## Phase 1D.2 Staff Leave

The existing `/leave` destination now renders the shared Staff Leave overview/history. Desktop sidebar and mobile Menu retain their existing Leave entry; Dashboard adds a source-styled My Leave shortcut.

| View | URL |
| --- | --- |
| Overview, upcoming approved periods and own history | `/leave` |
| New request modal | `/leave?action=new` |
| Request details modal | `/leave?requestId=[requestId]` |

No competing route hierarchy or leave API was introduced. The form/details preserve browser Back, breadcrumbs, direct entry and refresh. Closing returns to `/leave`; valid submission replaces the form URL with the new details URL. History filter/page state is client view state. Dirty form Cancel/Escape/navigation/Back require discard confirmation; successful submission disarms the guard.

The preview gate refuses production. Repeated/non-scalar parameters, unsupported action and simultaneous new-form/request queries return HTTP 404. Missing/unknown/other-employee request IDs show the same generic unavailable state within the own Leave page (HTTP 200), without any other employee metadata. This also supports session-created IDs which resolve during client navigation but become unavailable on reload. These fixed fictional employee checks are not production authentication/authorisation.

Roster-context links use existing `/roster?shiftId=…`; they never grant roster editing or expose coworker leave. No withdrawal, approval, cancellation or decision-editing route exists.

## Phase 1D.3 Notifications and Concerns

One canonical `/notifications` route uses `tab=all|client|house|staff|concerns` (All default), `item=[noticeId]`, `tab=concerns&concernId=[id]`, or `action=new`. Profile links add `context=client|house&targetId=[id]` for exact scope/preselection. No duplicate detail route/API is introduced. Dashboard cards, header/sidebar/mobile Menu, contextual Client notices and House overview/concerns connect to it. Details close to the scoped base; context links open the authorised profile. Category changes intentionally return to the general category.

Malformed/repeated/conflicting selectors and unknown tabs/actions/context subjects fail server preview validation with HTTP 404. Unknown/private notice/concern IDs produce generic unavailable content (HTTP 200), including session-only IDs after reload; no protected metadata is serialised. Seeded deep links, refresh, Back and forward remain supported. All routes remain development-only; trusted server authentication/organisation permissions remain outstanding. See [notification contracts](notifications-and-concerns.md).

## Phase 1D.4 Profile and Settings

Existing `/profile` is own-only. `?action=edit` selects the source inline contact form; `?action=photo` selects the shared temporary picker. Only one optional recognised action is accepted. Unknown/repeated keys/actions and attempts to choose another employee return server 404; `/profile/[id]` does not exist. Cancel/save/photo completion replace the query with the own overview. Shared unsaved-change guards cover inline edits, Cancel, navigation, Back and supported reload prompts. Seeded own data refreshes normally; session contact/photo changes reset on reload/provider remount.

Dashboard current-employee card, desktop sidebar and mobile menu reach Profile; assigned-house buttons use the same canonical house routes and assignments. Settings preserves Coming Soon and adds Back to Dashboard. Mobile drawer items expose current-page semantics. All nine primary Staff destinations and the continuous core journey are covered by the integration tests; Admin stays separate. Real authentication and server permission enforcement remain future work. See [Staff completion review](staff-ui-completion-review.md).

## Phase 1E.1 Admin core and session scope

Core Admin routes are ported, source-compared with documented extensions and tested; none is backend-connected. Operational placeholders remain explicitly deferred.

`/admin` redirects to `/admin/dashboard`. Existing canonical entity routes above now render source-derived core management UI. Detail tabs use `?tab=`: Employees `overview|houses|roster|attendance|leave|account`; Houses `overview|employees|clients|location|diary|files|notices`; Clients `overview|contacts|house|diary|care|chart|files|notices|activity`. New Client from House uses the form's optional selected-house query, not a second creation route. `saved=1` displays explicit session-only confirmation.

Every server page/layout retains `requirePreview`/equivalent development-only gating. Malformed/unknown tabs and invalid seeded identifiers show generic not-found. Session UUIDs can resolve during client navigation; after reload, missing records show unavailable after explicit preview opt-in. Fresh Admin direct requests require the development role opt-in; Login's existing explicit Administration preview entry selects it. Manager/Staff/Senior Staff demonstrations are labelled and never trusted security.

The root development provider preserves one snapshot across these Admin routes and Staff. Initial Staff loads remain scoped. Admin data merges once; mutations update current employee/house/client relationships. Staff house/client/care/roster/notification route boundaries now validate current session scope instead of a stale fixed fixture, including during initial SSR. Existing production refusal, malformed-query and unrelated-record checks remain covered. Browser Back, refresh and breadcrumbs use canonical URLs.

Future operational Admin routes remain labelled placeholders. Admin desktop gating remains UX only. See [Admin contracts](admin-core-data-management.md) for role limits, assignment dependency policy, contacts, transfers, privacy projection and outstanding backend requirements.

## Phase 1E.2 Admin workforce

The existing `/admin/roster` and `/admin/leave` destinations replace their placeholders. No duplicate hierarchy/API is added.

| View | Canonical URL |
| --- | --- |
| Calendar / Shift list / Monitor / Timesheets / Corrections | `/admin/roster?tab=calendar\|shifts\|attendance\|timesheets\|corrections` (calendar default) |
| Shift details | `/admin/roster?tab=shifts&shiftId=[id]` |
| Create shift / calendar preset | `/admin/roster?action=new&house=[optionalId]&day=[optionalYYYY-MM-DD]` |
| Edit / confirm cancellation | `/admin/roster?shiftId=[id]&action=edit\|cancel` |
| Attendance/timesheet details | `/admin/roster?tab=timesheets&attendanceId=[id]` |
| Attendance review | `/admin/roster?tab=corrections&correctionId=[id]` |
| Pending / All / Calendar leave | `/admin/leave?tab=pending\|all\|calendar` (pending default) |
| Leave details/review | `/admin/leave?tab=all&requestId=[id]` |

Back/forward, existing breadcrumbs and employee/house links are retained. Detail close clears panel/action selectors while retaining the tab. Calendar/list filters are mounted view state, not saved URL filters. Malformed/repeated/unknown/conflicting parameters and invalid known-format record IDs return server 404; valid session UUIDs absent after reload show generic unavailable panels after development opt-in. Known seeded deep links can refresh after opt-in. Every page/layout still refuses production even when the preview flag is enabled. These browser role/scope demonstrations are not authenticated server authorisation.

Employee roster/attendance/leave tabs now link to the same Shift, AttendanceRecord and LeaveRequest panels. Dashboard attendance requests link to their workforce correction IDs. Future documentation/template/file/publication/concern/report/settings destinations remain explicitly deferred.

## Phase 1E.3 Admin documentation

`/admin/documentation?tab=overview|categories|care|chart|assignments` renders the shared documentation manager. `records|corrections` explicitly remain Phase 1E.4 placeholders. Templates use `/admin/documentation/templates/[id]?tab=builder|preview|versions|assign`, with builder default. Create/category/property/publish/assignment confirmations are local dialogs within these canonical destinations, not new APIs. Breadcrumbs, sidebar active state, Back and existing valid links remain. Server preview gates reject production and unknown/repeated query selectors. Missing session templates after reload show generic unavailable content following explicit role opt-in.

Staff URLs are unchanged. Active assignments select new-entry versions; paused assignments hide categories/new actions while existing exact-version record URLs remain readable within current house/client scope. New entries/old draft submission require an active assignment; version reassignment preserves old drafts. See [documentation contracts](admin-documentation-builder.md) for historical-read and unresolved production policies.

## Phase 1E.4A Admin submitted records and corrections

The existing Documentation `tab=records|corrections` placeholders are ported. Earlier phase notes describe their historical state. Records uses four distinct type filters; corrections uses Pending Review/Approved/Rejected/All. Overview/categories/libraries/assignments and template routes remain canonical.

| View | Canonical URL |
| --- | --- |
| Submitted overview, bounded four-context list | `/admin/documentation?tab=records` |
| Care documentation correction queue | `/admin/documentation?tab=corrections` |
| Client/House Diary original/effective details | `/admin/documentation/records/[id]?kind=diary` |
| Care Plan/Charting exact-version details | `/admin/documentation/records/[id]?kind=care` |
| Request comparison/review | `/admin/documentation/corrections/[id]` |

The required kind discriminator prevents diary/care ID collisions. New server pages reject production, malformed/repeated/unknown selectors and invalid ID syntax; missing session IDs show generic unavailable after management opt-in. Wrong kind, draft/missing/invalid-association records and invalid requests reveal no record DTO. No API or second detail hierarchy is added. Existing Back/forward/refresh/breadcrumbs, subject/house/author links and Staff URLs remain unchanged. Filters are mounted view state; list/history pagination bounds rendered records.

Staff requests now optionally include explicit typed fields/cells/whole tables. Approved revisions derive effective displays without replacing raw submitted entries in the shared snapshot/projection. Current client/house access controls original/revision visibility; no historical-access exception is added. Attendance correction routes and collections remain independent. See [record review contracts](admin-record-review.md). No backend-connected status is claimed.

## Phase 1E.4B remaining management UI

| View | Canonical URL |
| --- | --- |
| File directory / detail drawer | `/admin/files`, `/admin/files?fileId=[id]` |
| Client / House gallery | `/admin/clients/[id]?tab=files`, `/admin/houses/[id]?tab=files` |
| Official notices / Concern queue | `/admin/notifications?tab=notices\|concerns` |
| Create notice / edit draft or inspect publication | `/admin/notifications/new`, `/admin/notifications/[id]/edit` |
| Concern review | `/admin/concerns/[id]` |
| Context notices / concerns | `/admin/clients/[id]?tab=notices`, `/admin/houses/[id]?tab=notices` |
| Summary reports / development metadata | `/admin/reports?tab=reports\|audit` |

Default tabs are notices/reports. New server pages retain requirePreview and reject malformed/repeated/unknown selectors and invalid ID syntax with 404. Existing seeded and well-formed session IDs resolve after management opt-in; missing IDs return generic unavailable content without unrelated metadata. Details close to the directory; parent gallery links/browser Back return through canonical URLs. Draft Save/Publish replaces new with its session edit/detail URL. Published/withdrawn notices remain read-only. Confirmation, upload selection, report-event details and filters are mounted view state. Reload resets changes and requires fresh opt-in; no persistence or production authorisation is implied. Staff URLs remain unchanged and recheck current audience/author/parent scope. No API or duplicate store was introduced.

## Phase 1E.5 final route classification

This inventory covers all **43 registered page files** (grouped where they share a module) and supersedes historical migration/placeholder notes above. `UI complete — development simulation` means functional fictional session UI only; `UI complete — read-only` means presentation of fictional records, not a server service. No route is backend-connected. Production login is inert and preview pages refuse production access even with the preview flag enabled.

| Registered route(s) | Classification | Included subviews / limits |
| --- | --- | --- |
| `/` | UI complete — read-only | Redirect to Login |
| `/login` | UI complete — development simulation | Fictional Staff/Admin entry only; actual authentication unavailable |
| `/shift-check` | UI complete — development simulation | My Shifts, selection, GPS feedback demonstrations; actual clock-in/out blocked |
| `/dashboard` | UI complete — read-only | Assigned context, shifts, links and summaries |
| `/houses` | UI complete — read-only | Assigned house list |
| `/houses/[id]` | UI complete — development simulation | Overview, Diary/history/details/correction preview, Files/Gallery, Notifications/own Concerns; query tabs/sub/item retain context |
| `/houses/[id]/diary/new` | UI complete — development simulation | New/draft/edit/submit; no persistence |
| `/clients/[id]` | UI complete — development simulation | Overview/NOK anchor, Diary/history/details, Care Plan, Charting/repeating tables, Files; query tabs/sub/item retain context |
| `/clients/[id]/diary/new` | UI complete — development simulation | New/draft/edit/submit; no persistence |
| `/clients/[id]/records/new` | UI complete — development simulation | Assigned template/version form, draft/submit; no persistence |
| `/search` | UI complete — read-only | Scoped house/client search, query-backed results |
| `/roster` | UI complete — development simulation | Own roster/team/Timesheets, shift details and attendance correction request preview |
| `/leave` | UI complete — development simulation | Own requests/balances/new/cancel/history preview |
| `/notifications` | UI complete — development simulation | Notices/read state, own Concerns/new/details/outcome |
| `/profile` | UI complete — development simulation | Own details/contact edits/temporary photo/assigned houses; managed fields read-only |
| `/settings` | Intentional placeholder | Coming Soon and Dashboard return |
| `/admin` | UI complete — read-only | Redirect to Admin Dashboard |
| `/admin/dashboard` | UI complete — read-only | Shared fictional summaries/queues |
| `/admin/employees`, `/admin/employees/[id]`, `/admin/employees/new`, `/admin/employees/[id]/edit` | UI complete — development simulation | Directory/overview/assignments/account, create/edit/assign/status; real account provisioning blocked |
| `/admin/houses`, `/admin/houses/[id]`, `/admin/houses/new`, `/admin/houses/[id]/edit` | UI complete — development simulation | Directory/overview/relationships/location/create/edit; coordinates are not GPS verification |
| `/admin/clients`, `/admin/clients/[id]`, `/admin/clients/new`, `/admin/clients/[id]/edit` | UI complete — development simulation | Directory/profile/NOK/transfer/documentation summaries/create/edit |
| `/admin/roster` | UI complete — development simulation | Roster/shift drawer, attendance/Timesheets/corrections; query-backed selection/review |
| `/admin/leave` | UI complete — development simulation | Pending/all/calendar/request drawer/review |
| `/admin/documentation` | UI complete — development simulation | Overview/categories/Care Plan/Charting libraries/assignments/records/corrections |
| `/admin/documentation/templates/[id]` | UI complete — development simulation | Builder/preview/versions/publish/assign; unsupported field types unavailable |
| `/admin/documentation/records/[id]` | UI complete — read-only | Diary/care original/effective record, exact version/revision history; `kind` validated |
| `/admin/documentation/corrections/[id]` | UI complete — development simulation | Original/proposal comparison and approve/reject; originals retained |
| `/admin/files` | UI complete — development simulation | Exact parent directory/filters/query drawer/logical removal; real upload/deletion blocked |
| `/admin/notifications`, `/admin/notifications/new`, `/admin/notifications/[id]/edit` | UI complete — development simulation | Notices/concern queue, draft editor, published read-only/withdrawal/history; delivery blocked |
| `/admin/concerns/[id]` | UI complete — development simulation | Review/internal note/author response/events; private notes omitted from Staff projection |
| `/admin/reports` | UI complete — read-only | Reports/Development Audit Preview; exports and unsupported controls blocked |
| `/admin/settings` | Intentional placeholder | FutureModule; no settings service |

Action-level and unregistered classifications:

| Destination/action | Classification | Meaning |
| --- | --- | --- |
| `/forgot-password`, `/reset-password`, `/verify` | Future development | Planned authentication routes, not registered; recovery UI does not issue real credentials |
| Real sign-in/session, clock-in/out, secure uploads/private storage, account provisioning/security, delivery, production audit/export | Blocked/unsupported action | Current UI cannot perform these services |
| Unsupported configurable field/attachment actions and unimplemented Settings controls | Blocked/unsupported action | Explicit unavailable controls, no fabricated successful save |
| Unrecognised IDs/invalid context/deep routes | Blocked/unsupported action | Scoped unavailable/404 states, not an alternative module |

All Staff navigation destinations and Admin groups are represented. The source desktop gate applies to Admin on narrow screens; Staff retains responsive layouts. Deferred backend scope does not remove completed preview routes: see [submission boundary](submission-mvp-scope.md) and [handover](ui-freeze-and-backend-handover.md).

## Phase 2A backend-mode update

The Phase 1E.5 classifications above continue to describe the full **development preview**. In explicit `CAREMETRICS_BACKEND_MODE=database`, that provider/role preview is disabled even if its flag is set:

| Route | Database-mode behaviour |
| --- | --- |
| `/login` | Original Login appearance with real Auth.js Credentials; generic rejection, no preview Administration button |
| `/shift-check` | Active authenticated foundation entry; attendance unavailable, Continue to dashboard remains possible |
| `/dashboard` | Authenticated foundation entry; full Dashboard data migration deferred |
| `/admin/dashboard` | Active Manager/Admin foundation entry; original desktop viewport gate retained |
| Other existing Staff/Admin features | Preview-only; unavailable/not-found in database mode, no mock mutations exposed after real login |
| `GET /api/me` | Current safe employee DTO |
| `GET /api/houses` | Current authorised active houses |
| `GET /api/houses/[id]/clients` | Active authorised parent and client list |
| `GET /api/clients/[id]` | Authorised current client profile/NOK |
| `GET /api/admin/foundation` | Management capability check, bounded metadata only |
| `/api/auth/[...nextauth]` | Auth.js GET/POST with configuration/origin guards, CSRF and active session endpoint |

No new UI page families were added; there are still 43 page files. Disabled mode remains inert in production, and the original 141-route production-preview isolation regression is retained. APIs independently recheck server identity, organisation, role and house/client access with explicit private/no-store responses. Invalid/out-of-scope identifiers cannot grant permission. See [backend foundation](backend-foundation.md) for exact boundaries and streamed unavailable-page behaviour. Scope and approved designs are unchanged; full data integration is a later phase.

## Phase 2C database-mode management

Canonical Admin employee/house/client directories, `/new`, `/[id]`, `/[id]/edit` and existing assignment/contact/location/house tabs now use trusted PostgreSQL services in database mode. No new UI hierarchy is introduced. Deferred tabs remain unavailable. Managers/Administrators see same-tenant records, with Administrator-account/role/self/last-admin restrictions on writes. The desktop gate remains presentation only.

Explicit mutation APIs: POST `/api/admin/employees`, PATCH `/api/admin/employees/[id]`, POST `…/[id]/status`, PUT `…/[id]/assignments`; POST `/api/admin/houses`, PATCH `/api/admin/houses/[id]`; POST `/api/admin/clients`, PATCH `/api/admin/clients/[id]`, PUT `…/[id]/contacts`, POST `…/[id]/transfer`. Each independently validates origin/body/session/capability/tenant/target/proposal and commits its audit atomically. No arbitrary-model endpoint exists. Staff read routes remain unchanged and reflect those same records. The full Phase 1 preview remains isolated; production refusal/disabled-backend checks are retained. See [mutation contracts](admin-backend-mutations.md).
