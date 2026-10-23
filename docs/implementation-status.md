# Implementation status — Phase 1D.3

Staff Notifications and Concerns extend the existing development-only application through one snapshot/provider. No notification delivery, real management review or backend is connected. Earlier status: [Phase 1D.2](history/phase-1d2-status.md).

## Checkpoint

Completed Leave is preserved at local commit `2714eaf` on `phase-1d2`. Baseline lint, strict types, formatting, 91 unit tests, all 50 Leave browser cases, build and 56 production-isolation checks passed again; the earlier full 375-case result remains documented. Current work is isolated on new local `phase-1d3`. References, prior branches and unrelated duplicate screenshots are preserved. No reset/discard/push.

| Area | Implementation and boundary |
| --- | --- |
| Notifications | All/Client/House/Staff source tabs, newest-first scoped notices, search/date/unread filtering, preview/full details and safe bundled example attachment. |
| Read state | Employee-specific timestamps; opening authorised details marks own read idempotently. Dashboard, header/sidebar/mobile badges and overview use current shared state. No source Mark Unread control. |
| Concern submission | Source modal/fields/priorities with required context/assigned target/title/description, derived employee and field errors; High guidance and unsaved-change protection. |
| Files | Existing provisional file policy and FileRecord associations; optional metadata selection/removal and honest unavailable post-submit preview. No upload or retained contents. |
| Own concern history | Search/status/context/date filters, newest first, Submitted/Under Review/Resolved/Closed fixtures and read-only details with staff-visible responses. |
| Profile/Dashboard integration | Shared official notices on Dashboard and exact Client/House contextual lists, separate own concerns, view-all, preselected forms and authorised profile links. |
| Access demonstration | Audience and exact category/subject checks on broad snapshots, own concern reads/writes, explicit internal-note projection and filtered server preview snapshot. This is not trusted authentication/authorisation. |
| Production isolation | Every preview route remains refused in production, even when opted in; login remains inert. Admin desktop gate/content boundary unchanged. |

## Verification

Status: ported, UI-matched with documented extensions, and tested within these boundaries. No feature is backend-connected.

| Check | Result |
| --- | --- |
| Lint / strict types / formatting | PASS |
| Unit tests | PASS, 120 across ten files |
| Focused Notifications mobile browser run | PASS, 12 cases including source captures, long text and no page overflow |
| Corrected transition checks | PASS, ten cases across all five widths |
| Full browser regression | PASS, all 435 cases across five widths; all prior 375 cases retained |
| Visual evidence | PASS, 120 raw captures and 20 paired boards; all five widths inspected |
| Local preview | PASS, Notifications history/new/details HTTP 200 on port 8443 |
| `git diff --check` | PASS |
| Production build | PASS |
| Production-isolation tests | PASS, 68 preview routes refused; login inert |
| Source integrity | PASS, 51 reference files and three original CSS copies byte-identical |
| Production client chunks | PASS, private notice/concern/internal-note markers absent |
| Node 22 | Not available in checked Homebrew/mise/nvm locations; host Node 25.9.0/pnpm 10.15.1 |

The final complete run passed all 435 cases in 9.9 minutes. Earlier verification exposed a source-capture hydration mismatch during live editing and two navigation timing failures; after guarding completed submission and waiting for confirmed route/render transitions, all ten targeted cases and the entire regression pass. No existing content/access assertion was removed or weakened. All final migrated comparison states report no collected page errors or unintended page-level horizontal overflow. Source typography, colours, navigation, cards, forms and modal language remain; filters/metadata/preview guidance/new details intentionally add height. Source limitations and nearest-reference states are explicit; exact pixel parity is not claimed.

## Limits and next step

Identity, permissions, fixtures, read state, concern creation and reviewed statuses remain development-only. Provider changes reset on reload; seeded details survive refresh. Missing/private notice or concern IDs show generic unavailable content (HTTP 200); malformed selectors and inaccessible profile/context IDs return 404. No real management delivery, emails/push/SMS, realtime/emergency escalation, Auth.js, Prisma/Neon persistence, private Blob uploads, durable audit, management publishing/review or clinical decision service was introduced.

No UI implementation blocker remains for review. Physical devices, Safari/Firefox, exhaustive accessibility, intended Node 22 CI and independent design/organisational policy acceptance remain outstanding. Review this bounded Staff phase, then agree the next Staff UI scope; Profile/Settings is a possible next migration. No Phase 1D.4, Admin or backend work starts automatically. The user subsequently authorised committing and publishing the completed full application on `phase-1d3`. Earlier branches remain preserved; reference files, secrets, generated output and unrelated duplicate screenshots are excluded.

See [notification contracts](notifications-and-concerns.md), [routes](route-map.md), [migration notes](ui-migration-notes.md) and [visual evidence](ui-comparisons/phase-1d3/README.md).
