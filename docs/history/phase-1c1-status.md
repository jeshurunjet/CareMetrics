# Implementation status — Phase 1C.1

Phase 1C.1 adds Client and House Diary history, details, entry forms, own drafts and staff correction requests to the existing **development-only Staff UI**. No backend service is connected. [Phase 1A](phase-1a-status.md) and [Phase 1B](phase-1b-status.md) checkpoints preserve earlier scope and verification.

Git checkpoint: `0398957` on `main` already contains completed Phase 1A/1B. Pre-existing untracked duplicate screenshots were left untouched. Phase 1C.1 is being published as a separate Git checkpoint at the user’s request; local reference sources and unrelated duplicate screenshots are excluded.

Statuses: `original` = reference retained; `ported` = adapted; `UI-matched` = inspected against rendered source, with documented differences; `tested` = relevant checks passed; `backend-connected` = authorised persistent services; `blocked` = external integration/decision required. Visual review is not independent designer approval.

| Area | Status | Evidence and limits |
| --- | --- | --- |
| Login, My Shifts, Dashboard | ported, UI-matched, tested | Existing Phase 1A screens and no-clock-in dashboard path retained. Only the demo attendance toggle now shares its UI state with diary forms. Real attendance remains disabled. |
| Houses, profiles, Contacts/NOK, Search | ported, UI-matched, tested | Phase 1B functionality retained; diary tabs now show actual migrated history. Other documentation destinations remain placeholders. |
| Client and House Diary History | ported, UI-matched, tested | Separate subject-scoped lists, source expandable cards, newest first, author/submission metadata, title/body/author search, category/date filters, six-record pagination, empty state and own drafts. |
| Diary Details | ported, UI-matched, tested | Source-derived metadata/content card with separate covered/created/submitted timestamps, author, category, status and off-shift reason. Full-page view extends the source inline detail. Seeded direct links survive refresh. |
| New Diary / Drafts | ported, UI-matched, tested | Planned client/house entry routes, fixed subject/author, adapter categories, required validation, NZ covered time, own-draft editing, save/submit/cancel and unsaved-change confirmation. Session-only updates reset on reload. |
| Corrections | ported, UI-matched, tested | Own submitted records can request a separate pending correction with original content, reason and proposal. Original entry remains unchanged. No staff review/approval or unrestricted submitted edit/delete operation. |
| Development adapter/provider | ported, tested | Existing typed snapshot extended with diary/category/correction/demo-attendance fields; shared provider holds session changes. Subject/assignment, draft ownership and correction rules are demonstrated, not authenticated security. |
| Shared shell and Admin CMS | prior ported, tested | Shared responsive Staff chrome retained. Admin remains a separate desktop-only preview shell; its implementation is unchanged. |
| Styles and reference | original, tested | Three source CSS copies and all 51 extracted archive files remain byte-identical. Scoped accessibility/wrapping/mobile-action fixes are in bootstrap CSS. No dependencies or font binaries added. |
| Preview isolation | ported, tested | Server development opt-in remains required; production refuses 20 preview URLs, including diary history/new/details/correction/unassigned subjects, even with the flag enabled. |
| Care Plan, Charting, Gallery, remaining Staff/Admin workflows | original / placeholders | Not implemented in this phase. Photo/concern controls remain preview-only. |
| Auth.js / permissions / Prisma / Neon / files / GPS | blocked, not implemented | No production identity, organisation/role/house enforcement, persistent records, private uploads or attendance verification. Only fictional data is present. |
| Deployment and operational approval | blocked | No Vercel deployment, privacy/security acceptance or production approval performed. |

No feature is `backend-connected` or production-ready.

## Verification

| Check | Result |
| --- | --- |
| `pnpm lint` | PASS, zero warnings |
| `pnpm typecheck` | PASS, strict source/tests and canonical generated Next route types |
| `pnpm format:check` | PASS |
| `pnpm test` | PASS, 33 unit tests across four files |
| `pnpm test:e2e` | PASS, 120 cases (24 × five widths), including all prior Phase 1A/1B cases |
| `pnpm build` | PASS, production webpack build including both new diary form routes and Admin |
| `pnpm test:production` | PASS, 20 routes refuse production requests with preview enabled; no fixture content exposed |
| Source integrity | All archive/reference files and active source CSS checked unchanged |
| Visual review | PASS, captured 100 raw images and inspected 15 paired boards across five widths; intentional details/correction extensions documented |

Unit coverage includes separate/scoped histories, newest-first order, category/date/search/pagination, draft ownership and editing, validation, off-shift vs demo-active attendance, separate correction requests, unchanged originals, forbidden correction cases, absence of staff approval operations and NZ daylight-saving wall times. Browser flows cover client/house creation, drafts, submitted read-only state, correction status, off-shift reasons, details/direct URLs, missing/wrong-subject/private records, contextual navigation, unsaved changes and all preceding Phase 1A/1B cases at 375, 390, 768, 1280 and 1440px.

## Limits and next step

- Mock entries, drafts, corrections and demo attendance live only in the current Staff React session. Reload/remount resets them. Seeded links resolve again; session-only IDs show unavailable. The UI explains this before entry creation.
- Unknown/unassigned subjects fail server validation with 404. Invalid diary IDs within an authorised profile show a generic unavailable view with HTTP 200. The fixed employee's scoped snapshot is serialised for the preview; no authenticated access service exists.
- Submitted content is read-only in this UI; this is not immutable database history. Review decisions, corrected versions, durable audit, concurrency, transactions and organisation/role security remain future work.
- Browser Back/navigation confirmation and reload prompts are demonstrated in Chromium. No physical-device, mobile keyboard, Safari/Firefox or exhaustive accessibility certification is claimed. Original fonts/photos still need availability/licence/privacy review.
- Host checks use Node 25.9.0/pnpm 10.15.1; Node 22 LTS CI verification remains outstanding. Existing webpack/Turbopack and tooling limitations remain documented in Phase 0.

See [route map](../route-map.md), [migration notes](../ui-migration-notes.md) and [Phase 1C.1 visual evidence](../ui-comparisons/phase-1c1/). After diary review, the recommended next task is a bounded **Care Plan/Assessments UI migration** using the original configurable-template screens. Do not automatically proceed to Charting, Admin, authentication or database integration.
