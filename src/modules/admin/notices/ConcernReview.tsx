"use client"
import { useState } from "react"
import Link from "next/link"
import { useAdmin, PageHead, Panel, KV, Pill } from "../ui/core"
import { Field, useAdminFormGuard } from "../ui/Form"
import { Banner, Btn, Empty } from "../../staff/ui"
import {
  managedConcerns,
  subjectName,
  reviewConcern,
  type ConcernAction,
} from "../governance/adapter"
import ConfirmDialog from "../workforce/ConfirmDialog"
import { formatDateTime } from "@/lib/time"
import { formatBytes } from "../../staff/files/policy"
export default function ConcernReview({ id }: { id: string }) {
  const { data: s, role, update } = useAdmin(),
    c = managedConcerns(s, role).find((x) => x.id === id)
  const [text, setText] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [confirm, setConfirm] = useState<ConcernAction | null>(null)
  useAdminFormGuard(!!text)
  if (!c) return <Empty title="Concern unavailable" />
  function act(action: ConcernAction) {
    try {
      const next = reviewConcern(s, role, id, action, new Date().toISOString())
      update(next)
      if (action.text !== undefined) setText("")
      setError("")
      setConfirm(null)
      setMessage(
        "Development review saved in this session only. No real notification or escalation occurred.",
      )
    } catch (e) {
      setError((e as Error).message)
      setConfirm(null)
    }
  }
  const notes = c.internalNotes ?? [],
    events = c.reviewEvents ?? []
  return (
    <div className="ad-stack" data-diary-editor>
      <PageHead
        title={c.title}
        crumbs={[
          {
            label: "Notifications & Concerns",
            to: { page: "notices", tab: "concerns" },
          },
          { label: c.title },
        ]}
        sub={
          <span className="ad-chips">
            <Pill s={c.status} />
            <Pill s={c.priority} />
            <span>
              Raised by {s.staff.find((e) => e.id === c.submittedById)?.name} ·{" "}
              {formatDateTime(c.submittedAt)}
            </span>
          </span>
        }
        actions={
          <>
            {c.status === "Submitted" && (
              <Btn
                variant="secondary"
                onClick={() =>
                  setConfirm({ kind: "status", status: "Under Review" })
                }
              >
                Start review
              </Btn>
            )}
            {["Submitted", "Under Review"].includes(c.status) && (
              <Btn
                variant="success"
                onClick={() =>
                  setConfirm({ kind: "status", status: "Resolved", text })
                }
              >
                Resolve
              </Btn>
            )}
            {c.status === "Resolved" && (
              <Btn
                onClick={() =>
                  setConfirm({ kind: "status", status: "Closed", text })
                }
              >
                Close concern
              </Btn>
            )}
            {["Resolved", "Closed"].includes(c.status) && (
              <Btn
                variant="secondary"
                onClick={() =>
                  setConfirm({ kind: "status", status: "Under Review", text })
                }
              >
                Reopen review
              </Btn>
            )}
          </>
        }
      />
      {error && (
        <p role="alert" className="cm-banner cm-banner--danger">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {c.priority === "High" && (
        <Banner tone="warning">
          This feature does not replace urgent incident or emergency procedures.
          No real-time escalation is connected.
        </Banner>
      )}
      <div className="ad-grid-main">
        <div className="ad-stack">
          <Panel title="Original concern">
            <p className="ad-body ad-pre">{c.description}</p>
            <p className="ad-faint">
              Original title, description, author, association and submission
              time are preserved.
            </p>
            {(c.attachmentIds ?? []).map((id) => {
              const f = s.attachments.find(
                (f) =>
                  f.id === id &&
                  f.association.scope === "concern" &&
                  f.association.targetId === c.id,
              )
              return f ? (
                <p key={id}>
                  {f.name} · {f.mimeType} · {formatBytes(f.bytes)} · metadata
                  only
                </p>
              ) : null
            })}
          </Panel>
          <Panel title="Internal management notes">
            <p className="ad-faint">
              Restricted to management in the development projection. These
              notes are never included in the Staff concern contract.
            </p>
            {notes.length ? (
              <ul className="ad-mini-list">
                {notes.map((n, i) => (
                  <li key={i}>
                    <div>
                      <b>
                        {n.reviewerName} · {formatDateTime(n.at)}
                      </b>
                      <p className="ad-pre">{n.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ad-empty-inline">No internal notes yet.</p>
            )}
            <Field
              label="Review text"
              type="textarea"
              value={text}
              onChange={setText}
              help="Choose Internal Note or Staff-Visible Response explicitly. For Resolve/Close, this text is the author-visible outcome and is required."
            />
            <div className="ad-actions">
              <Btn
                variant="secondary"
                disabled={!text.trim()}
                onClick={() => act({ kind: "internal", text })}
              >
                Add internal note
              </Btn>
              <Btn
                disabled={!text.trim()}
                onClick={() => setConfirm({ kind: "response", text })}
              >
                Add staff-visible response
              </Btn>
            </div>
          </Panel>
          <Panel title="Development review history">
            {events.length ? (
              <ul className="ad-mini-list">
                {events.map((e) => (
                  <li key={e.id}>
                    <div>
                      <b>
                        {e.action} · {e.reviewerName}
                      </b>
                      <p>
                        {formatDateTime(e.at)} · {e.before} → {e.after} ·{" "}
                        {e.visibility === "internal"
                          ? "Management only"
                          : "Author-visible outcome"}
                      </p>
                      {e.text && <p className="ad-pre">{e.text}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No new review events in this session.</p>
            )}
          </Panel>
        </div>
        <div className="ad-stack">
          <Panel title="Details">
            <KV
              cols={1}
              items={[
                ["Concern ID", c.id],
                [
                  c.context === "client" ? "Client" : "House",
                  <Link
                    key="subject"
                    className="ad-link"
                    href={`/admin/${
                      c.context === "client" ? "clients" : "houses"
                    }/${encodeURIComponent(c.targetId)}?tab=notices`}
                  >
                    {subjectName(s, { scope: c.context, targetId: c.targetId })}
                  </Link>,
                ],
                [
                  "Raised by",
                  s.staff.find((e) => e.id === c.submittedById)?.name,
                ],
                ["Raised", formatDateTime(c.submittedAt)],
                [
                  "Reviewer",
                  s.staff.find((e) => e.id === c.reviewerId)?.name ??
                    "Unassigned",
                ],
              ]}
            />
          </Panel>
          <Panel title="Staff-visible response">
            {c.response ? (
              <>
                <p className="ad-pre">{c.response.text}</p>
                <small>
                  {c.response.reviewerName} · {formatDateTime(c.response.at)}
                </small>
              </>
            ) : (
              <p>No response supplied.</p>
            )}
          </Panel>
          <Panel title="Separate official notification">
            <p className="ad-faint">
              Reviewing this concern does not publish a notice. A separate
              notice requires its own content, audience and publication
              confirmation.
            </p>
            <Link
              className="cm-btn cm-btn--secondary cm-btn--sm"
              href="/admin/notifications/new"
            >
              Create notification
            </Link>
          </Panel>
        </div>
      </div>
      {confirm && (
        <ConfirmDialog
          title={
            confirm.kind === "response"
              ? "Add staff-visible response?"
              : `${
                  confirm.kind === "status" ? confirm.status : "Review"
                } concern?`
          }
          text={
            confirm.kind === "status" &&
            ["Resolved", "Closed"].includes(confirm.status)
              ? "Review text is required and will be visible to the submitting employee as the outcome. Original concern and previous review events remain."
              : "This updates development state only. Status and explicit staff responses are visible only to the submitting employee within their current context access."
          }
          confirm="Confirm review"
          onClose={() => setConfirm(null)}
          onConfirm={() => act(confirm)}
        />
      )}
    </div>
  )
}
