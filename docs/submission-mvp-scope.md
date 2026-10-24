# Submission MVP and future development boundary

## UI already migrated

The Staff interface includes Login/My Shifts/Dashboard, assigned Houses/Clients/NOK/Search, Client/House Diary, configurable Care Plan/Charting, galleries, roster/timesheets, leave, notices/own concerns, Profile and Coming Soon Settings. Admin includes core directories/forms/assignments, workforce/leave review, configurable documentation/versioning/assignments, submitted-record corrections, and Phase 1E.4B Files/Notices/Concern Review/Reports & Audit interfaces. All operational actions currently use fictional session state. Settings and explicitly unsupported controls remain intentional placeholders.

UI migration is not backend completion. No module is currently `backend-connected`.

## Planned real mobile-first submission backend

1. Real staff login through Auth.js, trusted sessions and server role/organisation/house permissions.
2. Assigned houses/clients/profiles/NOK and the shifts/roster assignments necessary for attendance.
3. Mobile browser GPS clock-in with server validation of eligibility/location evidence and persisted attendance. Browser GPS is spoofable; no tamper-proof verification or continuous tracking is claimed. Accuracy, radius, eligibility and clock-out policy need organisational approval.
4. Persistent Client Diary and Care Plan forms/history, preserving authorship, timestamps, exact template versions and controlled corrections.
5. Essential Admin accounts, assignments, house locations, clients/NOK and shifts/configuration supporting those workflows.

The existing Login → My Shifts → Dashboard path must continue allowing Dashboard access without clock-in.

## Future Development in the submission build

Preserve completed UI code, but later lock or clearly label full Leave workflows, notification delivery/concerns, secure Galleries, Admin Form Builder publishing, advanced Charting, detailed Reports/Audit and management functions beyond the essential submission demonstration. House Diary backend and other nonessential documentation workflows require an explicit scope decision; their existing UI remains preserved.

No global locking is added in Phase 1E.4B. Feature availability will be implemented during backend integration using trusted server permissions, route/read/write restrictions and appropriate UI labels. Decorative padlocks and client toggles are not security controls. Final integration/UI freeze is Phase 1E.5 and does not begin automatically.

## Services not yet implemented

Auth.js accounts/sessions/invites/recovery; Prisma/Neon persistence/transactions/constraints; GPS attendance submission/evidence; private Vercel Blob operations/scanning/retention; durable audit; actual notification delivery; production deployment/operations. Current login, preview roles, session saves, upload simulations and file removals are development demonstrations only. Reload/logout resets them. Harmless assets under public/demo-assets are public examples, never a private storage design.

## Before real client or health information

Obtain organisational approval and privacy/security acceptance; agree applicable New Zealand obligations and contractual/residency requirements with qualified organisational reviewers. Implement trusted per-operation identity/organisation/role/house/parent access and negative cross-scope tests, private files, input validation, concurrency/integrity, approved retention/restoration and incident procedures, backups/recovery, secure secrets/environment separation, monitoring without sensitive payloads and operational acceptance. Review external fonts/images/maps, device/browser compatibility and accessibility. Use fictional data throughout development and submission until these requirements are verified.
