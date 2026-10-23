import Status from "../ui/Status"
import type { ConcernPriority, ConcernStatus, NoticePriority } from "./types"
export default function NotificationStatus({
  value,
}: {
  value: NoticePriority | ConcernPriority | ConcernStatus
}) {
  const tone =
    value === "Urgent" || value === "High"
      ? "danger"
      : value === "Important" ||
          value === "Under Review" ||
          value === "Submitted"
        ? "warning"
        : value === "Resolved"
          ? "success"
          : "neutral"
  return <Status tone={tone}>{value}</Status>
}
