import type { StaffSnapshot, Shift } from "./types"
export const me = (s: StaffSnapshot) => s.staff.find((x) => x.id === s.meId)!
export const myHouses = (s: StaffSnapshot) =>
  s.houses.filter((h) =>
    s.assignments.some((a) => a.employeeId === s.meId && a.houseId === h.id),
  )
export const myClients = (s: StaffSnapshot) =>
  s.clients.filter((c) => myHouses(s).some((h) => h.id === c.houseId))
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
    .filter(
      (n) =>
        n.status === "Published" &&
        (!n.audience ||
          n.audience === "All staff" ||
          myHouses(s).some((h) => h.id === n.audience)) &&
        (n.category === "staff" ||
          myHouses(s).some((h) => h.id === n.relatedId) ||
          myClients(s).some((c) => c.id === n.relatedId)),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
export const shiftStatus = (s: StaffSnapshot, sh: Shift) =>
  sh.status === "cancelled"
    ? { tone: "danger" as const, label: "Cancelled" }
    : Date.parse(sh.end) <= Date.parse(s.now)
      ? { tone: "neutral" as const, label: "Completed" }
      : isCurrent(s, sh)
        ? { tone: "brand" as const, label: "Current · preview" }
        : { tone: "info" as const, label: "Upcoming" }
