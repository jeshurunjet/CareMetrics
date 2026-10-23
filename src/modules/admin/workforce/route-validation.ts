import "server-only"
import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import { developmentMockAdapter } from "../../staff/data/development-mock-adapter"
export function validateWorkforceQuery(
  input: Record<string, string | string[] | undefined>,
  leave: boolean,
) {
  requirePreview()
  const allowed = leave
    ? ["tab", "requestId"]
    : [
        "tab",
        "shiftId",
        "attendanceId",
        "correctionId",
        "action",
        "house",
        "day",
      ]
  if (
    Object.entries(input).some(
      ([k, v]) => !allowed.includes(k) || typeof v !== "string",
    )
  )
    notFound()
  const q = input as Record<string, string>,
    tabs = leave
      ? ["pending", "all", "calendar"]
      : ["calendar", "shifts", "attendance", "timesheets", "corrections"]
  if (q.tab && !tabs.includes(q.tab)) notFound()
  const ids = [q.shiftId, q.attendanceId, q.correctionId].filter(Boolean)
  if (
    ids.length > 1 ||
    (q.action &&
      (!["new", "edit", "cancel"].includes(q.action) ||
        (q.action === "new" ? ids.length > 0 : !q.shiftId)))
  )
    notFound()
  if ((q.house || q.day) && q.action !== "new") notFound()
  if (q.day && !/^\d{4}-\d{2}-\d{2}$/.test(q.day)) notFound()
  const s = developmentMockAdapter.getSnapshot(
    "s1",
    process.env.CAREMETRICS_DEMO_NOW || new Date().toISOString(),
    true,
  )
  for (const [key, rows] of [
    ["shiftId", s.shifts],
    ["attendanceId", s.attendance],
    ["correctionId", s.attendanceCorrections],
    ["requestId", s.leaveRequests],
    ["house", s.houses],
  ] as const) {
    const id = q[key]
    if (
      id &&
      !rows.some((r) => r.id === id) &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    )
      notFound()
  }
}
