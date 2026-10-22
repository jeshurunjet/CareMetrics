# Phase 1C.1 visual evidence

100 raw original/migrated captures (10 views × two implementations × five widths) and 15 side-by-side boards. Widths: 375, 390, 768, 1280, 1440; viewport height 900. Original is left and migrated is right. Desktop boards scale columns to 720px; raw PNGs retain original resolution.

- `comparison-[width]-history.png`: client and house history lists.
- `comparison-[width]-forms.png`: client and house entry fields/actions.
- `comparison-[width]-details.png`: original expanded history vs new standalone details, then original correction modal vs new full-page correction.
- Raw captures also include profile/history context and create-form context/off-shift notice.

Frozen time: 2026-10-22T01:00:00Z. Fictional scoped adapter records are adapted into the original store shape by the test-only reference renderer. Remote photos are substituted only in tests. Native controls/font rendering depend on this host; development-tool overlays are hidden. These are reviewed source-rendering comparisons, not Figma screenshot acceptance or an automated pixel threshold. See [migration notes](../../ui-migration-notes.md) for intentional differences and missing reference states.
