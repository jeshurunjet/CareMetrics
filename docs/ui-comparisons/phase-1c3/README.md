# Phase 1C.3 visual evidence

90 raw screenshots (nine views × original/migrated × five widths) and 15 paired boards at 375, 390, 768, 1280 and 1440px; viewport height 900. Original appears left; migrated right. Desktop board columns scale to 720px; raw captures preserve resolution.

- `comparison-[width]-overview.png`: assigned categories, structured Bowel history and numeric Exercise chart.
- `comparison-[width]-forms.png`: new entry context, two editable equipment rows and validation state.
- `comparison-[width]-records.png`: partial draft, submitted read-only equipment rows and correction request.

The original export is rendered with the same fictional snapshot, adapted table columns/row values and Charting metadata. Original source/JSX/CSS are unchanged. The source uses eight history rows and draft-first ordering; migration uses the required six rows and newest submission/creation first. Source details/corrections are modals; migrated views extend the established full-page pattern. The original history can overflow at mobile widths; the migration confines scrolling to labelled table regions. Source overflow is retained rather than changing reference CSS.

Added warnings, assigned versions/actions, status/metadata, row identity/focus/error details, structured correction targets and numeric data-table alternative are documented extensions. Reference tiles retain source text without typical-range emphasis or clinical advice. Row inputs retain full editable text through native input scrolling; submitted cells wrap and remain accessible through horizontal table scrolling. Source validation outlines whole tables; migrated validation highlights the relevant cells and identifies row/column errors. Validation captures focus the second row's missing acquired date; other capture states wait for the source's temporary error toast to expire.

Frozen time: 2026-10-22T01:00:00Z. Photos/tiles use identical deterministic test substitutes; source fonts remain remotely loaded. Captures hide development overlays and reset automation-induced outer scrolling. The test-only harness/cache is excluded from deployment. No exact pixel threshold, independent design sign-off, physical-device keyboard verification, Safari/Firefox or clinical acceptance is claimed. See [migration notes](../../ui-migration-notes.md) and [form contracts](../../configurable-forms.md).
