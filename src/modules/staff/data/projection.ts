import type { StaffSnapshot } from "./types"
import { projectEmployee } from "../profile/adapter"
import {
  getMyConcerns,
  projectConcern,
  getParentAttachments,
} from "../notifications/adapter"
import { leaveQueries } from "../leave/adapter"
import { getOwnAttendance, getAttendanceCorrections } from "../roster/adapter"
import { fileQueries } from "../files/adapter"
import {
  getReadableCareTemplate,
  getCareRecords,
  careQueries,
} from "../care/adapter"
import { diaryQueries } from "./diary-adapter"
import { myHouses, myClients, visibleNotices } from "./selectors"
export function projectStaffSnapshot(s: StaffSnapshot): StaffSnapshot {
  const houses = myHouses(s)
  const clients = myClients(s).map((client) => {
    const projected = { ...client }
    delete projected.nhi
    return projected
  })
  return {
    ...s,
    houses,
    concerns: getMyConcerns(s).map(projectConcern),
    notificationReads: s.notificationReads.filter(
      (r) =>
        r.employeeId === s.meId &&
        visibleNotices(s).some((n) => n.id === r.notificationId),
    ),
    leaveRequests: leaveQueries.getMyLeave(s),
    leaveBalances: leaveQueries.getMyLeaveBalances(s),
    attendance: s.attendance.filter((a) => !!getOwnAttendance(s, a.id)),
    attendanceCorrections: s.attendance.flatMap((a) =>
      getAttendanceCorrections(s, a.id),
    ),
    attachments: [
      ...visibleNotices(s).flatMap((n) =>
        getParentAttachments(s, n, "notification"),
      ),
      ...getMyConcerns(s).flatMap((c) => getParentAttachments(s, c, "concern")),
      ...clients.flatMap((c) =>
        fileQueries.getGalleryFiles(s, { scope: "client", targetId: c.id }),
      ),
      ...houses.flatMap((h) =>
        fileQueries.getGalleryFiles(s, { scope: "house", targetId: h.id }),
      ),
    ],
    staff: s.staff
      .filter(
        (e) =>
          e.id === s.meId ||
          s.assignments.some(
            (a) =>
              a.employeeId === e.id && houses.some((h) => h.id === a.houseId),
          ),
      )
      .map((e) => projectEmployee(e, s.meId)),
    clients,
    assignments: s.assignments.filter((a) =>
      houses.some((h) => h.id === a.houseId),
    ),
    shifts: s.shifts.filter((sh) => houses.some((h) => h.id === sh.houseId)),
    notices: visibleNotices(s),
    diary: diaryQueries.getHistory(s, undefined),
    careAssignments: s.careAssignments.filter((a) =>
      clients.some((c) => c.id === a.clientId),
    ),
    careTemplates: s.careTemplates
      .filter((t) =>
        clients.some((c) => getReadableCareTemplate(s, c.id, t.id, t.kind)),
      )
      .map((t) => {
        const projected = { ...t }
        delete projected.draft
        return projected
      }),
    careRecords: clients.flatMap((c) =>
      s.careTemplates.flatMap((t) => getCareRecords(s, c.id, t.id)),
    ),
    corrections: s.corrections.filter((c) =>
      c.recordType === "care"
        ? s.careRecords.some(
            (r) =>
              r.id === c.recordId &&
              careQueries.getCareRecord(s, r.clientId, r.templateId, r.id),
          )
        : diaryQueries.getHistory(s).some((d) => d.id === c.recordId),
    ),
  }
}
