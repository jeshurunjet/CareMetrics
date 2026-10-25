import type { Shift } from "@/modules/staff/data/types"
import type { ShiftRead } from "./types"
export function shiftPresentation(row: ShiftRead): Shift {
  return {
    id: row.id,
    staffId: row.employeeId,
    houseId: row.houseId,
    start: row.startsAt,
    end: row.endsAt,
    assignedBy: row.assignedBy ?? "Not recorded",
    notes: row.notes ?? "",
    ...(row.status === "CANCELLED" ? { status: "cancelled" as const } : {}),
  }
}
export function scheduleStatus(row: ShiftRead, now: string) {
  return row.status === "CANCELLED"
    ? { tone: "danger" as const, label: "Cancelled" }
    : Date.parse(row.endsAt) <= Date.parse(now)
      ? { tone: "neutral" as const, label: "Completed" }
      : Date.parse(row.startsAt) <= Date.parse(now)
        ? { tone: "brand" as const, label: "Current" }
        : { tone: "info" as const, label: "Upcoming" }
}
