"use client"
import { useState } from "react"
import { useAdmin, KV, Pill } from "../ui/core"
import { Btn, Banner, Empty } from "../../staff/ui"
import { Field, useAdminFormGuard } from "../ui/Form"
import { leaveTypeName, leaveStatusLabel } from "../../staff/leave/adapter"
import { formatDateTime } from "@/lib/time"
import { leaveConflicts, reviewLeave } from "./adapter"
import { EmployeeLink } from "./shared"
import Link from "next/link"
import Drawer from "./Drawer"
import ConfirmDialog from "./ConfirmDialog"
export default function LeavePanel({
  id,
  onClose,
}: {
  id: string
  onClose: () => void
}) {
  const nav = useAdmin(),
    s = nav.data,
    l = s.leaveRequests.find((l) => l.id === id),
    conflicts = leaveConflicts(s, id),
    [notes, setNotes] = useState(""),
    [decision, setDecision] = useState<"approved" | "rejected" | null>(null),
    [saved, setSaved] = useState(false),
    [error, setError] = useState(""),
    discard = useAdminFormGuard(!!notes && !saved),
    close = () => {
      if (discard()) onClose()
    }
  if (!l)
    return (
      <Drawer title="Leave request unavailable" onClose={onClose}>
        <Empty title="Leave request unavailable" />
      </Drawer>
    )
  return (
    <Drawer
      title={`${leaveTypeName(s, l.typeId)} — ${s.staff.find((e) => e.id === l.employeeId)?.name}`}
      sub={`${l.start} – ${l.end} · ${l.id}`}
      onClose={close}
      footer={
        l.status === "pending" ? (
          <>
            <Btn
              variant="danger"
              onClick={() => {
                if (!notes.trim()) {
                  setError("A rejection reason is required.")
                  return
                }
                setDecision("rejected")
              }}
            >
              Reject
            </Btn>
            <Btn variant="success" onClick={() => setDecision("approved")}>
              Approve
            </Btn>
          </>
        ) : undefined
      }
    >
      {error && <Banner tone="danger">{error}</Banner>}
      {saved && (
        <Banner tone="success">
          Decision applied in this development session only.
        </Banner>
      )}
      <KV
        cols={1}
        items={[
          ["Status", <Pill key="s" s={leaveStatusLabel(l.status)} />],
          ["Employee", <EmployeeLink key="e" id={l.employeeId} />],
          ["Reason", l.notes || "—"],
          ["Submitted", formatDateTime(l.submittedAt)],
          ...(l.decision
            ? [
                ["Reviewer", l.decision.reviewerName || "Historical fixture"],
                ["Decision timestamp", formatDateTime(l.decision.decidedAt)],
                ["Manager notes", l.decision.notes || "—"],
              ] as [string, string][]
            : []),
        ]}
      />
      <h3 className="ad-drawer-h">Roster during this period</h3>
      {conflicts.length ? (
        <>
          <Banner tone="warning">
            {conflicts.length} scheduled shift(s) overlap this leave. Approving
            does not cancel, delete or reassign them. Manage each shift
            separately.
          </Banner>
          <ul className="ad-mini-list">
            {conflicts.map((sh) => (
              <li key={sh.id}>
                <Link href={`/admin/roster?shiftId=${sh.id}`}>
                  <b>{s.houses.find((h) => h.id === sh.houseId)?.name}</b>
                  <span>
                    {formatDateTime(sh.start)} – {formatDateTime(sh.end)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Banner tone="success">No scheduled shifts during this leave.</Banner>
      )}
      {l.status === "pending" ? (
        <Field
          label="Review notes"
          type="textarea"
          value={notes}
          onChange={setNotes}
          help="Required for rejection. Visible to the employee."
        />
      ) : (
        <Banner tone="info">
          Reviewed leave is read-only. Contact management for an approved-leave
          change; no cancellation or entitlement policy is implemented.
        </Banner>
      )}
      {decision && (
        <ConfirmDialog
          title={`${decision === "approved" ? "Approve" : "Reject"} leave?`}
          text={
            <>
              <p>
                {s.staff.find((e) => e.id === l.employeeId)?.name} · {l.start} –{" "}
                {l.end}
              </p>
              <p>
                {conflicts.length} overlapping shift(s) remain unchanged. Review
                them separately in the roster.
              </p>
              <p>
                The employee will see the decision in this same development
                session. No notification is delivered.
              </p>
            </>
          }
          confirm={
            decision === "approved" ? "Confirm approval" : "Confirm rejection"
          }
          tone={decision === "rejected" ? "danger" : "primary"}
          onClose={() => setDecision(null)}
          onConfirm={() => {
            try {
              nav.update(
                reviewLeave(
                  s,
                  nav.role,
                  l.id,
                  decision,
                  notes,
                  true,
                  new Date().toISOString(),
                ),
              )
              requestAnimationFrame(() =>
                document
                  .querySelector<HTMLElement>(".ad-drawer-head button")
                  ?.focus(),
              )
              setSaved(true)
              setDecision(null)
              setError("")
            } catch (e) {
              setError(e instanceof Error ? e.message : "Review unavailable")
              setDecision(null)
            }
          }}
        />
      )}
    </Drawer>
  )
}
