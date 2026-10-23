import type { StaffSnapshot } from "../data/types"
import type { LeaveInput, LeaveStatus, LeaveRequest } from "./types"
import { myShifts } from "../data/selectors"
import { validDay, nzDay } from "../roster/dates"
const knownEmployee = (s: StaffSnapshot) => s.staff.some((e) => e.id === s.meId)
export const getMyLeave = (s: StaffSnapshot) =>
  knownEmployee(s)
    ? s.leaveRequests
        .filter((r) => r.employeeId === s.meId)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    : []
export const getLeaveRequest = (s: StaffSnapshot, id: string) =>
  getMyLeave(s).find((r) => r.id === id)
export const getMyLeaveBalances = (s: StaffSnapshot) =>
  knownEmployee(s) ? s.leaveBalances.filter((b) => b.employeeId === s.meId) : []
export const getLeaveTypes = (s: StaffSnapshot) =>
  s.leaveTypes.filter((t) => t.active)
export const leaveTypeName = (s: StaffSnapshot, id: string) =>
  s.leaveTypes.find((t) => t.id === id)?.name ?? "Unavailable leave type"
export const leaveStatusLabel = (status: LeaveStatus) =>
  status === "pending"
    ? "Pending Review"
    : status === "approved"
      ? "Approved"
      : "Rejected"
export const validLeaveRange = (start: string, end: string) =>
  validDay(start) && validDay(end) && start <= end
export const calendarDays = (start: string, end: string) =>
  validLeaveRange(start, end)
    ? Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1
    : undefined
export function validateLeaveInput(s: StaffSnapshot, input: LeaveInput) {
  const errors: Partial<Record<keyof LeaveInput | "employee", string>> = {}
  if (!knownEmployee(s)) errors.employee = "Employee unavailable."
  if (!getLeaveTypes(s).some((t) => t.id === input.typeId))
    errors.typeId = "Choose an available leave type."
  if (!validDay(input.start)) errors.start = "Choose a valid start date."
  if (!validDay(input.end)) errors.end = "Choose a valid end date."
  else if (validDay(input.start) && input.end < input.start)
    errors.end = "End date must be on or after the start date."
  return errors
}
/** Advisory only: no automatic rejection, deduction or shift mutation. */
export function findLeaveOverlaps(
  s: StaffSnapshot,
  start: string,
  end: string,
) {
  if (!validLeaveRange(start, end)) return []
  return getMyLeave(s).filter(
    (r) => r.status !== "rejected" && r.start <= end && start <= r.end,
  )
}
export function getLeaveRosterContext(
  s: StaffSnapshot,
  start: string,
  end: string,
) {
  if (!validLeaveRange(start, end)) return []
  return myShifts(s).filter(
    (sh) =>
      sh.status !== "cancelled" &&
      nzDay(sh.start) <= end &&
      start <= nzDay(new Date(Date.parse(sh.end) - 1).toISOString()),
  )
}
export function getLeaveSummary(s: StaffSnapshot) {
  const mine = getMyLeave(s),
    today = nzDay(s.now)
  return {
    pending: mine.filter((r) => r.status === "pending").length,
    approved: mine.filter((r) => r.status === "approved").length,
    upcoming: mine
      .filter((r) => r.status === "approved" && r.end >= today)
      .sort((a, b) => a.start.localeCompare(b.start)),
  }
}
export function queryLeaveHistory(
  s: StaffSnapshot,
  query = "",
  status = "",
  typeId = "",
  from = "",
  to = "",
  requestedPage = 1,
) {
  const term = query.trim().toLocaleLowerCase("en-NZ")
  const rows = getMyLeave(s).filter(
    (r) =>
      (!term ||
        `${leaveTypeName(s, r.typeId)} ${r.notes}`
          .toLocaleLowerCase("en-NZ")
          .includes(term)) &&
      (!status || r.status === status) &&
      (!typeId || r.typeId === typeId) &&
      (!from || r.end >= from) &&
      (!to || r.start <= to),
  )
  const page = Math.max(
    1,
    Math.min(requestedPage, Math.ceil(rows.length / 6) || 1),
  )
  return {
    items: rows.slice((page - 1) * 6, page * 6),
    total: rows.length,
    page,
  }
}
export function createLeaveRequest(
  s: StaffSnapshot,
  input: LeaveInput,
  id: string,
  now: string,
): StaffSnapshot {
  const errors = validateLeaveInput(s, input)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  if (
    !id ||
    s.leaveRequests.some((r) => r.id === id) ||
    !Number.isFinite(Date.parse(now))
  )
    throw new Error("Invalid request metadata.")
  const request: LeaveRequest = {
    id,
    employeeId: s.meId,
    typeId: input.typeId,
    start: input.start,
    end: input.end,
    notes: input.notes.trim(),
    submittedAt: now,
    status: "pending",
  }
  return { ...s, leaveRequests: [request, ...s.leaveRequests] }
}
export const leaveQueries = {
  getMyLeave,
  getLeaveRequest,
  getMyLeaveBalances,
  getLeaveTypes,
  getLeaveSummary,
  queryLeaveHistory,
  findLeaveOverlaps,
  getLeaveRosterContext,
  createLeaveRequest,
}
