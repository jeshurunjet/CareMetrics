"use client"
import { useState } from "react"
import { useAdmin, KV, Pill } from "../ui/core"
import { Banner, Btn, Empty } from "../../staff/ui"
import { Field, useAdminFormGuard } from "../ui/Form"
import { formatDateTime } from "@/lib/time"
import { durationText } from "../../staff/roster/dates"
import { effectiveAttendance } from "../../staff/roster/effective"
import { reviewAttendance } from "./adapter"
import Drawer from "./Drawer"
import ConfirmDialog from "./ConfirmDialog"
export default function CorrectionReview({
  id,
  onClose,
}: {
  id: string
  onClose: () => void
}) {
  const nav = useAdmin(),
    s = nav.data,
    c = s.attendanceCorrections.find((c) => c.id === id),
    a = c && s.attendance.find((a) => a.id === c.attendanceId),
    [notes, setNotes] = useState(""),
    [decision, setDecision] = useState<"approved" | "rejected" | null>(null),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    discard = useAdminFormGuard(!!notes && !saved),
    close = () => {
      if (discard()) onClose()
    },
    time = (v?: string) => (v ? formatDateTime(v) : "Not recorded")
  if (!c || !a)
    return (
      <Drawer title="Correction unavailable" onClose={onClose}>
        <Empty title="Correction unavailable" />
      </Drawer>
    )
  const effective = effectiveAttendance(s, a),
    sh = s.shifts.find((sh) => sh.id === c.shiftId)
  return (
    <Drawer
      title="Attendance correction review"
      sub={c.id}
      wide
      onClose={close}
      footer={
        c.status === "pending" ? (
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
      <Pill
        s={
          c.status === "pending"
            ? "Pending Review"
            : c.status === "approved"
              ? "Approved"
              : "Rejected"
        }
      />
      <Banner tone="info">
        Manual development review only. Original attendance is retained.
        Corrected timestamps are never marked GPS-verified.
      </Banner>
      {error && <Banner tone="danger">{error}</Banner>}
      {saved && (
        <Banner tone="success">Decision applied in this session only.</Banner>
      )}
      <div className="ad-grid-2">
        <section>
          <h3 className="ad-h3">Original attendance</h3>
          <KV
            cols={1}
            items={[
              [
                "Scheduled shift",
                sh ? `${time(sh.start)} – ${time(sh.end)}` : "Unavailable",
              ],
              ["Original clock-in", time(a.clockIn)],
              ["Original clock-out", time(a.clockOut)],
              [
                "Original recorded duration",
                durationText(a.clockIn, a.clockOut),
              ],
              ["Current effective clock-in", time(effective.clockIn)],
              ["Current effective clock-out", time(effective.clockOut)],
            ]}
          />
        </section>
        <section>
          <h3 className="ad-h3">Proposed correction</h3>
          <KV
            cols={1}
            items={[
              [
                "Employee",
                s.staff.find((e) => e.id === c.requestingEmployeeId)?.name ||
                  "Unavailable",
              ],
              [
                "Requested clock-in",
                c.proposedClockIn ? time(c.proposedClockIn) : "Unchanged",
              ],
              [
                "Requested clock-out",
                c.proposedClockOut ? time(c.proposedClockOut) : "Unchanged",
              ],
              ["Explanation", c.reason],
              ["Requested", time(c.requestedAt)],
            ]}
          />
        </section>
      </div>
      {c.decision ? (
        <KV
          items={[
            ["Reviewer", c.decision.reviewerName],
            ["Decision timestamp", time(c.decision.decidedAt)],
            ["Review notes", c.decision.notes || "—"],
            ["Prior effective clock-in", time(c.decision.priorClockIn)],
            ["Prior effective clock-out", time(c.decision.priorClockOut)],
          ]}
        />
      ) : c.status === "pending" ? (
        <Field
          label="Review notes"
          type="textarea"
          value={notes}
          onChange={setNotes}
          help="Required for rejection. Visible to the employee."
        />
      ) : (
        <p>Historical display fixture · no applied decision metadata.</p>
      )}
      {decision && (
        <ConfirmDialog
          title={`${
            decision === "approved" ? "Approve" : "Reject"
          } attendance correction?`}
          text={
            <p>
              Employee:{" "}
              {s.staff.find((e) => e.id === c.requestingEmployeeId)?.name}.{" "}
              {decision === "approved"
                ? "Apply proposed effective values while preserving original events. Other stale requests cannot subsequently be approved."
                : "Keep effective attendance unchanged."}{" "}
              This is a session-only decision.
            </p>
          }
          confirm={
            decision === "approved" ? "Confirm approval" : "Confirm rejection"
          }
          tone={decision === "rejected" ? "danger" : "primary"}
          onClose={() => setDecision(null)}
          onConfirm={() => {
            try {
              nav.update(
                reviewAttendance(
                  s,
                  nav.role,
                  c.id,
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
