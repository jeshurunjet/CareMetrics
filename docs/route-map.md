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
| house | `/houses/[houseId]?tab=…` | ported, UI-matched, tested; overview and contacts where applicable; documentation tabs are Phase 1C placeholders |
| client | `/clients/[clientId]?tab=…&sub=…&item=…` | tested scoped detail placeholder; original content planned |
| new-diary (house) | `/houses/[houseId]/diary/new` | original; planned |
| new-diary (client) | `/clients/[clientId]/diary/new` | original; planned |
| new-record | `/clients/[clientId]/records/new?templateId=…` | original; planned |
| search | `/search?q=…` | ported, UI-matched, tested; scoped house/client query |
| roster | `/roster?tab=…` | original; routed placeholder |
| leave | `/leave` | original; routed placeholder |
| notifications | `/notifications` | original; routed placeholder |
| profile | `/profile` | original; routed placeholder |
| settings | `/settings` | original; routed placeholder |

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
