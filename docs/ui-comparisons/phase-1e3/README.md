# Phase 1E.3 visual evidence

132 raw PNG captures and 24 paired comparison boards. Source is left; migrated application is right. All 24 boards were visually inspected, including the desktop-only notices and the final focused editors. Representative submitted Care Plan and Charting records were also inspected; Charting retains the configured read-only column labels and values.

## Paired board index

| Group | 1280px | 1440px | 1600px |
| --- | --- | --- | --- |
| Overview, categories, Care Plan library | [1280px](comparison-1280-navigation.png) | [1440px](comparison-1440-navigation.png) | [1600px](comparison-1600-navigation.png) |
| Charting library, empty draft, populated builder | [1280px](comparison-1280-structure.png) | [1440px](comparison-1440-structure.png) | [1600px](comparison-1600-structure.png) |
| Field properties, conditions, table configuration context | [1280px](comparison-1280-properties.png) | [1440px](comparison-1440-properties.png) | [1600px](comparison-1600-properties.png) |
| Mobile preview, validation, publish confirmation | [1280px](comparison-1280-lifecycle.png) | [1440px](comparison-1440-lifecycle.png) | [1600px](comparison-1600-lifecycle.png) |
| Version history, client assignment | [1280px](comparison-1280-versions.png) | [1440px](comparison-1440-versions.png) | [1600px](comparison-1600-versions.png) |
| Resulting Admin-created Staff Care Plan and Charting forms | [1280px](comparison-1280-staff.png) | [1440px](comparison-1440-staff.png) | [1600px](comparison-1600-staff.png) |
| Focused option, condition and table-column controls | [1280px](comparison-1280-editors.png) | [1440px](comparison-1440-editors.png) | [1600px](comparison-1600-editors.png) |

Narrow notices: [375px](comparison-375-desktop-notice.png), [390px](comparison-390-desktop-notice.png), [768px](comparison-768-desktop-notice.png).

## Capture inventory and method

- Six widths: 375, 390, 768, 1280, 1440 and 1600px.
- Sixteen requested representative states × original/migrated × three desktop widths: 96 captures.
- Three focused editor states × original/migrated × three desktop widths: 18 captures.
- Original/migrated narrow notices at three widths: six captures.
- Resulting Staff fields and submitted records for Care Plan/Charting at three desktop widths: 12 additional captures.
- Seven board groups at three desktop widths plus three narrow boards: 24 boards.

Raw names use `width-{width}-{original|migrated}-{state}.png`. Additional migrated Staff states use `staff-care-fields`, `staff-care-record`, `staff-chart-fields` and `staff-chart-record`. They show actual forms configured/published/assigned through Admin and completed in Staff, without category-specific React pages. [Example Care Plan record](width-1600-migrated-staff-care-record.png) and [Charting record](width-1600-migrated-staff-chart-record.png).

The ignored reference harness copies the unchanged original export into `.ui-reference`; Next does not import that source. Test fixtures supply fictional source-adapted identities/relationships and the existing Configure care templates preview permission. Time is frozen to 22 October 2026 in New Zealand. Original remote fonts are loaded; test-only external images/map tiles are deterministic. Source and migrated publication toasts are allowed to settle. The source's nearest seeded Staff questionnaires provide visual patterns for the newly configured forms; questionnaire content is intentionally different. No production data is used.

## Findings and intentional extensions

Typography, brand colours, source cards/tables/tabs, navigation, desktop layout and narrow notice remain consistent with the original. Original Docs.tsx/Builder.tsx and Admin core patterns are adapted into modular components; original CSS files are unchanged. Small scoped additions live in admin-migration.css.

The source three-panel editor geometry is retained, with selectable structure in the left panel and the required live Staff renderer in the centre. Explicit stable option values, defaults, metadata, validation links, keyboard reorder controls and broader supported table properties increase panel height. Focused editor boards show those scrollable controls. Mobile and desktop preview modes use the existing Staff renderer; Admin itself remains desktop-only.

Requested overview counts, assignment navigation, explicit Save Draft/Validate/Publish, immutable version history and version-specific assignment controls extend the source prototype. Source automatic save/automatic assignment rollout is replaced by explicit session actions; new publication never changes assignments silently. The source assignment modal is compared with the new filterable assignment table and explicit version actions. Submitted history preserves original version labels, option labels and category names instead of relabelling old records.

Staff screenshots contain the existing development/off-shift disclosures and off-shift reason, increasing the vertical space above the configured fields. Original Staff forms are on-shift for the nearest source pattern. The source's simulated GPS/security is not carried forward as a trusted control. Narrow notice navigation uses the existing preview Back to sign in action.

## Verification and limits

The complete five-width Chromium regression passed 571 cases with 84 intentional narrow Admin skips. The final six-width Admin suite passed 120 with 84 intentional narrow skips, including all three mandatory Admin–Staff workflows and the focused captures. Successful runs collected no migrated page errors or document-level overflow. Full results and superseded attempts are recorded in [implementation status](../../implementation-status.md).

These are representative source comparisons, not exact pixel parity or independent Figma/design approval. Firefox has an unresolved host profile-folder launch failure; Safari, physical devices, exhaustive accessibility and organisational acceptance remain unverified. All form/assignment/record mutations remain fictional and session-only. No production authentication, database, real uploads or deployment is implied.
