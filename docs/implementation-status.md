# Implementation status — Phase 1D.4

Profile and Settings complete the planned main Staff UI migration as a fictional development preview. Staff modules share one snapshot/provider and stable domain identifiers. No feature is backend-connected or production-ready. See the [Staff completion review](staff-ui-completion-review.md) for the route, placeholder, permission and integration inventory; prior status is archived under [Phase 1D.3](history/phase-1d3-status.md).

## Checkpoint

Phase 1D.3 was already committed/pushed as `cba43ca`; the brief's uncommitted note was stale. Its lint, strict types, formatting, 120 unit tests, all 60 Notifications browser cases, build and 68 production-isolation checks passed again before this phase. Its prior complete 435-case result remains documented. Work is isolated on local `phase-1d4`. Previous branches/reference/CSS/screenshots and unrelated duplicate images remain preserved. No reset/discard or remote push.

| Area | Implementation and limit |
| --- | --- |
| My Profile | Source header/avatar/employment/contact layout; current fictional employee, preferred name where available, status/security display and shared assignment links. |
| Own contact editing | Source inline phone/address/emergency form, field validation, focus/discard handling and session-only feedback. Unknown/locked fields reject the mutation. |
| Managed identity | Name/preferred name, employee ID, role, email, account status, dates, permissions and house/roster assignments remain read-only. No other employee route/editor. |
| Privacy projection | Private coworker contact/account profile fields are removed before snapshot serialisation. Existing operational employee/house/shift references remain. |
| Temporary photo | Existing picker/policy/hook reused; provider-owned staff display URL shared across Profile/Dashboard/sidebar/menu and revoked on replacement/session unmount. No upload or attachment write. Client/House lifetime unchanged. |
| Settings | Intended source Coming Soon plus Dashboard return; no security/Admin/delivery preferences. |
| Navigation | All nine main destinations, existing module/context links, active mobile menu, source-styled wrapping and one continuous core Staff journey. Optional framework dev indicator no longer blocks mobile Home. |
| Account security | Explicitly unavailable; no password change/reset email, fake OTP/2FA, role escalation or trusted authentication added. |

## Verification

The complete Chromium regression passed. Results below are from Node 22.23.4/pnpm 10.15.1 unless marked baseline. An isolated runtime was obtained without changing system Node (host remains Node 25.9.0).

| Check | Result |
| --- | --- |
| Lint, strict TypeScript, formatting | PASS, zero lint warnings |
| Unit tests | PASS, 150 across 11 files, retaining prior 120 |
| New five-width feature suite | PASS, 50 cases including continuous journey, photos/cleanup, editing, navigation and source comparisons |
| Final complete Chromium regression | PASS, all 485 cases (435 existing + 50 new), 9.1 minutes |
| Final capture timing refresh | PASS, five width cases after test-only image/scroll/toast timing correction |
| Visual/source integrity | 90 raw PNGs + 15 boards; 51 reference files and three original CSS copies unchanged; no private profile markers in production chunks |
| Existing local preview | HTTP 200 for Profile, Edit, Photo and Settings (existing host runtime) |
| Production build | PASS |
| Production-isolation tests | PASS, 74 preview routes refused even with flag enabled; login inert |
| Node 22 | Full static/unit/build/isolation and all 485 browser cases passed on isolated 22.23.4 |
| Firefox smoke | BLOCKED before application execution: local Firefox launch reports `Could not find profile folder`; default and canonical temporary paths both attempted. No Firefox application pass claimed. |

## Limits and next step

All identity/access/records/approvals/delivery remain fictional development state. Contact edits, drafts/submissions/corrections/concerns/reads/files/photos reset on reload/provider remount as documented. Real attendance/GPS, Auth.js, Prisma/Neon, private Blob storage, notification delivery, management review, durable audit and production deployment remain unimplemented. Settings is intentionally Coming Soon; remaining placeholders and service boundaries are inventoried in the completion review.

Broader Firefox, Safari/WebKit, physical iOS/Android, exhaustive accessibility, independent design acceptance, external asset review and organisational privacy/security/policy/operational approval remain outstanding. Review the completed Staff reference, then agree the first bounded desktop Admin CMS migration. No Phase 1E, backend or deployment starts automatically. Work remains uncommitted on `phase-1d4`; nothing was pushed.
