# Phase 1E.4B representative visual evidence

**37 raw PNGs and 9 paired boards**, reviewed after the final frozen-source Admin run. Original is left, migrated is right. This deliberately smaller set preserves previous phase evidence without repeating every new state at every width.

| Width | Evidence |
| --- | --- |
| 1280 | File directory, details and removal confirmation; official notification directory, client-audience editor and publish confirmation; concern queue/review; reports and audit (20 raw captures, 4 boards) |
| 1440 / 1600 | File directory and concern review (8 raw captures, 2 boards) |
| 375 / 390 / 768 | Original desktop-required notice (6 raw captures, 3 boards) |
| Mobile Staff | Actual same-session file removal (390px), client notice publication (375px), concern resolution/author response (390px): 3 captures |

## Source mapping

All Admin references are the untouched `reference/figma-export/admin/pages/Governance.tsx`: FilesPage/FileDrawer, NoticesPage/NoticeForm, ConcernList/ConcernReview and ReportsPage/Reports/AuditLog. Core Drawer/ConfirmDialog/Panel/table styles and the existing Admin shell are reused. Staff integration captures exercise the actual migrated shared Gallery, contextual NoticeList and ConcernDetails, not a separate fixture app.

The ignored test renderer copies source files without editing originals, supplies the same fictional full snapshot, and now supplies the original Remove files/Publish notices/View audit log permissions to its test fixture. The comparison uses 22 October 2026 NZ frozen time, source remote fonts, actual harmless local gallery assets and deterministic external photo/map substitutes. No font binaries or real information are included.

## Findings and intentional differences

Typography, palette, source shell, table/card/filter controls, message/side-preview grid, drawer/modal geometry and two-column concern review are retained. Added filters and preview/permission/history explanations increase height. Tables retain readable minimum widths with contained horizontal scrolling; extra Actions/reviewer columns remain reachable. An early squeezed reviewer cell was corrected before the frozen runs. The notice textarea retains the source's seven rows.

Source File Directory incorrectly includes a notification-parent attachment under its all-scope view; the migration lists only explicit client/house galleries, so that unrelated row is intentionally absent. Human-readable MIME/byte sizes and genuine demonstration downloads replace ambiguous type text and simulated download success. File confirmation names the parent and explains logical removal/retained metadata rather than claiming durable audit or object deletion.

The notice editor adds explicit audience configuration and publication confirmation; existing contextual organisation audiences display their effective parent scope. Published editing is blocked and withdrawal is controlled. Secure new notice attachments remain unavailable. Source reference Save Draft opens its own stale dirty-navigation confirmation; the capture harness handles that dialog without modifying source.

Concern review adds separately labelled internal notes, author-visible responses/outcomes and retained development events. Reports replace unsupported analytics with the requested bounded fictional summaries; different source totals include client-only Diary versus the migrated Client/House summary and the source's simulated attendance rules. Audit displays only actual supplied metadata/session mutations, so its rows differ from the source fixture. It explicitly rejects durable/immutable/legal-audit claims; unsupported exports are disabled Future Development controls.

The mobile concern capture shows the original description, Resolved status and author-visible response together; internal management text is absent. The client capture shows the new notice in its own authorised context. The gallery capture shows six retained files after removal of the original seventh file; functional tests additionally filter the removed filename and assert it is unavailable.

All final capture cases report no migrated page errors or document-level overflow. Nine paired boards and the three mobile images were visually inspected. This is representative Chromium/source fidelity with documented extensions, not exact pixel parity, independent design approval, exhaustive accessibility or physical-device/Firefox/Safari acceptance.
