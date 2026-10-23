# Phase 1D.4 Profile, Settings and integration comparisons

The test-only renderer copies untouched Figma source and adapts the same fictional snapshot to its Staff model. The clock is frozen at 22 October 2026, display timezone is Pacific/Auckland, external images/tiles are deterministic test stubs, and both sides retain the same remote fonts. No font binary or original JSX/CSS/asset changed.

Nine states at 375, 390, 768, 1280 and 1440px: Profile overview, management-controlled fields, assigned houses, inline editing, validation, photo selection, Settings Coming Soon, mobile/desktop navigation and a final Dashboard integration view. Evidence comprises 90 raw PNGs and 15 paired boards. Migrated capture states assert document-level bounds and collect page errors. Prior phase evidence is not duplicated wholesale.

| Width | Profile / locked / houses | Edit / validation / photo | Settings / navigation / integration |
| --- | --- | --- | --- |
| 375 | [Board](comparison-375-profile.png) | [Board](comparison-375-editing.png) | [Board](comparison-375-integration.png) |
| 390 | [Board](comparison-390-profile.png) | [Board](comparison-390-editing.png) | [Board](comparison-390-integration.png) |
| 768 | [Board](comparison-768-profile.png) | [Board](comparison-768-editing.png) | [Board](comparison-768-integration.png) |
| 1280 | [Board](comparison-1280-profile.png) | [Board](comparison-1280-editing.png) | [Board](comparison-1280-integration.png) |
| 1440 | [Board](comparison-1440-profile.png) | [Board](comparison-1440-editing.png) | [Board](comparison-1440-integration.png) |

Preserved: original Staff typography, teal/orange palette, avatar, header, employer/contact panels, inline form/fields/buttons, badges, Empty screen, sidebar/menu/bottom navigation and mobile/desktop layout language. Intentional additions: preview strip/breadcrumbs, header Edit shortcut, preferred-name/status/security display, shared assignment links/cards, validation/help/session feedback and a temporary picker. Mobile Edit occupies a separate row to preserve name width; the employee h2 matches source h1 typography. Name wrapping is stress-tested without permitting employee-name edits.

Nearest references: the source has no separate Assigned Houses card, field-level errors or photo-selection modal. Its employer assignment summary, invalid-phone toast and immediately applied avatar are retained as comparisons. The original phone form is focused for the validation capture; migrated errors remain visible at their field. Its photo is applied immediately and has no Cancel/preview stage. The original photo capture scrolls to the header and waits for image decoding; its success toast expires before unrelated navigation/Settings captures. The migration reuses the earlier picker/policy and distinguishes staff-session lifetime from mounted Client/House lifetime. Sidebar/menu now display the same applied staff photo where relevant; the export omitted those photo props.

Settings keeps the original Coming Soon message and adds the required Dashboard action. Navigation capture is the mobile drawer below 1024px and sidebar/page above it. Both fixtures reset before the final Dashboard integration view. The original sidebar treats an old open attendance fixture as active; the migration makes no verified attendance inference. Source limitations and additional information mean exact pixel parity is not claimed.

These Chromium viewport comparisons are layout evidence, not independent design approval, exhaustive accessibility or physical-device/Safari certification. Intended-runtime and complete regression results are recorded in the implementation status. Firefox smoke was attempted separately and is blocked by this host's pre-application browser profile launch error.
