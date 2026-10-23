import type { LeaveStatus } from "./types"
import { leaveStatusLabel } from "./adapter"
import Status from "../ui/Status"
export default function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <Status
      tone={
        status === "approved"
          ? "success"
          : status === "pending"
            ? "warning"
            : "danger"
      }
    >
      {leaveStatusLabel(status)}
    </Status>
  )
}
