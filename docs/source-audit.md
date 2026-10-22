# Phase 0 source audit — 22 October 2026

## Evidence and provenance

Read root AGENTS.md, reference/AGENTS.md and reference/CareMetrics-Codex-AGENTS.md in full. The supplied inputs are under `reference/`, not the repository root. `reference/src.zip` contains 60 entries (51 files), 788,465 uncompressed bytes: source only, with no manifest, lockfile, public assets, screenshots, tests or deployment configuration. Extraction rejected absolute paths, parent traversal and symlinks. Original archive is retained; byte-for-byte extraction is in `reference/figma-export`. Full per-file imports, exports, action signals, external URLs, reachability and archive checksum are in [source-inventory.json](source-inventory.json).

The existing workspace already contains a Next.js 15 migration of an earlier export, plus Vite remnants. Its employee/manager navigation and views differ from the new archive. Existing README and tsconfig had user changes before this task; generated `.next` files were already tracked and dirty. Preserve the complete previous source/config under `reference/workspace-before-bootstrap`; do not mistake it for the approved latest UI. Initial typecheck failed because `ignoreDeprecations: "6.0"` is invalid with installed TypeScript 5.9.3.

## Actual entrypoints and shared UI

`main.tsx → App.tsx → views/LoginView.tsx`, then `staff/StaffApp.tsx` for employee or `admin/AdminApp.tsx` for administrator/manager. Both new apps consume `staff/store.ts` and `staff/ui.tsx`. Navigation is an in-memory stack, not URLs; refresh resets navigation and data. No local imports are missing, including lazy map imports. Reachability means imported, not that every branch has been exercised.

Staff chrome: desktop collapsible sidebar, mobile header, four-item bottom navigation plus menu drawer, scroll content and toast region. Login starts at Clock-in / My Shifts; dashboard is available without attendance. Staff pages:

| Source | Rendered screens and states |
| --- | --- |
| ClockIn | Current/next shift, three upcoming rows, detail modal, GPS simulation, clock-in/out |
| Home | House/client summaries, notices, shift summary |
| Houses | Assigned house list; profile tabs including clients, diary, notices, gallery |
| Client | Profile/NOK, care plans, charting, diary, history, notices/gallery and corrections |
| Forms | Client/house diary and configurable care record entry, drafts, off-shift reason |
| Other | Search, roster/timesheets, leave, notifications, profile, settings |
| Shared | Diary listing, concern dialog/list, restricted state |
| ui | Icons, buttons, cards, avatars, tabs, dialogs, pagination, field renderer, repeatable tables, validation, correction and file UI |

Admin chrome: desktop gate, collapsible grouped sidebar, global search, review dropdown, account menu with demo role switch, drawers, dirty-form confirmation and toast. Its screens:

| Source | Rendered screens and states |
| --- | --- |
| Dashboard | Management summaries and review queues |
| People | Employee directory/detail/form; house assignments and access controls |
| Places | House/client directories/detail/forms, contacts, location picker |
| Roster | Roster and attendance tabs, shift drawer |
| Docs | Documentation/templates, diary table, record detail, correction review |
| Builder | Care/chart template draft, sections/fields/conditions/table columns, preview/publication/assignments |
| Governance | Files/gallery/upload/removal, notices/forms, concern review, leave/drawer, reports/CSV/audit, organisation/categories/permissions/profile settings |
| core | Admin navigation, permission presentation, tables, drawers, filters and simulated loading |

## Legacy usage

In the latest export **only LoginView is reachable under views/**. All other 17 views (AdministrationView, AttendanceView, CareManagementView, CareRecordsView, ClientsView, CompanyDashboard, EmployeeDashboard, EmployeesView, HousesView, LeaveManagementView, MyAttendanceView, MyLeaveView, MyProfileView, MyRosterView, NotificationsView, ReportsView, RosteringView) are unused parallel screens. All three `components/*Map.tsx` files and `data/staffLocations.ts` are unreachable from the latest entrypoint; older views reference some of them. `staff/ShiftMap.tsx` and `admin/LocationPicker.tsx` ARE used through lazy imports. Supplementary briefs and vite-env are reference/build context, not rendered pages. Nothing from the original export is deleted.

## Dependency and asset inventory

Observed imports require React, React DOM, Leaflet, React Leaflet, Tailwind CSS; TypeScript/React/Node/Leaflet typings are needed. No shadcn, Radix, icon package or form library is imported. Supplied separate reference/package.json is a Vite scaffold, not part of the archive. Installed baseline: Node 25.9.0, pnpm 10.15.1, Next 15.5.23, React/DOM 19.2.4, TypeScript 5.9.3, Tailwind 4.2.2, Leaflet 1.9.4, React Leaflet 5.0.0. Toolchain file requests Node 22; actual host differs.

Global CSS defines DM Sans, DM Serif Display, DM Mono, teal brand `#1a6b7a`, orange accent `#e8834a`, light surface `#f4f6f9`; staff/admin CSS supplies scoped `cm-`/`ad-` classes and responsive rules. Preserve all three stylesheets. Fonts are remote Google CSS, photos are Unsplash URLs; no font binaries or packaged image files exist. Leaflet requests CARTO tiles with OSM/CARTO attribution; old maps also reference unpkg marker images. Licensing/provider availability/privacy review remains outstanding. No sensitive data should be sent to external services. React.lazy alone is not an SSR boundary; maps need Next client-only dynamic mounting. Do not import the original useSyncExternalStore hook into SSR: it has no server snapshot.

## Prototype actions and model gaps

- Login uses hardcoded password branches and a fixed OTP, fake latency; recovery claims an email was sent without sending one. Reset/expired screens exist but have no reachable token flow. Roles are browser state; admin switches roles in a menu. None is security.
- Store updates synchronously notify listeners; all data resets on reload, IDs use Math.random, audit actor names are strings. No fetch/database/auth/file service exists. UI permission helpers and assigned-house filters are bypassable.
- GPS results and coordinates are invented. Eligibility hardcodes 30 minutes while policy remains undecided. Clock-out policy is provisional and does not persist location evidence. Success toasts are local updates, not persisted attendance.
- Diary, records, drafts, template publication/assignment, correction review, house/staff/client/shift CRUD, concerns, notices/read state, leave and settings are local mutations. Inspecting these controls does not establish immutable history, concurrency safety or backend enforcement.
- Uploads create browser object URLs or retain filenames; no durable/private upload, authorised download or malware/type/size enforcement. Removal permissions are browser checks. CSV exports work against demo arrays, not server reports. Some contact/review actions only alert/toast. Loading indicators use timers.
- Store models: Field/Column/Condition/Section, Template/Draft/Version/Assignment, CareRecord/Values, DiaryEntry/Category, Correction, House, Client/Contact, Shift/Attendance, Notice, Concern, FileItem, Leave, Staff/PermRole, AuditEntry, ProfileField, Org. Organisation ID boundaries, trusted users/sessions, relational grants/assignments, durable attachment metadata, per-user reads, immutable corrected record versions and DB constraints are absent. Treat types as design evidence, not a database schema.
- Formatting uses en-NZ but often browser timezone, seed dates are relative to browser clock. Future timestamp services must explicitly use Pacific/Auckland and UTC storage.

## Bootstrap boundary

Port only safe login presentation and application chrome at this checkpoint, with explicitly labelled local fictional read-only shift fixtures and placeholders. Do not silently reactivate the old UI or run the entire export as a competing client app. No full-screen parity claims without screenshots/browser review at 390/1280/1440. Staff migration is the next phase, before backend services.
