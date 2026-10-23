import type { LeaveRequest } from "./types"
import { useStaffData } from "../data/context"
import { leaveTypeName, calendarDays } from "./adapter"
import { formatDateOnly, formatDateTime } from "../../../lib/time"
import { Modal, Banner } from "../ui"
import LeaveStatusBadge from "./LeaveStatusBadge"
import LeaveRosterContext from "./LeaveRosterContext"
export default function LeaveRequestDetails({
  request: r,
  onClose,
  created = false,
}: {
  request: LeaveRequest
  created?: boolean
  onClose: () => void
}) {
  const s = useStaffData()
  return (
    <Modal
      title="Leave request details"
      subtitle="Fictional development record"
      onClose={onClose}
    >
      {created && (
        <div role="status">
          <Banner tone="success">
            Development request created · Pending Review. It has not been
            delivered to a real manager and resets on reload.
          </Banner>
        </div>
      )}
      <Banner tone="info">
        Development preview only · requests are not sent to management or stored
        permanently. Balances and decisions are fictional.
      </Banner>
      <dl className="cm-dl">
        <div className="cm-dl-full">
          <dt>Request ID</dt>
          <dd>{r.id}</dd>
        </div>
        <div>
          <dt>Employee</dt>
          <dd>{s.staff.find((e) => e.id === r.employeeId)?.name}</dd>
        </div>
        <div>
          <dt>Leave type</dt>
          <dd>{leaveTypeName(s, r.typeId)}</dd>
        </div>
        <div>
          <dt>Requested start</dt>
          <dd>{formatDateOnly(r.start)}</dd>
        </div>
        <div>
          <dt>Requested end</dt>
          <dd>{formatDateOnly(r.end)}</dd>
        </div>
        <div>
          <dt>Calendar period</dt>
          <dd>
            {calendarDays(r.start, r.end)} whole calendar days · not paid
            entitlement
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <LeaveStatusBadge status={r.status} />
          </dd>
        </div>
        <div className="cm-dl-full">
          <dt>Reason / notes</dt>
          <dd className="cm-leave-notes">{r.notes || "No notes supplied."}</dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>{formatDateTime(r.submittedAt)} · Pacific/Auckland</dd>
        </div>
        {r.decision && (
          <>
            <div>
              <dt>Reviewer</dt>
              <dd>{r.decision.reviewerName || "Not supplied"}</dd>
            </div>
            <div>
              <dt>Decision date</dt>
              <dd>
                {formatDateTime(r.decision.decidedAt)} · fictional decision
              </dd>
            </div>
            <div className="cm-dl-full">
              <dt>Management notes</dt>
              <dd className="cm-leave-notes">
                {r.decision.notes || "Not supplied"}
              </dd>
            </div>
          </>
        )}
      </dl>
      <Banner tone="info">
        {r.status === "approved"
          ? "Approved leave cannot be cancelled by staff. Contact management to discuss changes."
          : r.status === "pending"
            ? "Pending Review. Withdrawal policy is not finalised; contact management about changes. No real management review is connected."
            : "Rejected requests are read-only. You may submit a new request through the normal form."}
      </Banner>
      <LeaveRosterContext start={r.start} end={r.end} />
    </Modal>
  )
}
