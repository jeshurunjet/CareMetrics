import { describe, it, expect } from "vitest"
import { developmentMockAdapter as adapter } from "../../src/modules/staff/data/development-mock-adapter"
import {
  myShifts,
  upcomingShifts,
  highlightedShift,
  shiftStatus,
  isCurrent,
} from "../../src/modules/staff/data/selectors"
import {
  getOwnShift,
  getOwnAttendance,
  getTeamSchedule,
  queryTimesheets,
  requestAttendanceCorrection,
  validateAttendanceProposal,
  attendanceStatus,
  getAttendanceCorrections,
} from "../../src/modules/staff/roster/adapter"
import {
  nzDay,
  monthDays,
  moveMonth,
  addDays,
  durationText,
  shiftOnDay,
} from "../../src/modules/staff/roster/dates"
import { toNZDateTimeInput } from "../../src/lib/time"
const now = "2026-10-22T01:00:00.000Z",
  get = () => adapter.getSnapshot("s1", now)
describe("shared scheduling and fictional attendance", () => {
  it("uses existing stable shifts, multiple assignments and chronological upcoming selection", () => {
    const s = get()
    expect(
      upcomingShifts(s)
        .slice(0, 3)
        .map((sh) => sh.id),
    ).toEqual(["sh1", "sh2", "sh3"])
    expect(highlightedShift(s)?.id).toBe("sh1")
    expect(new Set(myShifts(s).map((sh) => sh.houseId))).toEqual(
      new Set(["h1", "h2"]),
    )
    expect(getOwnShift(s, "co1")).toBeUndefined()
    expect(getOwnShift(s, "restricted-shift")).toBeUndefined()
    expect(getOwnShift(s, "invalid")).toBeUndefined()
  })
  it("cancelled shifts never become current, upcoming eligible or highlighted", () => {
    const s = get(),
      cancelled = getOwnShift(s, "cancelled")!
    const during = { ...s, now: cancelled.start }
    expect(isCurrent(during, cancelled)).toBe(false)
    expect(upcomingShifts(during).some((sh) => sh.id === cancelled.id)).toBe(
      false,
    )
    expect(highlightedShift(during)?.id).not.toBe(cancelled.id)
    expect(shiftStatus(during, cancelled).label).toBe("Cancelled")
    expect(shiftStatus(s, getOwnShift(s, "overnight")!).label).toBe("Completed")
  })
  it("handles NZ dates, month boundaries, leap days and midnight-overlap days independent of host timezone", () => {
    expect(nzDay("2026-10-21T12:00:00Z")).toBe("2026-10-22")
    expect(moveMonth("2026-12", 1)).toBe("2027-01")
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29")
    expect(monthDays("2026-10")).toHaveLength(42)
    const sh = getOwnShift(get(), "overnight")!
    expect(shiftOnDay(sh.start, sh.end, "2026-10-21")).toBe(true)
    expect(shiftOnDay(sh.start, sh.end, "2026-10-22")).toBe(true)
    expect(shiftOnDay(sh.start, sh.end, "2026-10-23")).toBe(false)
  })
  it("distinguishes scheduled and actual duration, including overnight and zero duration", () => {
    const s = get(),
      a = getOwnAttendance(s, "at-overnight")!,
      sh = getOwnShift(s, a.shiftId)!
    expect(durationText(sh.start, sh.end)).toBe("8h 0m")
    expect(durationText(a.clockIn, a.clockOut)).toBe("8h 10m")
    expect(durationText(a.clockIn)).toBe("—")
    expect(durationText(now, now)).toBe("0h 0m")
    expect(durationText(a.clockOut, a.clockIn)).toBe("Unavailable")
    expect(attendanceStatus(s, "history-1")).toBe("Missing Clock-out")
    expect(attendanceStatus(s, "history-8")).toBe("Not Clocked In")
    expect(attendanceStatus(s, "overnight")).toBe("Completed")
    const current = {
      ...s,
      now: a.clockIn!,
      attendance: [{ ...a, clockOut: undefined }],
    }
    expect(attendanceStatus(current, "overnight")).toBe("In Progress")
  })
  it("projects only operational team information within both employees' assignments", () => {
    const s = get(),
      rows = getTeamSchedule(s, "h1", nzDay(now))
    expect(rows.map((sh) => sh.employeeName)).toContain("Alex Morgan")
    expect(getTeamSchedule(s, "h3", nzDay(now))).toEqual([])
    expect(getTeamSchedule(s, "h1", "invalid")).toEqual([])
    for (const row of rows) {
      expect(row).not.toHaveProperty("email")
      expect(row).not.toHaveProperty("attendance")
      expect(row).not.toHaveProperty("clockIn")
      expect(row).not.toHaveProperty("notes")
    }
  })
  it("serialises only own attendance/corrections and excludes unrelated house metadata", () => {
    const s = get()
    expect(s.attendance.every((a) => a.employeeId === s.meId)).toBe(true)
    expect(getOwnAttendance(s, "coworker-attendance")).toBeUndefined()
    expect(getOwnAttendance(s, "restricted-attendance")).toBeUndefined()
    expect(getOwnAttendance(s, "invalid")).toBeUndefined()
    const alex = adapter.getSnapshot("s2", now)
    expect(getOwnAttendance(alex, "at-overnight")).toBeUndefined()
    expect(alex.attendanceCorrections).toEqual([])
  })
  it("filters newest-first own timesheets with date ranges, house and six-row pagination", () => {
    const s = get(),
      all = queryTimesheets(s)
    expect(all.items).toHaveLength(6)
    expect(all.items[0].id).toBe("sh1")
    expect(queryTimesheets(s, "", "", "", 2).items.length).toBeGreaterThan(0)
    expect(
      queryTimesheets(s, "2026-10-21", "2026-10-21").items.map((sh) => sh.id),
    ).toEqual(["overnight"])
    expect(
      queryTimesheets(s, "", "", "h2").rows.every((sh) => sh.houseId === "h2"),
    ).toBe(true)
    expect(queryTimesheets(s, "", "", "h3").total).toBe(0)
  })
  it("validates association, reasons, real NZ times, changes, chronology and future times", () => {
    const s = get(),
      id = "at-overnight",
      input = { clockIn: "", clockOut: "", reason: "" }
    expect(validateAttendanceProposal(s, id, input)).toHaveProperty("reason")
    expect(
      validateAttendanceProposal(s, "coworker-attendance", input),
    ).toHaveProperty("record")
    expect(
      validateAttendanceProposal(s, id, {
        ...input,
        clockIn: "2026-09-27T02:30",
      }),
    ).toHaveProperty("clockIn")
    expect(
      validateAttendanceProposal(s, id, {
        ...input,
        clockOut: "2026-10-21T20:00",
      }),
    ).toHaveProperty("clockOut")
    expect(
      validateAttendanceProposal(s, id, {
        ...input,
        clockOut: "2027-01-01T12:00",
      }),
    ).toHaveProperty("clockOut")
    expect(
      validateAttendanceProposal(s, id, {
        clockIn: toNZDateTimeInput(getOwnAttendance(s, id)!.clockIn!),
        clockOut: "",
        reason: "test",
      }),
    ).toHaveProperty("clockIn")
  })
  it("requests correction without changing original attendance, employee, house or shift; forbids duplicate pending and review operations", () => {
    const s = get(),
      before = structuredClone(s.attendance),
      input = {
        clockIn: "",
        clockOut: "2026-10-22T06:15",
        reason: "Fictional review",
      }
    const next = requestAttendanceCorrection(
      s,
      "at-overnight",
      input,
      "new-request",
      now,
    )
    expect(next.attendance).toEqual(before)
    const request = next.attendanceCorrections[0]
    expect(request).toMatchObject({
      requestingEmployeeId: "s1",
      attendanceId: "at-overnight",
      shiftId: "overnight",
      status: "pending",
    })
    expect(request.proposedClockOut).toBe("2026-10-21T17:15:00.000Z")
    expect(() =>
      requestAttendanceCorrection(next, "at-overnight", input, "second", now),
    ).toThrow(/Pending/)
    expect(getAttendanceCorrections(next, "at-overnight")).toHaveLength(1)
    expect(adapter).not.toHaveProperty("approveAttendanceCorrection")
    expect(adapter).not.toHaveProperty("updateShift")
    expect(
      get().attendanceCorrections.some((c) => c.id === "new-request"),
    ).toBe(false)
  })
})
