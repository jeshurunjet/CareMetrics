# Phase 1C.4 visual evidence

90 raw screenshots (nine states × original/migrated × five widths) and 15 paired boards at 375, 390, 768, 1280 and 1440px; viewport height 900. Original appears left and migrated right. Desktop board columns scale to 720px; raw images preserve resolution.

- `comparison-[width]-galleries.png`: client images, client documents, house gallery.
- `comparison-[width]-details.png`: file information, image preview, empty house gallery.
- `comparison-[width]-uploads.png`: selection, validation error, profile-photo selection/application.

Untouched exported JSX/CSS renders the same fictional attachment metadata and harmless local demo assets. Source fonts/palette/cards/icons/navigation are preserved. The original only supplies a grid; no alternate view switch was invented. Migration adds complete metadata, accessible actions, real local downloads, wrapping filenames, search/type filters, pagination and explicit temporary-state warnings. These additions make mobile cards taller. Staff Delete is intentionally removed.

The source lacks a document filter; its document capture focuses document cards. Source selection auto-starts progress and photo selection applies immediately; migration adds explicit confirmation/preview/cancel. Source validation uses an oversized PDF, while migration demonstrates rejected file type. Empty comparisons use a house because the original empty-client fixture crashes on an optional missing contact phone. Migrated empty-client handling is separately tested. Source limitations are retained, not patched.

All migrated captures assert no document-level horizontal overflow and collect no page errors. Dialog capture waits for visibility. Details/preview content remains scrollable on mobile. No exact pixel parity, independent design sign-off, physical-device, other-browser or exhaustive accessibility certification is claimed. See [migration notes](../../ui-migration-notes.md) and [file contracts](../../file-architecture.md).
