# Phase 1E.4A record-review comparisons

Original export is left; migrated application is right. Final evidence contains **90 raw PNG captures and 15 paired boards**, across all six widths; all boards were visually reviewed. Complete results are in [implementation status](../../implementation-status.md).

## Comparison index

| Group | 1280px | 1440px | 1600px |
| --- | --- | --- | --- |
| Submitted / Client Diary / House Diary | [1280px](comparison-1280-lists.png) | [1440px](comparison-1440-lists.png) | [1600px](comparison-1600-lists.png) |
| Care Plan / Charting / repeating-table details | [1280px](comparison-1280-details.png) | [1440px](comparison-1440-details.png) | [1600px](comparison-1600-details.png) |
| Queue / text / field / cell comparisons | [1280px](comparison-1280-review.png) | [1440px](comparison-1440-review.png) | [1600px](comparison-1600-review.png) |
| Confirmations / effective record / focused history | [1280px](comparison-1280-decisions.png) | [1440px](comparison-1440-decisions.png) | [1600px](comparison-1600-decisions.png) |

Narrow notices: [375px](comparison-375-desktop-notice.png), [390px](comparison-390-desktop-notice.png), [768px](comparison-768-desktop-notice.png).

## Method

The original Docs.tsx SubmittedRecords, separate Client/House Diary tables, RecordDetail, Corrections and CorrectionReview are rendered by the existing ignored reference harness. Original JSX/CSS files are not edited. Comparison fixtures adapt the same fictional snapshot; dedicated original-side review requests are created using the actual pure Staff request operations. Source and migrated initial lists/queues use their normal initial fixtures; comparison review states then use matching requested records/reasons/proposals. Actor IDs and underlying original versions/values agree.

Time is frozen to 22 October 2026 in Pacific/Auckland, source remote fonts are loaded, and test-only external photos/map tiles are deterministic. No font binaries or real information are included. Staff-created requests in migrated captures travel through the actual Staff UI and existing shared snapshot, not a separate Admin fixture.

## State mapping

| Group | Captures |
| --- | --- |
| Lists | Submitted Records overview, Client Diary filter versus original Client diary tab, House Diary filter versus original House diary tab |
| Details | Skin Integrity original v1 while v2 exists, Exercise Chart, Equipment Register read-only multirow table |
| Review | Pending queue, text replacement, original-version structured field, stable table-cell correction |
| Decisions/history | Approve confirmation, Reject confirmation, approved effective record/history, focused decision-history metadata |
| Narrow | Desktop-only notice at 375/390/768px |

Desktop widths: 1280/1440/1600px. Fourteen original/migrated states at three desktop widths plus paired notices at three narrow widths produce the 90 raw PNGs and 15 paired boards in this completed set. Raw names are `width-{width}-{original|migrated}-{state}.png`. Comparison boards group Lists, Details, Review and Decisions, plus one narrow board per width.

## Findings and intentional differences

Typography, palette, Admin chrome, card/table/filter/compare/modal patterns and desktop-only presentation follow the export. Original source CSS remains unchanged. Source SubmittedRecords lacks the brief's summary cards/search/custom date range/full IDs, so these additions increase height. Client/House diary use the common type filter to keep one management list, while preserving distinct subjects. Wide tables scroll within their panels so full identifiers, dates, statuses and detail links remain reachable.

Record Details retains original context/answer cards, adding Created time, current-house and author links, explicit Original/Effective controls and revision history. The shared Staff read-only renderer provides exact-version labels/options/columns, row semantics and date formatting instead of flattened answers. Source file chips guessed from timestamp proximity are omitted because the application has no reliable record-attachment relation or secure file service.

Review keeps the original two-column layout. It adds baseline IDs, full original answers/tables, stable field/row/column differences and validated effective preview. The source omits table answers in its correction comparison; its panel geometry is the nearest reference for the new cell workflow. Full diary replacement is explicitly labelled with del/ins rather than the source's unbounded quadratic word-diff matrix. Original and proposed meanings remain readable without colour. Extra metadata/answers make panels taller and the Review actions scroll lower.

The source changes a request's outcome only. The migrated approved state additionally derives corrected effective content and preserves original/revision disclosures, reviewer/time/notes and a traceable revision chain. The source Correction history/Audit timeline is the nearest presentation reference for these new guarantees, not proof that source behaviour provides immutable effective values. Controlled removal is disabled; no deletion, production audit or file management is activated. Confirmations explain session-only consequences. The inherited narrow action says Back to sign in instead of the source's Sign out.

## Verification limits

Captures support representative source fidelity with these documented extensions, not exact pixel parity or independent design approval. Functional tests exercise the Staff-to-Admin review workflows; unit tests cover immutable originals, invalid references/values, permissions, projection/merge, equal-time revision chains, conflicting approvals and current event time. Earlier capture selector/readiness mistakes and the source-edit-contaminated full run are superseded, not passing results.

Firefox's existing host profile-folder launch failure remains unresolved. Safari, physical devices, exhaustive accessibility and organisational acceptance are unverified. All mutations remain fictional/session-only; no trusted authentication, persistence, secure uploads, production audit or deployment is implied.

## Final results

Source-frozen Chromium: complete five-width suite **597 passed / 108 intentional narrow Admin skips**; final six-width Admin suite **156 passed / 108 intentional skips**, including 1600px. The full suite retains every earlier Staff/core/workforce/builder assertion. Node 22.23.4/pnpm 10.15.1 also passes lint/types/format, 340 units, production build and 128 distinct production-isolation routes. Source/reference integrity and all 333 frozen source/test/tooling hashes pass; nine restricted fixture markers are absent from 132 production client chunks. Canonical types are restored after browser servers stop. No migrated capture page errors or document overflow were collected. No exact parity, broader browser/device or production-readiness claim is made.
