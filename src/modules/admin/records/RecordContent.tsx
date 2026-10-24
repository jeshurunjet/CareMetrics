import type { StaffSnapshot } from "../../staff/data/types"
import type { SubmittedRecord } from "./adapter"
import { effectiveCare, effectiveDiary } from "./adapter"
import ReadOnlyFormValues from "../../forms/ReadOnlyFormValues"
import type { RecordRevision } from "../../staff/documentation/revisions"
/** The same version-aware read-only renderer is used by Staff, Admin and every revision. */
export default function RecordContent({
  s,
  record: r,
  original = false,
  revision,
}: {
  s: StaffSnapshot
  record: SubmittedRecord
  original?: boolean
  revision?: RecordRevision
}) {
  if (r.diary)
    return (
      <p className="ad-body ad-pre">
        {revision?.kind === "diary"
          ? revision.body
          : original
            ? r.diary.body
            : effectiveDiary(s, r.diary).body}
      </p>
    )
  if (!r.care || !r.version) return <p>Original version unavailable.</p>
  const values =
    revision?.kind === "care"
      ? revision.values
      : original
        ? r.care.values
        : effectiveCare(s, r.care).values
  const fields = new Set(
    r.version.sections.flatMap((section) => section.fields.map((f) => f.id)),
  )
  return (
    <>
      <ReadOnlyFormValues version={r.version} values={values} />
      {Object.entries(values)
        .filter(([id]) => !fields.has(id))
        .map(([id, value]) => (
          <div key={id}>
            <b>Unmapped historical field: {id}</b>
            <pre className="ad-pre">{JSON.stringify(value, null, 2)}</pre>
          </div>
        ))}
    </>
  )
}
