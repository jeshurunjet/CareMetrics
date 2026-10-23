import { describe, it, expect } from "vitest"
import { developmentMockAdapter } from "../../src/modules/staff/data/development-mock-adapter"
import { projectStaffSnapshot } from "../../src/modules/staff/data/projection"
import {
  upcomingShifts,
  highlightedShift,
} from "../../src/modules/staff/data/selectors"
import {
  saveShift,
  validateShift,
  cancelShift,
  reviewAttendance,
  reviewLeave,
  leaveConflicts,
  managementAttendanceStatus,
  shiftInstants,
  type ShiftInput,
} from "../../src/modules/admin/workforce/adapter"
import { effectiveAttendance } from "../../src/modules/staff/roster/effective"
import {
  attendanceForShift,
  requestAttendanceCorrection,
  recordedHours,
  getTeamSchedule,
} from "../../src/modules/staff/roster/adapter"
import { createLeaveRequest } from "../../src/modules/staff/leave/adapter"
import { dashboardSummary } from "../../src/modules/admin/data/adapter"
const now = "2026-10-22T01:00:00.000Z",
  seed = () => developmentMockAdapter.getSnapshot("s1", now, true),
  uuid = "5c237abc-8944-4ce1-a378-902f3f288776"
const f: ShiftInput = {
  staffId: "s1",
  houseId: "h1",
  date: "2026-11-10",
  start: "22:00",
  end: "06:00",
  breakMins: "0",
  notes: "Fictional shift",
  status: "scheduled",
}
describe("shared workforce operations", () => {
  it("creates one stable assigned shift visible in Staff roster/upcoming", () => {
    const s = seed(),
      next = saveShift(s, "Manager", f, undefined, uuid)
    expect(next.shifts.at(-1)?.id).toBe(uuid)
    expect(next.shifts.at(-1)?.assignedById).toBe("m1")
    expect(
      upcomingShifts(projectStaffSnapshot(next)).some((sh) => sh.id === uuid),
    ).toBe(true)
    expect(next.attendance).toBe(s.attendance)
  })
  it.each(["Staff", "Senior Staff"] as const)(
    "rejects every management mutation for %s",
    (role) => {
      const s = seed()
      for (const run of [
        () => saveShift(s, role, f),
        () => cancelShift(s, role, "sh1", true),
        () => reviewLeave(s, role, "leave-pending", "approved", "", true, now),
        () =>
          reviewAttendance(
            s,
            role,
            "attendance-correction-1",
            "approved",
            "",
            true,
            now,
          ),
      ])
        expect(run).toThrow(/permission/)
    },
  )
  it("rejects a mismatched house without adding an assignment", () => {
    const s = seed()
    expect(() => saveShift(s, "Manager", { ...f, houseId: "h3" })).toThrow(
      "This employee is not currently assigned to the selected house.",
    )
    expect(
      s.assignments.some((a) => a.employeeId === "s1" && a.houseId === "h3"),
    ).toBe(false)
  })
  it.each([
    { start: "25:00" },
    { end: "22:00" },
    { date: "2026-02-30" },
    { date: "2026-09-27", start: "02:30", end: "04:00" },
    { date: "2026-04-05", start: "02:30", end: "04:00" },
    { breakMins: "-1" },
    { breakMins: "480" },
    { status: "approved" },
    { staffId: "missing" },
    { houseId: "missing" },
  ])("rejects invalid schedule %j", (patch) =>
    expect(
      Object.keys(validateShift(seed(), { ...f, ...patch })).length,
    ).toBeGreaterThan(0),
  )
  it("rejects missing and forged scheduling fields", () => {
    expect(validateShift(seed(), {} as ShiftInput)).toHaveProperty("input")
    expect(
      validateShift(seed(), { ...f, assignedBy: "forged" } as ShiftInput),
    ).toHaveProperty("input")
  })
  it("detects employee overlap across houses, allowing adjacent shifts", () => {
    const s = saveShift(seed(), "Administrator", f, undefined, uuid)
    expect(() => saveShift(s, "Manager", { ...f, houseId: "h2" })).toThrow(
      /Overlaps/,
    )
    expect(
      validateShift(s, {
        ...f,
        date: "2026-11-11",
        start: "06:00",
        end: "14:00",
      }),
    ).toEqual({})
  })
  it("calculates overnight UTC and NZ daylight-saving duration explicitly", () => {
    const t = shiftInstants(f)
    expect(Date.parse(t.end) - Date.parse(t.start)).toBe(8 * 3600000)
    const dst = shiftInstants({
      ...f,
      date: "2026-09-26",
      start: "22:00",
      end: "06:00",
    })
    expect(Date.parse(dst.end) - Date.parse(dst.start)).toBe(7 * 3600000)
  })
  it("edits one ID then cancellation preserves it and excludes eligibility", () => {
    let s = saveShift(seed(), "Manager", f, undefined, uuid)
    s = saveShift(s, "Manager", { ...f, start: "21:00" }, uuid)
    expect(s.shifts.at(-1)?.start).toContain("08:00:00")
    s = cancelShift(s, "Manager", uuid, true)
    expect(s.shifts.at(-1)?.status).toBe("cancelled")
    expect(upcomingShifts(s).some((sh) => sh.id === uuid)).toBe(false)
    expect(highlightedShift(s)?.id).not.toBe(uuid)
  })
  it("requires confirmation and prohibits historical edits/cancellation", () => {
    const s = seed()
    expect(() => cancelShift(s, "Manager", "sh1", false)).toThrow()
    expect(() => cancelShift(s, "Manager", "history-1", true)).toThrow(
      /Recorded attendance/,
    )
    expect(() => saveShift(s, "Manager", f, "history-1")).toThrow(
      /Recorded attendance/,
    )
    expect(() => saveShift(s, "Manager", f, "missing")).toThrow()
    expect(() => cancelShift(s, "Manager", "missing", true)).toThrow()
  })
  it("approval preserves original events while Staff uses effective values", () => {
    const s = seed(),
      a = s.attendance.find((a) => a.id === "at-history-2")!,
      old = { ...a },
      pending = dashboardSummary(s).corrections
    const next = reviewAttendance(
        s,
        "Manager",
        "attendance-correction-1",
        "approved",
        "Confirmed fictional review",
        true,
        now,
      ),
      c = next.attendanceCorrections.find(
        (c) => c.id === "attendance-correction-1",
      )!
    expect(next.attendance).toBe(s.attendance)
    expect(a).toEqual(old)
    expect(effectiveAttendance(next, a).clockOut).toBe(c.proposedClockOut)
    expect(
      attendanceForShift(projectStaffSnapshot(next), "history-2")?.clockOut,
    ).toBe(c.proposedClockOut)
    expect(effectiveAttendance(next, a).location).toBe("fictional-unverified")
    expect(c.decision?.originalClockOut).toBe(old.clockOut)
    expect(c.decision?.reviewerId).toBe("m1")
    expect(c.decision?.decidedAt).toBe(now)
    expect(dashboardSummary(next).corrections).toBe(pending - 1)
  })
  it("requires rejection reason and leaves effective attendance unchanged", () => {
    const s = seed(),
      a = s.attendance.find((a) => a.id === "at-history-2")!
    expect(() =>
      reviewAttendance(
        s,
        "Administrator",
        "attendance-correction-1",
        "rejected",
        "",
        true,
        now,
      ),
    ).toThrow(/reason/)
    const next = reviewAttendance(
      s,
      "Administrator",
      "attendance-correction-1",
      "rejected",
      "Incorrect proposal",
      true,
      now,
    )
    expect(effectiveAttendance(next, a)).toEqual(a)
    expect(next.attendanceCorrections[0].decision?.notes).toBe(
      "Incorrect proposal",
    )
  })
  it("prevents duplicate decisions and conflicting stale approvals", () => {
    const s = seed(),
      c = s.attendanceCorrections[0]
    s.attendanceCorrections.push({ ...c, id: "duplicate" })
    const next = reviewAttendance(s, "Manager", c.id, "approved", "", true, now)
    expect(() =>
      reviewAttendance(next, "Manager", c.id, "rejected", "No", true, now),
    ).toThrow(/Pending/)
    expect(() =>
      reviewAttendance(next, "Manager", "duplicate", "approved", "", true, now),
    ).toThrow(/Another correction/)
    expect(
      reviewAttendance(
        next,
        "Manager",
        "duplicate",
        "rejected",
        "Stale",
        true,
        now,
      ).attendanceCorrections.find((c) => c.id === "duplicate")?.status,
    ).toBe("rejected")
  })
  it("supports a new request based on the approved effective version", () => {
    let s = reviewAttendance(
      seed(),
      "Manager",
      "attendance-correction-1",
      "approved",
      "",
      true,
      now,
    )
    s = requestAttendanceCorrection(
      s,
      "at-history-2",
      {
        clockIn: "",
        clockOut: "2026-10-19T15:15",
        reason: "Second fictional correction",
      },
      "second",
      now,
    )
    expect(s.attendanceCorrections[0].baseCorrectionId).toBe(
      "attendance-correction-1",
    )
    s = reviewAttendance(
      s,
      "Manager",
      "second",
      "approved",
      "",
      true,
      "2026-10-22T01:01:00.000Z",
    )
    expect(
      effectiveAttendance(s, s.attendance.find((a) => a.id === "at-history-2")!)
        .clockOut,
    ).toBe("2026-10-19T02:15:00.000Z")
  })
  it.each(["missing", "at-history-1"])(
    "rejects unknown correction target %s",
    (id) =>
      expect(() =>
        reviewAttendance(seed(), "Manager", id, "approved", "", true, now),
      ).toThrow(),
  )
  it("validates correction FK and future/reversed proposals", () => {
    const s = seed()
    s.attendanceCorrections[0].requestingEmployeeId = "s2"
    expect(() =>
      reviewAttendance(
        s,
        "Manager",
        "attendance-correction-1",
        "approved",
        "",
        true,
        now,
      ),
    ).toThrow(/unavailable/)
    const t = seed()
    t.attendanceCorrections[0].proposedClockOut = "2027-01-01T00:00:00.000Z"
    expect(() =>
      reviewAttendance(
        t,
        "Manager",
        "attendance-correction-1",
        "approved",
        "",
        true,
        now,
      ),
    ).toThrow(/past interval/)
  })
  it("identifies missing/out, completed, not started and correction pending", () => {
    const s = seed(),
      by = (id: string) =>
        managementAttendanceStatus(s, s.shifts.find((sh) => sh.id === id)!)
    expect(by("history-1")).toBe("Missing Clock-out")
    expect(by("history-2")).toBe("Correction Pending")
    expect(by("overnight")).toBe("Completed")
    expect(by("future-overnight")).toBe("Not Started")
    expect(by("history-8")).toBe("Missing Clock-in")
    expect(
      recordedHours(s.attendance.find((a) => a.id === "at-overnight")!),
    ).toBeCloseTo(8 + 10 / 60)
  })
  it("Staff submission uses the same attendance correction collection Admin reviews", () => {
    let s = requestAttendanceCorrection(
      seed(),
      "at-history-1",
      {
        clockIn: "",
        clockOut: "2026-10-20T15:00",
        reason: "Missing fictional event",
      },
      "staff-new",
      now,
    )
    expect(s.attendanceCorrections[0].status).toBe("pending")
    s = reviewAttendance(
      s,
      "Manager",
      "staff-new",
      "approved",
      "Confirmed",
      true,
      now,
    )
    expect(attendanceForShift(s, "history-1")?.clockOut).toBe(
      "2026-10-20T02:00:00.000Z",
    )
  })
  it("Staff leave submission appears in Admin then approved decision in Staff", () => {
    let s = createLeaveRequest(
      seed(),
      {
        typeId: "annual",
        start: "2026-10-23",
        end: "2026-10-24",
        notes: "Fictional request",
      },
      "new-leave",
      now,
    )
    const shifts = s.shifts,
      balances = s.leaveBalances,
      attendance = s.attendance
    expect(leaveConflicts(s, "new-leave").length).toBeGreaterThan(0)
    s = reviewLeave(
      s,
      "Manager",
      "new-leave",
      "approved",
      "Coordinate roster separately",
      true,
      now,
    )
    expect(s.shifts).toBe(shifts)
    expect(s.leaveBalances).toBe(balances)
    expect(s.attendance).toBe(attendance)
    expect(
      projectStaffSnapshot(s).leaveRequests.find((l) => l.id === "new-leave")
        ?.decision?.reviewerId,
    ).toBe("m1")
    expect(dashboardSummary(s).leave).toBe(2)
  })
  it("leave rejection reason/metadata and duplicate protection", () => {
    const s = seed()
    expect(() =>
      reviewLeave(s, "Manager", "leave-pending", "rejected", "", true, now),
    ).toThrow(/reason/)
    expect(() =>
      reviewLeave(s, "Manager", "leave-pending", "approved", "", false, now),
    ).toThrow()
    const next = reviewLeave(
      s,
      "Administrator",
      "leave-pending",
      "rejected",
      "Roster cover unavailable",
      true,
      now,
    )
    expect(next.leaveRequests[0].decision?.reviewerId).toBe("a1")
    expect(next.leaveRequests[0].status).toBe("rejected")
    expect(() =>
      reviewLeave(
        next,
        "Administrator",
        "leave-pending",
        "approved",
        "",
        true,
        now,
      ),
    ).toThrow(/Pending/)
  })
  it("rejects unknown leave and invalid dates without changing records", () => {
    const s = seed()
    expect(() =>
      reviewLeave(s, "Manager", "missing", "approved", "", true, now),
    ).toThrow()
    s.leaveRequests[0].end = "2026-02-30"
    expect(() =>
      reviewLeave(s, "Manager", "leave-pending", "approved", "", true, now),
    ).toThrow()
  })
  it("Team Schedule never receives leave reasons, decisions or private attendance", () => {
    const s = seed(),
      team = getTeamSchedule(s, "h1", "2026-10-22")
    expect(JSON.stringify(team)).not.toMatch(
      /Private coworker|leaveRequests|decision|clockIn|notes/,
    )
    expect(team.length).toBeGreaterThan(0)
  })
  it("Dashboard open-event counts use effective review values and retain originals", () => {
    let s = seed()
    const original = s.attendance.find((a) => a.id === "at-history-1")!
    const before = dashboardSummary(s).clockedIn
    s = requestAttendanceCorrection(
      s,
      original.id,
      {
        clockIn: "",
        clockOut: "2026-10-20T15:00",
        reason: "Fictional missing event",
      },
      "dashboard-correction",
      now,
    )
    s = reviewAttendance(
      s,
      "Manager",
      "dashboard-correction",
      "approved",
      "",
      true,
      now,
    )
    expect(dashboardSummary(s).clockedIn).toBe(before - 1)
    expect(original.clockOut).toBeUndefined()
  })
  it("a newly assigned current shift becomes the same Staff Dashboard/My Shifts highlight", () => {
    const s = saveShift(
      seed(),
      "Manager",
      {
        ...f,
        staffId: "s3",
        houseId: "h2",
        date: "2026-10-22",
        start: "12:00",
        end: "20:00",
      },
      undefined,
      uuid,
    )
    const staff = projectStaffSnapshot({ ...s, meId: "s3" })
    expect(highlightedShift(staff)?.id).toBe(uuid)
    expect(upcomingShifts(staff)[0].id).toBe(uuid)
    expect(dashboardSummary(s).today.some((sh) => sh.id === uuid)).toBe(true)
  })
})
