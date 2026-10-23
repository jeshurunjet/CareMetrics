import Link from "next/link"
import type { LeaveRequest } from "./types"
import { useStaffData } from "../data/context"
import { leaveTypeName, calendarDays } from "./adapter"
import { formatDateOnly, formatDateTime } from "../../../lib/time"
import { Card } from "../ui"
import LeaveStatusBadge from "./LeaveStatusBadge"
export default function LeaveRequestCard({
  request: r,
}: {
  request: LeaveRequest
}) {
  const s = useStaffData()
  return (
    <Card className="cm-leave-row">
      <div className="cm-grow">
        <strong>{leaveTypeName(s, r.typeId)}</strong>
        <span>
          {formatDateOnly(r.start)} – {formatDateOnly(r.end)} ·{" "}
          {calendarDays(r.start, r.end)} calendar days
        </span>
        <small>Submitted {formatDateTime(r.submittedAt)}</small>
        {r.notes && <small className="cm-leave-notes">{r.notes}</small>}
      </div>
      <LeaveStatusBadge status={r.status} />
      <Link
        className="cm-btn cm-btn--ghost cm-btn--sm"
        href={`/leave?requestId=${encodeURIComponent(r.id)}`}
      >
        View details<span className="sr-only"> for request {r.id}</span>
      </Link>
    </Card>
  )
}
