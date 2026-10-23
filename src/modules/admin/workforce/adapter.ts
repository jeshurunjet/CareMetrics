import type { Shift, StaffSnapshot } from "../../staff/data/types"
import type { PreviewRole } from "../../preview/context"
import { requireManagement } from "../data/adapter"
import { fromNZDateTimeInput } from "../../../lib/time"
import { addDays, nzDay, validDay } from "../../staff/roster/dates"
import {
  effectiveAttendance,
  latestAttendanceDecision,
} from "../../staff/roster/effective"
import { validLeaveRange } from "../../staff/leave/adapter"
export interface ShiftInput {
  staffId: string
  houseId: string
  date: string
  start: string
  end: string
  breakMins: string
  notes: string
  status: string
}
export function shiftInstants(f: ShiftInput) {
  if (
    !validDay(f.date) ||
    !/^\d{2}:\d{2}$/.test(f.start) ||
    !/^\d{2}:\d{2}$/.test(f.end) ||
    f.start === f.end
  )
    return { start: "", end: "" }
  return {
    start: fromNZDateTimeInput(`${f.date}T${f.start}`),
    end: fromNZDateTimeInput(
      `${f.end < f.start ? addDays(f.date, 1) : f.date}T${f.end}`,
    ),
  }
}
export function validateShift(s: StaffSnapshot, f: ShiftInput, id?: string) {
  const errors: Record<string, string> = {}
  if (
    !f ||
    Object.values(f).some((v) => typeof v !== "string") ||
    [
      "staffId",
      "houseId",
      "date",
      "start",
      "end",
      "breakMins",
      "notes",
      "status",
    ].some((k) => typeof f[(k as keyof ShiftInput)] !== "string") ||
    Object.keys(f).some(
      (k) =>
        ![
          "staffId",
          "houseId",
          "date",
          "start",
          "end",
          "breakMins",
          "notes",
          "status",
        ].includes(k),
    )
  )
    return { input: "Invalid shift fields." }
  const emp = s.staff.find((e) => e.id === f.staffId && e.status !== "Inactive")
  if (!emp) errors.staffId = "Select a valid active employee."
  if (!s.houses.some((h) => h.id === f.houseId && h.status !== "Inactive"))
    errors.houseId = "Select a valid active house."
  else if (
    !s.assignments.some(
      (a) => a.employeeId === f.staffId && a.houseId === f.houseId,
    )
  )
    errors.houseId =
      "This employee is not currently assigned to the selected house."
  const times = shiftInstants(f)
  if (!times.start || !times.end || times.end <= times.start)
    errors.time =
      "Enter valid, unambiguous Pacific/Auckland times; equal times are not a shift. Earlier end times mean the following day."
  if (f.status !== "scheduled")
    errors.status = "Choose Scheduled. Use confirmed cancellation separately."
  const mins = Number(f.breakMins)
  if (
    !/^\d+$/.test(f.breakMins) ||
    !Number.isSafeInteger(mins) ||
    mins < 0 ||
    (times.start &&
      times.end &&
      mins >= (Date.parse(times.end) - Date.parse(times.start)) / 60000)
  )
    errors.breakMins =
      "Break must be whole minutes shorter than the shift. No payroll deduction is applied."
  if (f.notes.length > 4000)
    errors.notes = "Notes must be at most 4000 characters."
  if (
    id &&
    (!s.shifts.some((sh) => sh.id === id) ||
      s.shifts.find((sh) => sh.id === id)?.status === "cancelled")
  )
    errors.record = "Shift unavailable or cancelled."
  if (id && s.attendance.some((a) => a.shiftId === id))
    errors.record =
      "Recorded attendance exists. Schedule editing is restricted to preserve history."
  if (
    times.start &&
    times.end &&
    s.shifts.some(
      (sh) =>
        sh.id !== id &&
        sh.staffId === f.staffId &&
        sh.status !== "cancelled" &&
        sh.start < times.end &&
        times.start < sh.end,
    )
  )
    errors.overlap =
      "Overlaps an existing shift for this employee. Resolve the roster conflict first."
  return errors
}
export function actor(s: StaffSnapshot, role: PreviewRole) {
  requireManagement(role)
  const me = s.staff.find(
    (e) =>
      e.id === (role === "Manager" ? "m1" : "a1") && e.status !== "Inactive",
  )
  if (!me) throw new Error("Management identity unavailable.")
  return me
}
export function saveShift(
  s: StaffSnapshot,
  role: PreviewRole,
  f: ShiftInput,
  id?: string,
  newId = crypto.randomUUID(),
): StaffSnapshot {
  const me = actor(s, role),
    errors = validateShift(s, f, id)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  if (
    !id &&
    (!/^[0-9a-f-]{36}$/i.test(newId) || s.shifts.some((sh) => sh.id === newId))
  )
    throw new Error("Invalid shift identifier.")
  const old = s.shifts.find((sh) => sh.id === id)
  const sh: Shift = {
    ...old,
    id: id || newId,
    staffId: f.staffId,
    houseId: f.houseId,
    ...shiftInstants(f),
    assignedBy: old?.assignedBy || me.name,
    assignedById: old?.assignedById || me.id,
    breakMins: Number(f.breakMins),
    notes: f.notes.trim(),
  }
  return {
    ...s,
    shifts: id
      ? s.shifts.map((x) => (x.id === id ? sh : x))
      : [...s.shifts, sh],
  }
}
export function cancelShift(
  s: StaffSnapshot,
  role: PreviewRole,
  id: string,
  confirmed: boolean,
): StaffSnapshot {
  actor(s, role)
  const sh = s.shifts.find((sh) => sh.id === id)
  if (!confirmed || !sh || sh.status === "cancelled")
    throw new Error("Confirm an available shift cancellation.")
  if (s.attendance.some((a) => a.shiftId === id))
    throw new Error(
      "Recorded attendance exists. Cancellation is restricted to preserve history.",
    )
  return {
    ...s,
    shifts: s.shifts.map((sh) =>
      sh.id === id ? { ...sh, status: "cancelled" } : sh,
    ),
  }
}
export const leaveConflicts = (s: StaffSnapshot, id: string) => {
  const l = s.leaveRequests.find((r) => r.id === id)
  return l
    ? s.shifts.filter(
        (sh) =>
          sh.staffId === l.employeeId &&
          sh.status !== "cancelled" &&
          nzDay(sh.start) <= l.end &&
          l.start <= nzDay(new Date(Date.parse(sh.end) - 1).toISOString()),
      )
    : []
}
export function reviewLeave(
  s: StaffSnapshot,
  role: PreviewRole,
  id: string,
  status: "approved" | "rejected",
  notes: string,
  confirmed: boolean,
  now: string,
): StaffSnapshot {
  const me = actor(s, role),
    l = s.leaveRequests.find((r) => r.id === id)
  validateDecision(status, notes, confirmed, now)
  if (
    !l ||
    l.status !== "pending" ||
    !s.staff.some((e) => e.id === l.employeeId) ||
    !s.leaveTypes.some((t) => t.id === l.typeId) ||
    !validLeaveRange(l.start, l.end)
  )
    throw new Error("Pending leave request unavailable.")
  return {
    ...s,
    leaveRequests: s.leaveRequests.map((r) =>
      r.id === id
        ? {
            ...r,
            status,
            decision: {
              reviewerId: me.id,
              reviewerName: me.name,
              decidedAt: now,
              notes: notes.trim(),
            },
          }
        : r,
    ),
  }
}
function validateDecision(
  status: string,
  notes: string,
  confirmed: boolean,
  now: string,
) {
  if (
    !confirmed ||
    !["approved", "rejected"].includes(status) ||
    typeof notes !== "string" ||
    notes.length > 4000 ||
    !Number.isFinite(Date.parse(now))
  )
    throw new Error("Invalid confirmed review decision.")
  if (status === "rejected" && !notes.trim())
    throw new Error("A rejection reason is required.")
}
export function reviewAttendance(
  s: StaffSnapshot,
  role: PreviewRole,
  id: string,
  status: "approved" | "rejected",
  notes: string,
  confirmed: boolean,
  now: string,
): StaffSnapshot {
  const me = actor(s, role),
    c = s.attendanceCorrections.find((r) => r.id === id)
  validateDecision(status, notes, confirmed, now)
  const a =
    c &&
    s.attendance.find(
      (a) =>
        a.id === c.attendanceId &&
        a.shiftId === c.shiftId &&
        a.employeeId === c.requestingEmployeeId,
    )
  if (
    !c ||
    c.status !== "pending" ||
    !a ||
    !s.shifts.some((sh) => sh.id === a.shiftId && sh.staffId === a.employeeId)
  )
    throw new Error("Pending correction or attendance unavailable.")
  const current = effectiveAttendance(s, a),
    latest = latestAttendanceDecision(s, a.id)
  const clockIn = c.proposedClockIn || current.clockIn,
    clockOut = c.proposedClockOut || current.clockOut
  if (status === "approved") {
    if ((c.baseCorrectionId || undefined) !== latest?.id)
      throw new Error(
        "Another correction changed this attendance. Reject this stale request and ask for a new proposal.",
      )
    if (
      !clockIn ||
      !Number.isFinite(Date.parse(clockIn)) ||
      (clockOut &&
        (!Number.isFinite(Date.parse(clockOut)) || clockOut <= clockIn)) ||
      clockIn > now ||
      (clockOut && clockOut > now) ||
      (clockIn === current.clockIn && clockOut === current.clockOut)
    )
      throw new Error(
        "Proposed attendance must be a changed, valid past interval.",
      )
  }
  return {
    ...s,
    attendanceCorrections: s.attendanceCorrections.map((r) =>
      r.id === id
        ? {
            ...r,
            status,
            decision: {
              reviewerId: me.id,
              reviewerName: me.name,
              decidedAt: now,
              notes: notes.trim(),
              originalClockIn: a.clockIn,
              originalClockOut: a.clockOut,
              priorClockIn: current.clockIn,
              priorClockOut: current.clockOut,
              effectiveClockIn:
                status === "approved" ? clockIn : current.clockIn,
              effectiveClockOut:
                status === "approved" ? clockOut : current.clockOut,
            },
          }
        : r,
    ),
  }
}
export function managementAttendanceStatus(s: StaffSnapshot, sh: Shift) {
  if (sh.status === "cancelled") return "Cancelled"
  if (
    s.attendanceCorrections.some(
      (c) => c.shiftId === sh.id && c.status === "pending",
    )
  )
    return "Correction Pending"
  const original = s.attendance.find((a) => a.shiftId === sh.id),
    a = original && effectiveAttendance(s, original)
  if (a?.clockIn && a.clockOut) return "Completed"
  if (a?.clockIn) return sh.end <= s.now ? "Missing Clock-out" : "In Progress"
  return sh.start < s.now ? "Missing Clock-in" : "Not Started"
}
