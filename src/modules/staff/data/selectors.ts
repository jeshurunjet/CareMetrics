import { isStaffPreviewRole } from "./permissions"
import type { StaffSnapshot, Shift } from "./types"
export const me = (s: StaffSnapshot) => s.staff.find((x) => x.id === s.meId)!
export const myHouses = (s: StaffSnapshot) =>
  s.houses.filter(
    (h) =>
      isStaffPreviewRole(me(s)?.role) &&
      h.status !== "Inactive" &&
      me(s)?.status !== "Inactive" &&
      s.assignments.some((a) => a.employeeId === s.meId && a.houseId === h.id),
  )
export const myClients = (s: StaffSnapshot) =>
  s.clients.filter(
    (c) =>
      c.status !== "Inactive" && myHouses(s).some((h) => h.id === c.houseId),
  )
export const myShifts = (s: StaffSnapshot) =>
  s.shifts
    .filter(
      (x) =>
        x.staffId === s.meId && myHouses(s).some((h) => h.id === x.houseId),
    )
    .sort((a, b) => a.start.localeCompare(b.start))
export const isCurrent = (s: StaffSnapshot, sh: Shift) =>
  sh.status !== "cancelled" &&
  Date.parse(sh.start) <= Date.parse(s.now) &&
  Date.parse(s.now) < Date.parse(sh.end)
export const upcomingShifts = (s: StaffSnapshot) =>
  myShifts(s).filter(
    (x) => x.status !== "cancelled" && Date.parse(x.end) > Date.parse(s.now),
  )
export const highlightedShift = (s: StaffSnapshot) =>
  upcomingShifts(s).find((x) => isCurrent(s, x)) ?? upcomingShifts(s)[0]
export const visibleNotices = (s: StaffSnapshot) =>
  s.notices
    .filter((n) => {
      if (!me(s) || !isStaffPreviewRole(me(s).role) || n.status !== "Published")
        return false
      const audience = n.targetAudience
      const audienceOk =
        audience?.kind === "organisation" ||
        (audience?.kind === "employee" && audience.employeeId === s.meId) ||
        (audience?.kind === "house" &&
          myHouses(s).some((h) => h.id === audience.houseId)) ||
        (audience?.kind === "role" && audience.role === me(s).role)
      return (
        audienceOk &&
        (n.category === "staff" ||
          (n.category === "house" &&
            myHouses(s).some((h) => h.id === n.relatedId)) ||
          (n.category === "client" &&
            myClients(s).some((c) => c.id === n.relatedId)))
      )
    })
    .sort((a, b) => b.date.localeCompare(a.date))
export const shiftStatus = (s: StaffSnapshot, sh: Shift) =>
  sh.status === "cancelled"
    ? { tone: "danger" as const, label: "Cancelled" }
    : Date.parse(sh.end) <= Date.parse(s.now)
      ? { tone: "neutral" as const, label: "Completed" }
      : isCurrent(s, sh)
        ? { tone: "brand" as const, label: "Current · preview" }
        : { tone: "info" as const, label: "Upcoming" }
