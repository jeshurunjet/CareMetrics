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
| dashboard | `/admin/dashboard` | original content; ported shell/placeholder |
| employees | `/admin/employees` | original; routed placeholder |
| employee / employee-form | `/admin/employees/[id]`, `/admin/employees/new`, `/admin/employees/[id]/edit` | original; detail/form planned |
| houses | `/admin/houses` | original; routed placeholder |
| house / house-form | `/admin/houses/[id]`, `/admin/houses/new`, `/admin/houses/[id]/edit` | original; planned |
| clients | `/admin/clients` | original; routed placeholder |
| client / client-form | `/admin/clients/[id]`, `/admin/clients/new`, `/admin/clients/[id]/edit` | original; planned |
| roster + shift drawer | `/admin/roster?tab=…&shiftId=…` | original; routed placeholder; drawer planned |
| docs | `/admin/documentation?tab=…` | original; routed placeholder |
| template | `/admin/documentation/templates/[id]` | original; planned |
| record | `/admin/documentation/records/[id]` | original; planned |
| correction | `/admin/documentation/corrections/[id]` | original; planned |
| files + file drawer | `/admin/files?fileId=…` | original; routed placeholder; drawer planned |
| notices | `/admin/notifications?tab=…` | original; routed placeholder |
| notice-form / concern | `/admin/notifications/new`, `/admin/notifications/[id]/edit`, `/admin/concerns/[id]` | original; planned |
| leave + leave drawer | `/admin/leave?requestId=…` | original; routed placeholder; drawer planned |
| reports (incl. audit) | `/admin/reports?tab=…` | original; routed placeholder |
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
