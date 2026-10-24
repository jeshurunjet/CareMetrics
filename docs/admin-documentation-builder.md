# Admin care documentation — Phase 1E.3

This is a fictional, development-session UI migration. No real client information, production identity, database, private uploads, clinical workflow, durable audit or deployment is connected.

## Checkpoint and navigation

Completed Phase 1E.2 is preserved at local **3f7b147c45a570f48fd16efa9d1f740d9f359a41** on `phase-1e2`. Baseline Node 22.23.4 lint, strict types, format, 237 units, six-width Admin browser suite (93 passes / 69 deliberate narrow skips), build and 106 production-isolation URLs passed. Work is isolated on `phase-1e3`. No reset, discarded changes or remote push. Original references/CSS and unrelated duplicate screenshots remain preserved.

`/admin/documentation?tab=overview|categories|care|chart|assignments` is the canonical documentation hub. Care Plan and Charting are separate libraries over the same model. `/admin/documentation/templates/[id]?tab=builder|preview|versions|assign` handles one template, breadcrumbs and Back. Unknown/repeated selectors are rejected server-side. Syntactically valid session IDs missing after reload show a generic unavailable state after preview opt-in. Submitted Records and Correction Requests remain labelled Phase 1E.4 placeholders; no review/approval service was added.

The hub derives active category, published Care Plan/Charting, draft and active client-assignment counts from the shared snapshot. Recent changes show available configuration metadata only, with no fabricated production audit. Quick actions open the same libraries, category manager, create dialog and assignments.

## Source and component architecture

Original `admin/pages/Docs.tsx` supplies overview, Categories/CategoryModal, TemplateLibrary, table/filter/status and documentation navigation patterns. `admin/pages/Builder.tsx` supplies editor breadcrumbs/tabs, sticky action bar, three-panel palette/canvas/properties, option/condition/table-column editors, preview frame/device selector, publish confirmation, version table and assignment patterns. `Governance.tsx` was inspected: category management actually lives in Docs, not Governance. Original files and styles are unchanged.

Focused modules under `src/modules/admin/documentation/` separate:

- DocumentationPage, Categories and TemplateLibrary/CreateTemplate.
- TemplateEditor, FormBuilder and PropertiesEditor.
- OptionsEditor, ConditionEditor, TableEditor/NumericSettings.
- StaffFormPreview, Assignments, builder-model helpers.
- Pure management adapter and central template validation.

Existing Admin PageHead, Panel, Stat, DataTable, Filters, Select, SearchInput, Pill, SubTabs, Field and SelectField are reused. Existing Staff Btn, Modal/focus handling, Banner, Empty, DynamicFormRenderer, FormFieldRenderer, ChoiceField, RepeatingTableField, form engine, NZ date utilities and unsaved-change guard remain shared. Scoped extensions live only in `admin-migration.css`; no independent UI framework or dependency was added.

The brief requires a live Staff renderer in the centre panel. The source uses selectable field cards there. The migration keeps its palette, structure, card/tool styles and property panel, moves the selectable outline into the left panel, and uses the actual Staff renderer in the centre. Keyboard buttons provide section/field/option/column reordering instead of drag-only controls. Stable field/section/column IDs survive renaming and reordering; duplicate fields get new field IDs. Column IDs are scoped to their table field. Internal IDs are readable and fixed in the editor.

## One model and session boundary

One `StaffSnapshot`/root development provider contains DiaryCategory, CareTemplate, ConfigurableFormVersion, sections/fields/options/columns, ClientCareTemplateAssignment and CareRecord. No second Admin template database, Charting-only engine, mock API or localStorage persistence exists. CareTemplate gains optional draft/archive/configuration metadata; the draft embeds the existing ConfigurableFormVersion. Published versions retain exact field/column definitions, optional name/description/history metadata and publication actor/time/summary. Existing seed versions remain compatible without inventing missing publication metadata.

Admin loads the broader fictional snapshot through the existing explicit opt-in. Staff projects current house/client scope and published configuration; management drafts are omitted from Staff projections. Scoped updates merge without dropping those drafts or unrelated records. After visiting Admin the browser still holds the broader fictional dataset. Neither projection nor preview roles are a security/confidentiality boundary. Future server repositories must never send unauthorised data to the browser.

Every configuration mutation rechecks Administrator/Manager preview role, required organisation context and target relationships. Ordinary Staff, Senior Staff and unknown roles reject every configuration/assignment operation. No new Senior grants are assumed. Existing Manager restrictions on Administrator accounts remain unchanged. Actor IDs use existing fictional `a1`/`m1`; timestamps use the snapshot's current preview time. These are demonstration metadata, not trusted identity/audit.

## Diary categories

Create/edit requires a nonblank bounded name, supported client/house context and boolean active state. Active names are unique after trimming/case-folding within each context. IDs are stable and validated; existing contexts cannot be changed. Deactivation removes a category from new-entry choices, retaining its row and record references. Reactivation rechecks name uniqueness. There is no hard-delete operation.

New diary submissions snapshot the category name. Before renaming a seeded category, legacy submitted rows without a snapshot retain their previous name through optional categoryName metadata; record IDs, body, author and timestamps remain untouched. Thus later category edits/deactivation do not relabel submitted history. Drafts continue to require a currently active category at submission. Related-record preview is read-only titles/context/status/time, not the deferred Admin record-review module. Created/updated actor/time and record counts are shown where supplied; missing legacy metadata says Not supplied.

## Draft editing, controls and preview

Creating a template validates name/type and creates an unassigned draft, never a published version. Save Draft explicitly commits the editable local copy to the shared session and permits incomplete configurations. The action bar distinguishes unsaved edits from a saved session draft. Discard, Back, cross-app navigation and supported browser reload prompts reuse the existing guards; publication confirms its consequences. Invalid stable structure cannot enter the authoritative draft through the adapter.

Supported configurable runtime fields: text, textarea, number, Yes/No, dropdown, radio, multi-choice, date, time, datetime, scale and repeatingTable. Labels, help, placeholders, required flags, defaults, options and supported numeric settings use the existing engine. Defaults may be cleared, including selections invalidated by option removal. Scale controls now honour the configured integer step; unchanged step-1 fixtures retain their appearance. Photo/file palette controls are reserved and disabled; any legacy unsupported operational field/cell blocks publication, even if optional.

Selectable options retain separate stable values and display labels. Draft editors support add, label/value edits, up/down, remove and defaults. Removing/changing an option does not alter any published version; an invalid retained default blocks publication until repaired/cleared. Duplicate/blank values and empty lists are rejected at publication. Invalid configurations are explained rather than rendered through unsafe live controls. Preview is interactive and uses the same DynamicFormRenderer and answer validation as Staff. It never creates a CareRecord. Configuration edits reset preview answers; editing answers sanitizes hidden values through the existing engine. Separate Preview tab offers the full-width desktop frame; mobile/desktop frames also exist within the builder's available canvas.

## Typed conditions

A field or section declares `showIf: { fieldId, op, value }`. Existing equals, not_equals and includes semantics are retained. The UI's Show/Hide wording maps to equals/not_equals, not a new expression language. A missing/empty/hidden source hides the target, including when using not_equals. Includes is offered for multi-choice sources. Sources/values/operators must be valid and table/attachment controllers are disallowed. Self-dependencies and cycles through either fields or section gates block publication. No executable expressions are evaluated.

Hidden answers are cleared when the source changes, excluded on save/submission, and do not block required validation. New versions preserve the stable IDs needed by their own records; condition edits never change old records.

## Repeating editable tables and chart presentation

A repeatingTable contains stable columns with text, number, date, time, Yes/No, dropdown or radio kinds. Editor controls include labels, required flags, numeric bounds/steps, options, order, minimum/maximum rows, Add Row and Remove Draft Row. Optional `allowRemoveDraftRows` defaults to true for all previous templates; false hides row removal in the shared Staff renderer. Nested tables, multi cells and attachment cells are unsupported for publication.

Publication requires columns, unique valid IDs, labels, valid options/bounds and nonnegative integer ordered row limits. Required tables have an effective minimum of one. Disabling Add Row cannot make required rows unreachable without sufficient valid defaults. The generic Equipment Register demonstration is configured data, with no category-name branch. Submitted rows retain their original field/column definitions and read-only display.

Optional structured history columns reference stable existing field IDs. A simple numeric chart requires a number/scale field and an explicit unit. Records are included only when original-version field/unit metadata agrees with the displayed series; incompatible units are not silently combined. No invented missing values, clinical analysis or extra chart kinds are introduced. Expandable rows/details reuse the existing Staff history presentation.

## Central publication validation

`validation.ts` validates structure, required metadata/sections/questions, distinct safe section/field IDs, supported operational types, option uniqueness/nonblank labels and values, defaults through Staff validateForm, numeric/scale constraints, declarative conditions/cycles, table columns/limits and history references/units. Issues carry their section/field ID, appear in an error summary and navigate/focus the corresponding outline item. Publish is disabled while blocking issues remain. Draft saving can retain incomplete semantic configuration for later repair.

Section count/individual section field count and scale choice limits prevent unreasonable preview configuration; these are provisional UI bounds, not clinical or organisation policy. Server validation, payload limits, persistence constraints and concurrency will be required before production.

## Publication, versions and assignment policy

Publishing requires confirmation, central validation and the next unused version number. It deep-copies the saved configuration into a new published version and removes the editable draft. No operation edits an existing published version. Create New Version deep-copies an explicitly selected or latest published version into the next draft and retains its section/field/column IDs. Older records and definitions remain unchanged. Version History shows supplied actor/time/summary/counts, marks versions immutable and previews each exact version; legacy missing metadata is not fabricated.

Assignments use the existing unique `(clientId, templateId)` relation and explicitly choose a published version. Valid clients must belong to existing houses in the single fictional organisation; new assignments require active clients/houses and an unarchived template. Search, house filtering, checkboxes, status/version and explicit updates/deactivation share the same adapter. A batch assign is computed atomically before updating the session. Duplicate active assignment rejects and directs users to Update version. Publishing never silently updates assignments. Archiving requires all active assignments to be deactivated first and preserves versions/records; no permanent deletion exists.

Existing own Staff drafts retain their original version/values when assignments change. The prior adapter already permits submitting that original published version while an active template assignment remains; this behaviour is retained and documented, not replaced with an invisible migration. Deactivation blocks new entries and draft submission. Historical reads are separated from new-entry eligibility: a retained paused assignment plus current client/house scope permits old records/drafts to be read via their existing URLs. Paused templates are excluded from current category choices and show no new-entry controls. Historical access independent of current house assignment, draft submission after expiry/deactivation, concurrency and formal assignment-history retention require organisational decisions and trusted services.

## Acceptance and evidence

Browser scenarios configure/publish/assign a new Care Plan with stable options, default and conditional required notes, then submit it in Staff; v2 is published and explicitly assigned while the v1 record retains original labels/values. A new Charting template with ordinary text and a configured repeating equipment table is previewed, published, assigned and submitted/read in Staff. Client/House category creation, correct selector contexts, rename/deactivation and historical names are exercised. Existing Staff/core/workforce tests are retained.

Comparison evidence uses frozen 22 October 2026 NZ time, the same fictional source-adapted records, original remote fonts and deterministic test-only external images/tiles. The source renderer copies untouched reference files into ignored .ui-reference. It is not imported by Next. Six widths verify desktop presentation and the original narrow notice; representative builder states compare 1280/1440/1600. Staff screenshots include forms actually created through the Admin workflow. Original seeded forms provide their nearest source presentation, not identical new questionnaires.

Intentional differences: requested overview counts/assignment tab, explicit create/save/validation/version actions, stronger metadata/permissions, stable option values, supported column types, keyboard reorder controls, live centre preview and historical-name preservation. Original auto-save/automatic assignment rollout and historical category relabelling are deliberately replaced by the brief's explicit workflows/history rules. The original has fewer property controls and therefore a shorter editor. No exact pixel parity or independent Figma/design approval is claimed. Final evidence contains 132 raw captures and 24 paired boards at all six widths; every board was reviewed. The [evidence index](ui-comparisons/phase-1e3/README.md) records state mappings, intentional differences and limits.

## Future service boundary and remaining limitations

Prisma/Neon should persist organisation-owned categories/templates, immutable published versions, drafts, sections/fields/options/columns, client assignment events/current pointers and records referencing exact versions. Trusted Auth.js identity and server organisation/role/house checks must protect every read/write. Transactions/unique constraints must enforce active assignment uniqueness and monotonic publication; optimistic concurrency must prevent overwriting concurrent drafts/assignments. Published definitions/record values need durable immutability, audit, retention and recovery policies. Private Blob photo/file answers require separate authorised upload/retrieval/scanning/retention, and remain unavailable here.

All records/changes reset on reload/logout. No production audit, secure authentication, persistence, real uploads, GPS verification, medication administration, clinical rules/recommendations, notification delivery, submitted-record corrections approval or deployment is implemented. Medication templates remain documentation-only. Firefox's previously recorded profile-folder launch failure remains unresolved; Safari/physical-device/exhaustive accessibility/independent design and organisational privacy/security acceptance remain outstanding.

Recommended next phase after review: the separately authorised Phase 1E.4 Admin submitted-record and correction-review migration, using the same exact-version records and preserved originals. No later phase starts automatically.

## Final verification

Node 22.23.4 / pnpm 10.15.1: lint with zero warnings, strict TypeScript, formatting, 294 units across 14 files and production build pass. Complete five-width Chromium regression: 571 passed / 84 intentional narrow Admin skips. Final six-width Admin suite: 120 passed / 84 intentional narrow skips, including 1600px, final Admin-only refinements and all three mandatory Admin–Staff scenarios. Production login remains inert and all 119 tested preview URLs refuse access even with the development flag enabled. Existing local preview returns HTTP 200 on 12 representative URLs. Original 51 archive files and three CSS copies remain byte-identical; nine restricted fixture markers are absent from 78 production client chunks. See [implementation status](implementation-status.md) for run ordering, superseded failures and remaining acceptance limits. No remote push or Phase 1E.4 work occurred.

## Phase 1E.4A historical-record extension

Submitted Records and Correction Requests placeholders are now ported in the existing Documentation hub. Original CareRecord references/values and published definitions are preserved while approved requests create separate effective revisions. Proposed values validate against the record's original version, never the newest published template. Publishing/assignment/draft contracts above are unchanged. [Review contracts](admin-record-review.md) define typed field/cell/whole-table proposals, baseline conflicts, decisions, Staff propagation and deferred production services. This supersedes earlier “review deferred” notes for the development UI only.
