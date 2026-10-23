"use client"
import { notFound } from "next/navigation"
import { useStaffData } from "../staff/data/context"
import { getOwnShift, getOwnAttendance } from "../staff/roster/adapter"
import { canSubmitConcern } from "../staff/notifications/adapter"
export default function StaffRouteScopeGuard({
  kind,
  q,
  children,
}: {
  kind: "roster" | "notifications"
  q: Record<string, string | string[] | undefined>
  children: React.ReactNode
}) {
  const s = useStaffData(),
    value = (key: string) =>
      typeof q[key] === "string" ? q[key] as string : ""
  if (
    kind === "roster" &&
    ((value("house") && !s.houses.some((h) => h.id === value("house"))) ||
      (value("shiftId") && !getOwnShift(s, value("shiftId"))) ||
      (value("attendanceId") && !getOwnAttendance(s, value("attendanceId"))))
  )
    notFound()
  if (
    kind === "notifications" &&
    value("context") &&
    value("targetId") &&
    !canSubmitConcern(s, value("context"), value("targetId"))
  )
    notFound()
  return children
}
