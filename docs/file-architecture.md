# Gallery and file contracts — Phase 1C.4

This is a fictional, development-only UI contract. No upload service, private storage, production download, authenticated permission service, database or scanning is connected.

## Shared metadata and associations

`src/modules/staff/files/types.ts` defines `FileRecord`: stable ID, filename, optional description, MIME type, byte size, image/pdf/document category, UTC upload timestamp, uploader employee ID, explicit association and demonstration availability. `association` is a discriminated `{scope, targetId}` relation. Client and house are implemented; diary/careRecord/notification/concern are reserved for later authorised parent workflows. Ownership never derives from a filename or path. The immutable submitted-file association has no staff editing operation.

One `attachments` array extends the existing StaffSnapshot/provider. There is no independent file store or mock API. The development seed reuses existing employees/houses/clients. c1 has three image records and four documents, c2 has documents, c3 has none; h1 has images/documents, h2 is empty. Multiple uploaders, an unsupported DOCX preview, a missing PDF asset and inaccessible c4/h3 file fixtures exercise the states. All content and metadata are fictional.

`getGallerySubject`, `getGalleryFiles`, `getGalleryFile`, `queryGallery` and `addDemoFileMetadata` recheck the mock role and house/client assignment. Supported preview roles are Support Worker, Manager and Administrator with subject access. Snapshot serialisation includes only authorised client/house attachments. Queries filter exact entity associations, then filename/type, newest upload first, six per page. A house document is never returned in a client's gallery. No delete/removal or reassociation operation exists in staff code.

## Bundled assets, previews and downloads

`demo-assets.ts` is a closed ID-to-path/MIME/size registry. It references genuine local PNG illustrations, a public explanatory TXT and an inventory CSV. SVG illustration sources are retained alongside rendered PNGs. Assets visibly say PUBLIC DEMO and contain no client/employee/health data. Their public static paths are explicitly **not** a private file-storage design; they remain public in production. Do not place future confidential files in `public/`.

`availability` is bundled, unavailable or sessionOnly. Only bundled records with a registry-owned asset ID enable a native download link. Unknown IDs, missing assets and session additions never construct fake or signed URLs. Images preview through Next Image with unoptimised local sources, loading/error/retry states and the original wide modal style. No unknown remote attachment URLs are loaded. PDF fixtures have no bundled PDF, so show type/metadata and an honest unavailable preview/download. Other documents show metadata and a preview-unavailable state; TXT/CSV still have genuine downloads.

The original staff export has a mixed gallery grid, not an alternate list-view switch. The migration retains that presentation as a semantic list of cards, with filename/type filtering and pagination rather than inventing a new view switch. The later Admin CMS may reuse metadata/query/icon/preview/upload components in its document table presentation.

## Temporary selection and simulated upload

`policy.ts` centralises provisional selection metadata feedback: JPEG/PNG/WebP, PDF, TXT/CSV, DOCX and XLSX with matching extensions. Unknown/active HTML/SVG/executable uploads, empty files and invalid sizes are rejected. The exported 15 MiB example is retained as an explicitly **provisional development** `maxBytes` configuration, not an organisation-approved policy. Photo selection reuses the same policy restricted to supported image formats. These browser MIME/extension/size checks cannot establish file safety and are not production security controls.

`FileUploadArea` supports browse/drop, selected filename/type/size/status, description, selection-only removal and cancellation. IDs distinguish duplicate filenames. States: idle, validating metadata, selected, simulated uploading with progress, completed, failed and cancelled. A labelled development outcome control demonstrates failure/retry without making a network request. Completion adds validated metadata with current employee/time and fixed subject, not file contents. No File/Blob/URL is accepted by the metadata adapter. No localStorage/sessionStorage, source write, real upload or mock database contains selected user file contents.

Selected image object URLs exist only in local component state for an unsent preview. They are revoked on removal, cancellation, completion and unmount; timers are cancelled and their generation invalidated when leaving. Completed session metadata cannot preview/download the discarded contents. It resets on provider reload/remount. Selection is not durable and is not an offline queue.

## Profile photos and permissions

`ProfilePhotoPicker` and `useTemporaryProfilePhoto` serve both profiles. The picker validates, previews, cancels or applies a temporary photo. Applied photos are local to the mounted profile, not stored in the shared metadata model. Picker and applied-photo resource ownership are separate so closing the picker revokes its preview URL without invalidating the profile preview. Old URLs and URLs on unmount are revoked. Leaving/reloading the profile restores the original photo; the UI says so.

Staff may view/select/preview/download permitted examples and inspect metadata. They cannot remove existing gallery files or edit their association. Selection removal affects only unsent items; profile replacement is a temporary presentation change, not historical-document deletion. The original disabled staff Delete button is removed entirely to follow the confirmed management-only rule. Removal guidance remains visible as text.

## Later private storage and Admin integration

Before real data, add trusted Auth.js identity and server checks for organisation, role and house/client/parent scope on every metadata read, upload, download and management removal. Add Prisma metadata relationships/constraints, a private Vercel Blob object reference, controlled retrieval, approved MIME/size policy, server content validation/scanning, error handling and concurrency. Never accept an arbitrary browser URL as ownership or access proof. Private paths/credentials must not enter client bundles; a public object URL must not be mistaken for authorisation. Signed URL infrastructure is not implemented here.

Management removal needs authorised desktop CMS review, reason/request actor/time, retention rules and durable audit. Preserve referenced metadata/history and log upload/download/removal actions without sensitive contents. Audit, legal/privacy/residency review, backup/restore and operational acceptance remain future work. No management deletion, clinical document parsing or real client information was introduced in this phase.

## Verification limits

Browser checks exercise local metadata only and genuine public demonstration downloads. Viewport emulation does not certify physical device pickers, mobile keyboards, Safari/Firefox or exhaustive accessibility. Node 22 intended-runtime verification remains outstanding if unavailable on the host. Source comparisons document intentional additions and limitations; they are not exact pixel parity or independent design acceptance.
