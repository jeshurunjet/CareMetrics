# Phase 1D.2 Leave visual evidence

Nine states × original/migrated × five widths (375, 390, 768, 1280, 1440px): 90 raw captures and 15 paired boards. Viewport height is 900px. Original is left and migrated right. Desktop board columns scale to 720px; raw PNGs preserve resolution.

- `comparison-[width]-overview.png`: overview, history and empty state.
- `comparison-[width]-details.png`: pending, approved and rejected request details.
- `comparison-[width]-requests.png`: new request, date validation and overlapping period.

The original LeavePage and CSS render the same fictional requests through a test-only shape adapter. Its source cards provide the nearest reference for the new Details modal; the export has no detail workflow. Its selected-date form provides the overlap reference because the source has no overlap warning. Empty comparison uses an empty test fixture in the source and a no-match history filter in the migration; an employee with no records/balances is separately unit-tested.

Source fonts/palette/stat cards/history rows/form fields/modal/navigation are retained. Added breadcrumbs/warnings, approved count/upcoming section, filters/pagination, submission/date/decision metadata and roster context increase height. Source computed annual balance (9) differs intentionally from the supplied fictional snapshot (12); no entitlement calculation is retained. Pending/Declined map to Pending Review/Rejected. Pending Withdraw is deferred and approved cancellation is unavailable. Mobile content occupies a full row to avoid a narrow text column beside actions/status.

Frozen time: 2026-10-22T01:00:00Z; Pacific/Auckland browser timezone. External images/tiles are identical deterministic substitutes; no font binaries are copied. Original reference files and active original CSS copies remain unchanged. Migrated captures check page errors and no unintended page-level horizontal overflow. No exact pixel parity, independent design approval, physical-device/other-browser/exhaustive accessibility or Node 22 certification is claimed. See [migration notes](../../ui-migration-notes.md) and [Leave model](../../leave-management.md).
