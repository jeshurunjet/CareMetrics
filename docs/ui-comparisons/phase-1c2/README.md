# Phase 1C.2 visual evidence

120 raw screenshots (12 views × original/migrated × five widths) and 20 paired boards at 375, 390, 768, 1280 and 1440px; viewport height 900. Original appears left and migrated right. Desktop board columns scale to 720px; raw PNGs retain their original resolution.

- `comparison-[width]-overview.png`: assigned categories and assessment history.
- `comparison-[width]-forms.png`: Skin Integrity controls and conditional questions.
- `comparison-[width]-examples.png`: Medical Cares numeric fields/conditional section and Medication Receipt date/time fields.
- `comparison-[width]-records.png`: draft editing, submitted record and correction request.

Raw captures also include full category/profile context and new-form context/author/off-shift information. The source has inline details and a correction modal; migrated full-page views are intentional extensions. Source history pins drafts first, while migration follows the required newest-first order. Source forms do not apply configured defaults on new entries; the migration does. Photo/table variants are expressly unavailable in the migrated UI. See [migration notes](../../ui-migration-notes.md) and [form model](../../configurable-forms.md).

The reference renderer adapts the same fictional typed configuration/snapshot into the original JSX/store shape. This compares source presentation, not clinical standards or production functionality. Frozen time: 2026-10-22T01:00:00Z. Photos and map tiles are deterministic test substitutes, development-tool overlays are hidden, original fonts remain remotely loaded. Focused captures scroll within the application content; outer hidden-ancestor scrolling introduced by browser automation is reset before capture.

No automated pixel threshold, exact-pixel match, independent design acceptance, physical-device keyboard verification or Safari/Firefox certification is claimed. All comparison code/cache lives outside the deployed app; original files and source CSS remain unchanged.
