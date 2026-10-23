# Phase 1E.1 Admin core comparisons

Source left, migration right. Test-only rendering uses untouched `reference/figma-export/admin` components and the same full fictional snapshot, adapted to the original store's view shape. Clock is frozen at 22 October 2026; browser display timezone is Pacific/Auckland. External photo/map requests receive identical deterministic test substitutes; original remote font CSS remains. No original source/CSS/asset or font binary is changed/copied.

Fifteen desktop states at 1280/1440/1600px cover Dashboard, Employee Directory/Create/Edit/Details/Assignments, House Directory/Create/Edit/Details, Client Directory/Create/Edit/Details and Contacts/NOK Editor. At 375/390/768px, both sides capture the approved desktop-only message. Final evidence contains 96 raw PNGs and 18 paired boards.

| Width | Overview / Employees / Employee details | Employee create/edit/assignments | Houses/create/edit | House details / Clients / Client details | Client create/edit/NOK |
| --- | --- | --- | --- | --- | --- |
| 1280 | [Board](comparison-1280-overview.png) | [Board](comparison-1280-employees.png) | [Board](comparison-1280-houses.png) | [Board](comparison-1280-clients.png) | [Board](comparison-1280-forms.png) |
| 1440 | [Board](comparison-1440-overview.png) | [Board](comparison-1440-employees.png) | [Board](comparison-1440-houses.png) | [Board](comparison-1440-clients.png) | [Board](comparison-1440-forms.png) |
| 1600 | [Board](comparison-1600-overview.png) | [Board](comparison-1600-employees.png) | [Board](comparison-1600-houses.png) | [Board](comparison-1600-clients.png) | [Board](comparison-1600-forms.png) |

Narrow fallback: [375px](comparison-375-desktop-notice.png), [390px](comparison-390-desktop-notice.png), [768px](comparison-768-desktop-notice.png).

## Preserved source and intentional extensions

Source sidebar/topbar/typography/palette/cards/borders/shadows, table/forms/grid patterns, entity headers, house cards/list, employment/contact key values, assignment picker, inline NOK editor, tabs and desktop-only breakpoints are reused. Semantic URL links replace stack buttons while retaining source nav geometry/active marker. Source CSS copies remain unchanged; extensions are scoped to Admin. Existing Staff layouts have their earlier comparison evidence rather than a duplicated full screenshot set here.

Preview warnings add vertical space. Account controls describe fictional role/status, unavailable invitation/reset and no real session changes; the source invitation checkbox/secure-invite claims are not reactivated. Brief-required address/emergency/status fields extend Employee forms. Descriptions/summaries retain multiline inputs; NZ calendar dates retain local date formatting. House images stay landscape. House location retains the map/fields split using the existing SSR-safe read-only house map; source simulated geocoder, draggable/click-to-pick location and verification/radius claims are deliberately unavailable or provisional. Blank location remains unconfigured instead of defaulting to a claimed verified point. New-house photo uses a harmless bundled demonstration image rather than another house's remote photo.

Dashboard separates shift status from fictional attendance; columns remain readable in an explicitly bounded table scroll area. Pending queues/totals use shared domain records. Recent development activity is derived from existing submissions; the reference fixture has no audit events, so its Recent activity card is empty. These activity/table/preview additions increase Dashboard height. Open attendance event counts do not imply verified current GPS attendance. Future management links open labelled placeholders, not fake editors/review successes.

Contacts have stable IDs, explicit labels/validation and important-contact removal warnings. Single-primary and multiple-emergency rules are explicit; transfers have their own tab/two-step confirmation instead of silently changing house in Edit. Future detail tabs show bounded shared summaries instead of porting out-of-scope builders/review/file removal. Picker preview/cancel/temporary application reuses the established component; source direct file inputs apply immediately without cleanup. Restricted states and these additional workflows use the same design language but are not exact source states.

Source employee forms auto-suggest identifiers and start dates; migration leaves them explicit and validates unique values. Source manager/role permissions and secure-action success claims are browser simulation only. Original screenshot controls remain reference evidence, never deployable functionality. Reuse does not imply production account provisioning, secure uploads, verified location, approval or durable audit.

Migrated captures assert document bounds and collect page errors. Visual evidence is Chromium viewport emulation, not exact pixel parity, independent design acceptance, exhaustive accessibility or physical-device/Safari certification. Final results and unresolved browser limitations are in [implementation status](../../implementation-status.md).

## Final verification

All six strengthened capture cases pass after waiting for the named screen/form/modal, image readiness and font readiness; comparisons no longer capture the previous route during navigation. Visual review restored source form spacing, House field order/manager selector, alert colour, status badge and empty avatar. No original CSS was changed. Final Admin suite: 57 passed, 45 intentional narrow management skips. Complete five-width regression: 525 passed, 45 intentional narrow Admin skips, retaining all 485 previous Staff cases. Original reference integrity and production build/isolation (92 URLs) pass. The Admin-only presentation corrections after the full run are covered by the final six-width Admin suite and refreshed evidence.

Table differences include explicit View details actions in place of relying solely on clickable rows and omission of unsupported trusted last-activity claims. Date strings reuse existing NZ formatting (long month names on some details). Source's cancelled-shift counting limitations and empty audit fixture are retained in its reference view; migrated schedule counts exclude cancelled assignments and activity is explicitly derived development data. The narrow notice returns to sign-in rather than claiming an authenticated sign-out. These are documented comparison differences, not exact pixel parity.
