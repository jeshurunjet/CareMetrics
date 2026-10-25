"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, Empty, Banner, Icon, Status } from "../staff/ui"
import Select from "../staff/ui/Select"
import { Panel, KV } from "../admin/ui/core"
import Drawer from "../admin/workforce/Drawer"
import ReadOnlyFormValues from "../forms/ReadOnlyFormValues"
import { attendanceInstant } from "../attendance/duration"
import type { CarePageRead, CareRecordRead } from "./types"

function Metadata({ record }: { record: CareRecordRead }) {
  return (
    <dl className="cm-dl cm-dl--inline">
      <div>
        <dt>Covers</dt>
        <dd>{attendanceInstant(record.coveredAt)}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>{attendanceInstant(record.createdAt)}</dd>
      </div>
      <div>
        <dt>Submitted</dt>
        <dd>{attendanceInstant(record.submittedAt)}</dd>
      </div>
      <div>
        <dt>Author</dt>
        <dd>{record.authorName}</dd>
      </div>
      <div>
        <dt>Original template version</dt>
        <dd>v{record.templateVersion}</dd>
      </div>
      <div>
        <dt>House at submission</dt>
        <dd>{record.houseName ?? "Not recorded in legacy record"}</dd>
      </div>
      {record.offShiftReason && (
        <div>
          <dt>Off-shift reason</dt>
          <dd style={{ whiteSpace: "pre-wrap" }}>{record.offShiftReason}</dd>
        </div>
      )}
    </dl>
  )
}
function RecordCard({
  record,
  first,
  href,
}: {
  record: CareRecordRead
  first: boolean
  href: string
}) {
  const [open, setOpen] = useState(first)
  return (
    <article className={`cm-history ${open ? "open" : ""}`}>
      <button
        className="cm-history-head"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        aria-label={`${
          open ? "Collapse" : "Expand"
        } ${record.templateName} ${attendanceInstant(record.coveredAt)}`}
      >
        <div>
          <div className="cm-history-title">
            {record.templateName}
            <Status tone="success">Submitted</Status>
          </div>
          <div className="cm-history-meta">
            {attendanceInstant(record.coveredAt)} · {record.authorName} · v
            {record.templateVersion} · Submitted{" "}
            {attendanceInstant(record.submittedAt)}
          </div>
        </div>
        <Icon name="down" size={18} />
      </button>
      {open && (
        <div className="cm-history-body">
          <ReadOnlyFormValues version={record.form} values={record.values} />
          <Metadata record={record} />
          <Link className="cm-btn cm-btn--secondary cm-btn--sm" href={href}>
            View assessment
          </Link>
        </div>
      )}
    </article>
  )
}
interface Props {
  clientId: string
  data: CarePageRead
  admin?: boolean
}
export default function CarePlanView({ clientId, data, admin = false }: Props) {
  const router = useRouter(),
    base = `${admin ? "/admin" : ""}/clients/${clientId}`,
    notice = (
      <Banner tone="info">
        Connected development Care Plans · fictional data only. Submitted
        originals retain their exact template version. Drafts, corrections and
        uploads are Future Development.
      </Banner>
    )
  function href(patch: Record<string, string | undefined>) {
    const p = new URLSearchParams({ tab: "care", ...data.filters })
    p.delete("item")
    p.delete("version")
    for (const [key, value] of Object.entries(patch)) {
      if (value) p.set(key, value)
      else p.delete(key)
    }
    return `${base}?${p}`
  }
  const selected = data.selected,
    detail = data.detail
  if (detail && !admin)
    return (
      <div className="cm-stack" style={{ overflowWrap: "anywhere" }}>
        <Link href={href({})}>Back to assessment history</Link>
        {notice}
        <Card className="cm-panel">
          <h2 className="cm-h3">{detail.templateName}</h2>
          <Status tone="success">Submitted</Status>
          <p className="cm-muted">
            Original template v{detail.templateVersion} · read-only
          </p>
          <ReadOnlyFormValues version={detail.form} values={detail.values} />
          <Metadata record={detail} />
          <p className="cm-hint">
            Corrections and deletion are unavailable. Original answers are
            retained.
          </p>
        </Card>
      </div>
    )
  const content = (
    <div className="cm-stack" style={{ overflowWrap: "anywhere" }}>
      {notice}
      {!selected ? (
        <>
          {!data.categories.length ? (
            <Empty
              icon="clipboard"
              title="No care plan assessments are currently assigned to this client."
              text="No submitted Care Plan history is available."
            />
          ) : (
            <div className="cm-category-grid">
              {data.categories.map((category) => (
                <Card key={category.id} className="cm-category">
                  <span className="cm-category-icon">
                    <Icon name="clipboard" size={20} />
                  </span>
                  <div className="cm-grow">
                    <strong>{category.name}</strong>
                    <small>
                      {category.count} records ·{" "}
                      {category.version
                        ? `Assigned template v${category.version}`
                        : "No active assignment"}
                    </small>
                    <p className="cm-hint">{category.message}</p>
                    <div className="cm-row-actions">
                      <Link
                        className="cm-btn cm-btn--secondary cm-btn--sm"
                        href={`${base}?tab=care&sub=${category.id}`}
                      >
                        View records
                        <span className="sr-only"> · {category.name}</span>
                      </Link>
                      {!admin && category.available && (
                        <Link
                          className="cm-btn cm-btn--primary cm-btn--sm"
                          href={`/clients/${clientId}/records/new?templateId=${category.id}`}
                        >
                          Add entry
                          <span className="sr-only"> · {category.name}</span>
                        </Link>
                      )}
                    </div>
                    {admin && (
                      <p className="cm-hint">
                        Assignment:{" "}
                        {category.active ? "Active" : "Paused or absent"} ·{" "}
                        {category.archived ? "Archived" : "Current"} ·{" "}
                        {category.publishedVersions.length} published versions
                      </p>
                    )}
                  </div>
                  <Icon name="chevron" size={17} />
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="cm-subheader">
            <Link className="cm-back" href={`${base}?tab=care`}>
              <Icon name="back" size={16} />
              All assessments
            </Link>
            <div className="cm-row-between">
              <div>
                <h2 className="cm-h2">{selected.name}</h2>
                <p className="cm-muted">
                  {selected.version
                    ? `Assigned template v${selected.version}`
                    : "Historical records"}{" "}
                  · {selected.message}
                </p>
              </div>
              {!admin && selected.available && (
                <Link
                  className="cm-btn cm-btn--primary cm-btn--md"
                  href={`/clients/${clientId}/records/new?templateId=${selected.id}`}
                >
                  <Icon name="plus" size={17} />
                  New assessment
                </Link>
              )}
            </div>
          </div>
          {admin && (
            <Panel title="Published Care Plan definitions">
              <p>
                Read-only published versions; editing, publishing and assignment
                changes are unavailable here.
              </p>
              <div className="cm-row-actions">
                {selected.publishedVersions.map((v) => (
                  <Link
                    key={v.version}
                    href={href({ version: String(v.version) })}
                  >
                    View published v{v.version}
                  </Link>
                ))}
              </div>
              {data.publishedForm && (
                <details>
                  <summary>
                    Published form v{data.publishedForm.version}
                  </summary>
                  {data.publishedForm.sections.map((s) => (
                    <section key={s.id}>
                      <h3>{s.title}</h3>
                      <dl className="ad-kv">
                        {s.fields.map((f) => (
                          <div key={f.id}>
                            <dt>
                              {f.label}
                              {f.required ? " · required" : ""}
                            </dt>
                            <dd>
                              {f.type === "repeatingTable"
                                ? f.columns.map((c) => c.label).join(" · ")
                                : "options" in f
                                  ? f.options.map((o) => o.label).join(" · ")
                                  : (f.help ?? "Published question")}
                              {f.showIf || s.showIf
                                ? " · Conditional question"
                                : ""}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                </details>
              )}
            </Panel>
          )}
          <div className="cm-toolbar">
            <Select
              label="Date range"
              value={data.filters.range ?? ""}
              onChange={(range) =>
                router.push(href({ range, page: undefined }))
              }
              options={[
                { value: "", label: "Any date" },
                { value: "1", label: "Last 24 hours" },
                { value: "7", label: "Last 7 days" },
                { value: "30", label: "Last 30 days" },
              ]}
            />
          </div>
          {!data.rows.length ? (
            <Empty
              icon="clipboard"
              title="No records yet"
              text="No submitted records match this form and its filters."
            />
          ) : (
            <div className="cm-list" key={JSON.stringify(data.filters)}>
              {data.rows.map((r, i) => (
                <RecordCard
                  key={r.id}
                  record={r}
                  first={i === 0}
                  href={href({ item: r.id })}
                />
              ))}
            </div>
          )}
          {data.total > data.per && (
            <nav aria-label="History pages" className="cm-pagination">
              <span>
                {(data.page - 1) * data.per + 1}–
                {Math.min(data.page * data.per, data.total)} of {data.total}
              </span>
              <div>
                <button
                  aria-label="Previous page"
                  disabled={data.page <= 1}
                  onClick={() =>
                    router.push(href({ page: String(data.page - 1) }))
                  }
                >
                  Previous
                </button>
                <button
                  aria-label="Next page"
                  disabled={data.page * data.per >= data.total}
                  onClick={() =>
                    router.push(href({ page: String(data.page + 1) }))
                  }
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  )
  if (!admin) return content
  return (
    <>
      {content}
      {detail && (
        <Drawer
          title={detail.templateName}
          sub={`Original template v${detail.templateVersion} · read-only`}
          wide
          onClose={() => router.push(href({}))}
        >
          <KV
            items={[
              ["Author", detail.authorName],
              ["Submitted", attendanceInstant(detail.submittedAt)],
              ["Covers", attendanceInstant(detail.coveredAt)],
              ["House at submission", detail.houseName ?? "Not recorded"],
              ["Off-shift reason", detail.offShiftReason ?? "Not recorded"],
            ]}
          />
          <ReadOnlyFormValues version={detail.form} values={detail.values} />
          <p className="ad-faint">
            Original answers and exact published version are retained. Edits,
            corrections and deletion are unavailable.
          </p>
        </Drawer>
      )}
    </>
  )
}
