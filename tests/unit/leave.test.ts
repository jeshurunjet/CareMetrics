import { describe, it, expect } from "vitest"
import { developmentMockAdapter as adapter } from "../../src/modules/staff/data/development-mock-adapter"
import {
  getMyLeave,
  getLeaveRequest,
  getMyLeaveBalances,
  getLeaveTypes,
  findLeaveOverlaps,
  getLeaveRosterContext,
  queryLeaveHistory,
  validateLeaveInput,
  createLeaveRequest,
  getLeaveSummary,
  calendarDays,
  leaveStatusLabel,
} from "../../src/modules/staff/leave/adapter"
const now = "2026-10-22T01:00:00.000Z",
  get = () => adapter.getSnapshot("s1", now),
  input = {
    typeId: "annual",
    start: "2026-11-01",
    end: "2026-11-02",
    notes: "Fictional absence",
  }
describe("shared fictional leave workflow", () => {
  it("scopes requests and balances to the employee, including broad snapshots", () => {
    const s = get()
    expect(s.leaveRequests).toHaveLength(8)
    expect(s.leaveRequests.every((r) => r.employeeId === "s1")).toBe(true)
    expect(s.leaveBalances.every((b) => b.employeeId === "s1")).toBe(true)
    const other = adapter.getSnapshot("s2", now)
    expect(getLeaveRequest(s, "leave-other-employee")).toBeUndefined()
    const broad = {
      ...s,
      leaveRequests: [...s.leaveRequests, ...other.leaveRequests],
      leaveBalances: [...s.leaveBalances, ...other.leaveBalances],
    }
    expect(getMyLeave(broad)).toEqual(s.leaveRequests)
    expect(getMyLeaveBalances(broad)).toEqual(s.leaveBalances)
    expect(getLeaveRequest(broad, "leave-other-employee")).toBeUndefined()
    expect(getLeaveRequest(broad, "unknown")).toBeUndefined()
  })
  it("supports an employee with no requests or supplied balances without inventing values", () => {
    const s = adapter.getSnapshot("s3", now)
    expect(getMyLeave(s)).toEqual([])
    expect(getMyLeaveBalances(s)).toEqual([])
    expect(getLeaveSummary(s)).toEqual({
      pending: 0,
      approved: 0,
      upcoming: [],
    })
  })
  it("offers only configured active types while preserving archived historical records", () => {
    const s = get()
    expect(getLeaveTypes(s).map((t) => t.id)).toEqual([
      "annual",
      "sick",
      "bereavement",
      "alternative",
      "unpaid",
    ])
    expect(
      validateLeaveInput(s, { ...input, typeId: "legacy" }),
    ).toHaveProperty("typeId")
    const configured = {
      ...s,
      leaveTypes: [
        { id: "custom", name: "Configured demo type", active: true },
      ],
    }
    expect(
      validateLeaveInput(configured, { ...input, typeId: "custom" }),
    ).toEqual({})
    expect(getLeaveRequest(s, "leave-history-5")?.typeId).toBe("legacy")
  })
  it("validates missing, unknown type, impossible and reversed dates but permits optional notes", () => {
    const s = get()
    expect(
      validateLeaveInput(s, { typeId: "", start: "", end: "", notes: "" }),
    ).toMatchObject({
      typeId: expect.any(String),
      start: expect.any(String),
      end: expect.any(String),
    })
    expect(
      validateLeaveInput(s, { ...input, start: "2026-02-30" }),
    ).toHaveProperty("start")
    expect(
      validateLeaveInput(s, { ...input, end: "2026-01-01" }),
    ).toHaveProperty("end")
    expect(
      validateLeaveInput(s, { ...input, typeId: "unknown" }),
    ).toHaveProperty("typeId")
    expect(validateLeaveInput(s, { ...input, notes: "" })).toEqual({})
    expect(() =>
      createLeaveRequest({ ...s, meId: "unknown" }, input, "id", now),
    ).toThrow(/Employee/)
  })
  it("uses whole calendar days across month/leap/DST boundaries without calculating entitlement", () => {
    expect(calendarDays("2028-02-28", "2028-03-01")).toBe(3)
    expect(calendarDays("2026-09-26", "2026-09-28")).toBe(3)
    expect(calendarDays("2026-10-22", "2026-10-22")).toBe(1)
    expect(calendarDays("2026-02-30", "2026-03-01")).toBeUndefined()
    expect(calendarDays("2026-11-02", "2026-11-01")).toBeUndefined()
  })
  it("warns about own pending/approved overlap without blocking submission or including rejected/other employees", () => {
    const s = get()
    expect(
      findLeaveOverlaps(s, "2026-10-23", "2026-10-24").map((r) => r.id),
    ).toEqual(["leave-approved"])
    expect(
      findLeaveOverlaps(s, "2026-10-29", "2026-10-29").map((r) => r.id),
    ).toEqual(["leave-pending"])
    expect(findLeaveOverlaps(s, "2026-10-26", "2026-10-26")).toEqual([])
    const next = createLeaveRequest(
      s,
      { ...input, start: "2026-10-23", end: "2026-10-24" },
      "overlap",
      now,
    )
    expect(getLeaveRequest(next, "overlap")?.status).toBe("pending")
  })
  it("creates pending own requests while ignoring forged employee, status and management fields", () => {
    const s = get(),
      before = structuredClone(s),
      forged = {
        ...input,
        employeeId: "s2",
        status: "approved",
        decision: { reviewerName: "Forged", decidedAt: now },
      }
    const next = createLeaveRequest(s, forged, "new", now)
    expect(getLeaveRequest(next, "new")).toEqual({
      id: "new",
      employeeId: "s1",
      ...input,
      submittedAt: now,
      status: "pending",
    })
    expect(s).toEqual(before)
    expect(next.shifts).toBe(s.shifts)
    expect(next.attendance).toBe(s.attendance)
    expect(next.attendanceCorrections).toBe(s.attendanceCorrections)
    expect(next.leaveBalances).toBe(s.leaveBalances)
    expect(getLeaveRequest(get(), "new")).toBeUndefined()
    expect(() => createLeaveRequest(next, input, "new", now)).toThrow(
      /metadata/,
    )
  })
  it("filters newest submission first with type/status/search/date-intersection and pagination", () => {
    const s = get()
    expect(queryLeaveHistory(s).items).toHaveLength(6)
    expect(queryLeaveHistory(s).items[0].id).toBe("leave-pending")
    expect(queryLeaveHistory(s, "", "", "", "", "", 2).items).toHaveLength(2)
    expect(queryLeaveHistory(s, "", "approved").total).toBe(4)
    expect(queryLeaveHistory(s, "", "", "sick").total).toBe(2)
    expect(queryLeaveHistory(s, "awaiting review").items[0].id).toBe(
      "leave-pending",
    )
    expect(
      queryLeaveHistory(s, "", "", "", "2026-10-24", "2026-10-24").items.map(
        (r) => r.id,
      ),
    ).toEqual(["leave-approved"])
    expect(queryLeaveHistory(s, "does not match").items).toEqual([])
  })
  it("keeps own overlapping shifts as read-only context, including overnight overlap and excluding cancellation", () => {
    const s = get()
    expect(
      getLeaveRosterContext(s, "2026-10-23", "2026-10-24").map((sh) => sh.id),
    ).toEqual(["sh2", "sh3"])
    expect(
      getLeaveRosterContext(s, "2026-10-22", "2026-10-22").map((sh) => sh.id),
    ).toContain("overnight")
    expect(
      getLeaveRosterContext(s, "2026-10-25", "2026-10-25").map((sh) => sh.id),
    ).not.toContain("cancelled")
    expect(getLeaveRosterContext(s, "2026-01-01", "2026-01-02")).toEqual([])
    expect(s.shifts).toEqual(get().shifts)
  })
  it("shows consistent decision/status metadata and supplies no staff review/cancel/withdraw operation", () => {
    const s = get()
    expect(getLeaveSummary(s).upcoming.map((r) => r.id)).toEqual([
      "leave-approved",
    ])
    expect(getLeaveRequest(s, "leave-approved")?.decision?.reviewerName).toBe(
      "Mere Walker (demo)",
    )
    expect(getLeaveRequest(s, "leave-rejected")?.decision?.notes).toContain(
      "alternative dates",
    )
    expect(
      ["pending", "approved", "rejected"].map((st) =>
        leaveStatusLabel(st as "pending" | "approved" | "rejected"),
      ),
    ).toEqual(["Pending Review", "Approved", "Rejected"])
    for (const key of [
      "approveLeave",
      "rejectLeave",
      "cancelLeave",
      "withdrawLeave",
    ])
      expect(adapter).not.toHaveProperty(key)
  })
})
