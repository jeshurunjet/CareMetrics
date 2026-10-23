import { effectiveAttendance, latestAttendanceDecision } from "./effective"
import type { StaffSnapshot } from "../data/types"
import type {
  AttendanceRecord,
  AttendanceProposal,
  AttendanceCorrectionRequest,
} from "./types"
import { myHouses, myShifts, shiftStatus } from "../data/selectors"
import { fromNZDateTimeInput } from "../../../lib/time"
import { nzDay, shiftOnDay, validDay } from "./dates"
const assigned = (s: StaffSnapshot, employeeId: string, houseId: string) =>
  s.assignments.some(
    (a) => a.employeeId === employeeId && a.houseId === houseId,
  )
export const getOwnShift = (s: StaffSnapshot, id: string) =>
  myShifts(s).find((sh) => sh.id === id)
export function getOwnAttendance(s: StaffSnapshot, id: string) {
  return s.attendance.find(
    (a) => a.id === id && a.employeeId === s.meId && getOwnShift(s, a.shiftId),
  )
}
export function attendanceForShift(s: StaffSnapshot, id: string) {
  const original = s.attendance.find(
    (a) => a.shiftId === id && getOwnAttendance(s, a.id),
  )
  return original ? effectiveAttendance(s, original) : undefined
}
export function attendanceStatus(s: StaffSnapshot, shiftId: string) {
  const shift = getOwnShift(s, shiftId)
  const a = attendanceForShift(s, shiftId)
  if (!shift) return "Unavailable"
  if (shift.status === "cancelled") return "Cancelled"
  if (a?.clockIn && a.clockOut) return "Completed"
  if (a?.clockIn)
    return Date.parse(shift.end) > Date.parse(s.now)
      ? "In Progress"
      : "Missing Clock-out"
  return "Not Clocked In"
}
export function getAttendanceCorrections(s: StaffSnapshot, id: string) {
  if (!getOwnAttendance(s, id)) return []
  return s.attendanceCorrections
    .filter((c) => c.attendanceId === id && c.requestingEmployeeId === s.meId)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
}
export function getTeamSchedule(
  s: StaffSnapshot,
  houseId: string,
  day: string,
) {
  if (!myHouses(s).some((h) => h.id === houseId) || !validDay(day)) return []
  return s.shifts
    .filter(
      (sh) =>
        sh.houseId === houseId &&
        assigned(s, sh.staffId, sh.houseId) &&
        shiftOnDay(sh.start, sh.end, day),
    )
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((sh) => ({
      id: sh.id,
      employeeId: sh.staffId,
      employeeName:
        s.staff.find((e) => e.id === sh.staffId)?.name ?? "Assigned employee",
      houseId: sh.houseId,
      start: sh.start,
      end: sh.end,
      state: shiftStatus(s, sh),
    }))
}
export function queryTimesheets(
  s: StaffSnapshot,
  from = "",
  to = "",
  house = "",
  requestedPage = 1,
) {
  const rows = myShifts(s)
    .filter(
      (sh) =>
        Date.parse(sh.start) <= Date.parse(s.now) &&
        (!house || sh.houseId === house) &&
        (!from || nzDay(sh.start) >= from) &&
        (!to || nzDay(sh.start) <= to),
    )
    .sort((a, b) => b.start.localeCompare(a.start))
  const page = Math.max(
    1,
    Math.min(requestedPage, Math.ceil(rows.length / 6) || 1),
  )
  return {
    rows,
    items: rows.slice((page - 1) * 6, page * 6),
    total: rows.length,
    page,
  }
}
export function validateAttendanceProposal(
  s: StaffSnapshot,
  id: string,
  input: AttendanceProposal,
) {
  const original = getOwnAttendance(s, id)
  const a = original ? effectiveAttendance(s, original) : undefined
  const errors: Partial<Record<keyof AttendanceProposal | "record", string>> =
    {}
  if (!a || getOwnShift(s, a.shiftId)?.status === "cancelled")
    errors.record = "Attendance unavailable."
  if (getAttendanceCorrections(s, id).some((c) => c.status === "pending"))
    errors.record = "A correction is already Pending Review."
  if (!input.reason.trim())
    errors.reason = "Please explain why a correction is needed."
  const clockIn = input.clockIn ? fromNZDateTimeInput(input.clockIn) : ""
  const clockOut = input.clockOut ? fromNZDateTimeInput(input.clockOut) : ""
  if (!input.clockIn && !input.clockOut)
    errors.clockIn = "Propose at least one corrected time."
  if (input.clockIn && !clockIn)
    errors.clockIn =
      "Enter an unambiguous valid Pacific/Auckland date and time."
  if (input.clockOut && !clockOut)
    errors.clockOut =
      "Enter an unambiguous valid Pacific/Auckland date and time."
  const start = clockIn || a?.clockIn,
    end = clockOut || a?.clockOut
  if (!start && end)
    errors.clockIn = "A clock-in time is required with a proposed clock-out."
  if (start && end && Date.parse(end) <= Date.parse(start))
    errors.clockOut =
      "Clock-out must be after clock-in, including the date for overnight shifts."
  if (
    (clockIn && Date.parse(clockIn) > Date.parse(s.now)) ||
    (clockOut && Date.parse(clockOut) > Date.parse(s.now))
  )
    errors.clockOut = "Recorded attendance corrections cannot be in the future."
  if (
    a &&
    (clockIn || a.clockIn) === a.clockIn &&
    (clockOut || a.clockOut) === a.clockOut &&
    (clockIn || clockOut)
  )
    errors.clockIn = "Propose a change to the recorded times."
  return errors
}
export function requestAttendanceCorrection(
  s: StaffSnapshot,
  attendanceId: string,
  input: AttendanceProposal,
  id: string,
  now: string,
): StaffSnapshot {
  const errors = validateAttendanceProposal(s, attendanceId, input)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  if (
    !id ||
    s.attendanceCorrections.some((c) => c.id === id) ||
    !Number.isFinite(Date.parse(now))
  )
    throw new Error("Invalid request metadata")
  const a = getOwnAttendance(s, attendanceId)!
  const request: AttendanceCorrectionRequest = {
    id,
    attendanceId,
    baseCorrectionId: latestAttendanceDecision(s, attendanceId)?.id,
    shiftId: a.shiftId,
    requestingEmployeeId: s.meId,
    proposedClockIn: fromNZDateTimeInput(input.clockIn) || undefined,
    proposedClockOut: fromNZDateTimeInput(input.clockOut) || undefined,
    reason: input.reason.trim(),
    requestedAt: now,
    status: "pending",
  }
  return { ...s, attendanceCorrections: [request, ...s.attendanceCorrections] }
}
export const rosterQueries = {
  getOwnShift,
  getOwnAttendance,
  getTeamSchedule,
  queryTimesheets,
  requestAttendanceCorrection,
}
export function recordedHours(a: AttendanceRecord) {
  return a.clockIn && a.clockOut
    ? Math.max(0, (Date.parse(a.clockOut) - Date.parse(a.clockIn)) / 3600000)
    : 0
}
