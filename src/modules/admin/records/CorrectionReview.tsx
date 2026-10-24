"use client"
import { useState } from "react"
import Link from "next/link"
import { useAdmin, PageHead, Panel, KV, Pill } from "../ui/core"
import { managedRequests, proposedRevision, reviewCorrection } from "./adapter"
import { recordHref } from "./SubmittedRecords"
import RecordContent from "./RecordContent"
import FieldDifferences from "./FieldDifferences"
import {
  correctionStatus,
  latestRevision,
} from "../../staff/documentation/revisions"
import { Banner, Btn, Empty } from "../../staff/ui"
import FormField from "../../staff/ui/FormField"
import ConfirmDialog from "../workforce/ConfirmDialog"
import useUnsavedChanges from "../../staff/diary/use-unsaved-changes"
import { formatDateTime } from "@/lib/time"
export default function CorrectionReview({ id }: { id: string }) {
  const nav = useAdmin(),
    s = nav.data,
    found = managedRequests(s, nav.role).find((x) => x.request.id === id)
  const [notes, setNotes] = useState(""),
    [confirm, setConfirm] = useState<"approved" | "rejected" | null>(null),
    [error, setError] = useState(""),
    [tried, setTried] = useState(false)
  useUnsavedChanges(!!notes && found?.request.status === "pending")
  if (!found)
    return (
      <Empty
        title="Correction request unavailable"
        text="The request is missing or outside this preview scope."
      />
    )
  const { request: c, record: r } = found
  let proposal: ReturnType<typeof proposedRevision> | undefined,
    issue = ""
  try {
    proposal = proposedRevision(s, r, c)
  } catch (e) {
    issue = e instanceof Error ? e.message : "Proposal unavailable"
  }
  const decide = () => {
    if (!confirm) return
    try {
      nav.update((current) =>
        reviewCorrection(
          current,
          nav.role,
          id,
          confirm,
          notes,
          new Date().toISOString(),
        ),
      )
      setConfirm(null)
      setNotes("")
      setError("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review unavailable")
      setConfirm(null)
    }
  }
  return (
    <>
      <PageHead
        title={`Correction request — ${r.title}`}
        crumbs={[
          { label: "Care Documentation", to: { page: "docs" } },
          {
            label: "Correction requests",
            to: { page: "docs", tab: "corrections" },
          },
          { label: id },
        ]}
        sub={
          <span className="ad-chips">
            <Pill s={correctionStatus(c)} />
            <span>
              {r.type} · {r.context}
            </span>
          </span>
        }
        actions={
          <Link
            className="cm-btn cm-btn--secondary cm-btn--md"
            href={recordHref(r)}
          >
            Open record
          </Link>
        }
      />
      <div className="ad-compare">
        <Panel title="Original submitted record">
          <KV
            items={[
              ["Author", s.staff.find((e) => e.id === r.authorId)?.name],
              ["Submitted", formatDateTime(r.submittedAt)],
              [
                "Original template version",
                r.care ? `v${r.care.templateVersion}` : "Diary",
              ],
              ["Request baseline", c.baseRevisionId ?? "Original submission"],
            ]}
          />
          <RecordContent s={s} record={r} original />
          {latestRevision(s, r.kind, r.id) && (
            <details>
              <summary>View current effective record</summary>
              <RecordContent s={s} record={r} />
            </details>
          )}
        </Panel>
        <Panel title="Proposed correction">
          <KV
            items={[
              [
                "Requested by",
                s.staff.find((e) => e.id === c.requestingEmployeeId)?.name,
              ],
              ["Requested", formatDateTime(c.requestedAt)],
              ["Request identifier", c.id],
            ]}
          />
          <div className="ad-reason">
            <b>Reason</b>
            <p>{c.reason}</p>
          </div>
          {r.diary ? (
            <>
              <p>Replace diary body · original retained</p>
              <div className="ad-diff ad-diff--old">
                <b>Original text: </b>
                <del>{r.diary.body}</del>
              </div>
              <div className="ad-diff ad-diff--new">
                <b>Proposed text: </b>
                <ins>
                  {c.proposal?.kind === "diary" ? c.proposal.body : c.proposed}
                </ins>
              </div>
            </>
          ) : (
            <>
              <p className="ad-pre">{c.proposed}</p>
              <FieldDifferences s={s} record={r} request={c} />
            </>
          )}
          {c.status === "pending" && proposal && (
            <details>
              <summary>Preview proposed effective record</summary>
              <RecordContent s={s} record={r} revision={proposal} />
            </details>
          )}
        </Panel>
      </div>
      <div data-diary-editor>
        <Panel title="Review">
          {c.status !== "pending" ? (
            <KV
              items={[
                ["Decision", correctionStatus(c)],
                [
                  "Reviewer",
                  s.staff.find((e) => e.id === c.decision?.reviewerId)?.name ??
                    "Legacy metadata not supplied",
                ],
                [
                  "Reviewed",
                  c.decision ? formatDateTime(c.decision.at) : "Not supplied",
                ],
                ["Review notes", c.decision?.notes],
                [
                  "Created revision",
                  c.decision?.revision?.id ?? "No effective revision",
                ],
              ]}
            />
          ) : (
            <>
              {issue && <Banner tone="warning">{issue}</Banner>}
              <FormField
                label="Review notes"
                htmlFor="record-review-notes"
                help="Visible to the requesting employee. Required when rejecting."
                error={
                  tried && !notes.trim()
                    ? "Enter a rejection reason."
                    : undefined
                }
              >
                <textarea
                  id="record-review-notes"
                  className="cm-input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormField>
              <div className="ad-inline">
                <Btn
                  variant="success"
                  disabled={!!issue}
                  onClick={() => setConfirm("approved")}
                >
                  Approve
                </Btn>
                <Btn
                  variant="danger"
                  onClick={() => {
                    setTried(true)
                    if (notes.trim()) setConfirm("rejected")
                  }}
                >
                  Reject
                </Btn>
              </div>
            </>
          )}
          {error && <p role="alert">{error}</p>}
          <p className="ad-faint">
            Development session only. Original submission and decisions are
            retained in this preview; no production audit or notification
            delivery.
          </p>
        </Panel>
      </div>
      {confirm && (
        <ConfirmDialog
          title={
            confirm === "approved"
              ? "Approve correction?"
              : "Reject correction?"
          }
          confirm={
            confirm === "approved" ? "Approve correction" : "Reject correction"
          }
          tone={confirm === "rejected" ? "danger" : "primary"}
          text={
            confirm === "approved"
              ? "Create an effective revision using the original template version. The original submission, author, time, values and request remain unchanged and traceable. This is session-only."
              : "Keep effective content unchanged and retain this request with your rejection reason. The requesting employee can view the outcome in this session."
          }
          onClose={() => setConfirm(null)}
          onConfirm={decide}
        />
      )}
    </>
  )
}
