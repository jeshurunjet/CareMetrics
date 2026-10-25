"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Banner, Card, Status, Empty, Icon } from "../staff/ui"
import Select from "../staff/ui/Select"
import Drawer from "../admin/workforce/Drawer"
import { Panel, KV } from "../admin/ui/core"
import { attendanceInstant } from "../attendance/duration"
import { clientDiaryCategories } from "./categories"
import type { DiaryHistory, DiaryRecord } from "./types"

export function DiaryMetadata({ entry }: { entry: DiaryRecord }) {
  return (
    <dl className="cm-dl cm-dl--inline">
      <div>
        <dt>Covers</dt>
        <dd>{attendanceInstant(entry.coveredAt)}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>{attendanceInstant(entry.createdAt)}</dd>
      </div>
      <div>
        <dt>Submitted</dt>
        <dd>{attendanceInstant(entry.submittedAt)}</dd>
      </div>
      <div>
        <dt>Author</dt>
        <dd>{entry.authorName}</dd>
      </div>
      <div>
        <dt>House at submission</dt>
        <dd>{entry.houseName}</dd>
      </div>
      {entry.offShiftReason && (
        <div>
          <dt>Off-shift reason</dt>
          <dd className="cm-diary-text">{entry.offShiftReason}</dd>
        </div>
      )}
    </dl>
  )
}
function HistoryCard({
  entry,
  href,
  first,
}: {
  entry: DiaryRecord
  href: string
  first: boolean
}) {
  const [open, setOpen] = useState(first)
  return (
    <article className={`cm-history ${open ? "open" : ""}`}>
      <button
        className="cm-history-head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`${open ? "Collapse" : "Expand"} ${entry.title}`}
      >
        <div>
          <div className="cm-history-title">
            {entry.title}
            <Status tone="brand" dot={false}>
              {entry.category}
            </Status>
            <Status tone="success">Submitted</Status>
          </div>
          <div className="cm-history-meta">
            {attendanceInstant(entry.coveredAt)} · {entry.authorName} ·
            Submitted {attendanceInstant(entry.submittedAt)}
          </div>
          {!open && (
            <p className="cm-history-preview">
              {entry.content.slice(0, 110)}
              {entry.content.length > 110 ? "…" : ""}
            </p>
          )}
        </div>
        <Icon name="down" size={18} />
      </button>
      {open && (
        <div className="cm-history-body">
          <p
            className="cm-body cm-diary-text"
            style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
          >
            {entry.content}
          </p>
          <DiaryMetadata entry={entry} />
          <div className="cm-row-actions">
            <Link className="cm-btn cm-btn--secondary cm-btn--sm" href={href}>
              View details
            </Link>
          </div>
        </div>
      )}
    </article>
  )
}
interface Props {
  clientId: string
  data: DiaryHistory
  admin?: boolean
}
export default function DiaryHistoryView({
  clientId,
  data,
  admin = false,
}: Props) {
  const router = useRouter(),
    base = `${admin ? "/admin" : ""}/clients/${clientId}?tab=diary`
  function href(values: Record<string, string | undefined>) {
    const params = new URLSearchParams({ tab: "diary", ...data.filters })
    params.delete("item")
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    return `${base.split("?")[0]}?${params}`
  }
  const detail = data.detail
  const notice = (
    <Banner tone="info">
      Connected development diary · fictional data only. Submitted originals are
      read-only. Draft saving, corrections and attachments are Future
      Development.
    </Banner>
  )
  if (detail && !admin)
    return (
      <div className="cm-stack" style={{ overflowWrap: "anywhere" }}>
        <Link href={href({})}>Back to diary history</Link>
        {notice}
        <Card className="cm-panel">
          <h2 className="cm-h3">{detail.title}</h2>
          <Status tone="success">Submitted</Status>
          <p className="cm-muted">{detail.category}</p>
          <p
            className="cm-body cm-diary-text"
            style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
          >
            {detail.content}
          </p>
          <DiaryMetadata entry={detail} />
          <p className="cm-hint">
            Corrections are Future Development. The submitted original cannot be
            edited or deleted.
          </p>
        </Card>
      </div>
    )
  const content = (
    <div className="cm-stack" style={{ overflowWrap: "anywhere" }}>
      {notice}
      <div className="cm-toolbar">
        <Select
          label="Category"
          value={data.filters.category ?? ""}
          onChange={(category) =>
            router.push(href({ category, page: undefined }))
          }
          options={[
            { value: "", label: "All categories" },
            ...clientDiaryCategories.map((c) => ({
              value: c.id,
              label: c.name,
            })),
          ]}
        />
        <Select
          label="Date range"
          value={data.filters.range ?? ""}
          onChange={(range) => router.push(href({ range, page: undefined }))}
          options={[
            { value: "", label: "Any date" },
            { value: "1", label: "Last 24 hours" },
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
          ]}
        />
        {!admin && (
          <Link
            className="cm-btn cm-btn--primary cm-btn--md"
            href={`/clients/${clientId}/diary/new`}
          >
            <Icon name="plus" size={17} />
            New entry
          </Link>
        )}
      </div>
      <p className="cm-hint">
        Newest submissions first. Text search is unavailable; diary content is
        never placed in URLs.
      </p>
      {!data.rows.length ? (
        <Empty
          icon="book"
          title="No diary entries found"
          text="No submitted entries match this diary and its filters."
        />
      ) : (
        <div className="cm-list" key={JSON.stringify(data.filters)}>
          {data.rows.map((entry, i) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              first={i === 0}
              href={href({ item: entry.id })}
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
              onClick={() => router.push(href({ page: String(data.page - 1) }))}
            >
              Previous
            </button>
            <button
              aria-label="Next page"
              disabled={data.page * data.per >= data.total}
              onClick={() => router.push(href({ page: String(data.page + 1) }))}
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  )
  if (!admin) return content
  return (
    <>
      <Panel title="Submitted Client Diary">{content}</Panel>
      {detail && (
        <Drawer
          title={detail.title}
          sub="Submitted Client Diary · read-only"
          onClose={() => router.push(href({}))}
        >
          <KV
            items={[
              ["Category", detail.category],
              ["Author", detail.authorName],
              ["House at submission", detail.houseName],
              ["Covers", attendanceInstant(detail.coveredAt)],
              ["Submitted", attendanceInstant(detail.submittedAt)],
              ["Off-shift reason", detail.offShiftReason ?? "Not recorded"],
            ]}
          />
          <p
            className="cm-diary-text"
            style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
          >
            {detail.content}
          </p>
          <p className="ad-faint">
            Corrections, edits and deletion are unavailable.
          </p>
        </Drawer>
      )}
    </>
  )
}
