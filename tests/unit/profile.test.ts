import { describe, it, expect } from "vitest"
import { developmentMockAdapter } from "../../src/modules/staff/data/development-mock-adapter"
import {
  getMyProfile,
  updateMyProfile,
  validateProfileInput,
  projectEmployee,
  editableProfileFields,
} from "../../src/modules/staff/profile/adapter"
import { myHouses } from "../../src/modules/staff/data/selectors"
const snapshot = () =>
  developmentMockAdapter.getSnapshot("s1", "2026-10-22T01:00:00.000Z")
const input = {
  phone: "+64 (00) 000-0010",
  address: "Fictional contact address",
  emergency: "Fictional emergency contact",
}
describe("own development profile", () => {
  it("uses the current employee and existing house assignments", () => {
    const s = snapshot()
    expect(getMyProfile(s)?.id).toBe("s1")
    expect(getMyProfile(s)?.employeeId).toBe("EMP-001")
    expect(myHouses(s).map((h) => h.id)).toEqual(["h1", "h2"])
  })
  it("defines only the exported contact form allowlist", () => {
    expect(editableProfileFields).toEqual(["phone", "address", "emergency"])
  })
  it.each([
    "id",
    "name",
    "preferred",
    "employeeId",
    "role",
    "status",
    "organisationId",
    "houseIds",
    "houses",
    "assignments",
    "shifts",
    "email",
    "photo",
    "permissions",
  ])("rejects unsupported %s mutation", (field) => {
    const s = snapshot()
    expect(() => updateMyProfile(s, { ...input, [field]: "forged" })).toThrow(
      "unavailable",
    )
    expect(getMyProfile(s)?.name).toBe("Jamie Taufa")
  })
  it("rejects malformed payloads and nonstring inputs", () => {
    for (const value of [
      null,
      [],
      "invalid",
      {},
      { ...input, phone: 123 },
      { ...input, address: null },
      { ...input, emergency: 3 },
    ])
      expect(() => updateMyProfile(snapshot(), value)).toThrow()
  })
  it.each([
    "",
    "abc01234567",
    "123456",
    "+1++2345678",
    "1234567890123456",
    "0".repeat(33),
  ])("validates unsupported phone %s", (phone) => {
    expect(validateProfileInput({ ...input, phone })).toHaveProperty("phone")
  })
  it("accepts basic phone punctuation and optional blank contact details", () => {
    expect(
      validateProfileInput({ ...input, address: "", emergency: "" }),
    ).toEqual({})
    expect(validateProfileInput({ ...input, phone: "000 000 0010" })).toEqual(
      {},
    )
  })
  it("enforces text lengths without inventing postal or emergency escalation policy", () => {
    expect(
      validateProfileInput({
        ...input,
        address: "x".repeat(241),
        emergency: "x".repeat(161),
      }),
    ).toMatchObject({
      address: expect.any(String),
      emergency: expect.any(String),
    })
  })
  it("updates only own permitted values and preserves identity, account, colleagues and all historical references", () => {
    const s = snapshot(),
      next = updateMyProfile(s, { ...input, address: "  Fictional address  " })
    expect(getMyProfile(next)).toMatchObject({
      id: "s1",
      name: "Jamie Taufa",
      employeeId: "EMP-001",
      role: "Support Worker",
      status: "Active",
      address: "Fictional address",
      phone: input.phone,
    })
    expect(next.staff.find((e) => e.id === "s2")).toBe(
      s.staff.find((e) => e.id === "s2"),
    )
    for (const key of [
      "assignments",
      "shifts",
      "attendance",
      "attendanceCorrections",
      "diary",
      "careRecords",
      "corrections",
      "concerns",
      "notificationReads",
      "leaveRequests",
      "attachments",
    ] as const)
      expect(next[key]).toBe(s[key])
    expect(s.staff.find((e) => e.id === "s1")?.phone).toBe("000 000 0010")
  })
  it("rejects absent/unsupported current employee without accepting a target employee parameter", () => {
    const s = snapshot()
    expect(getMyProfile({ ...s, meId: "missing" })).toBeUndefined()
    expect(() => updateMyProfile({ ...s, meId: "missing" }, input)).toThrow()
    expect(() =>
      updateMyProfile(
        { ...s, staff: s.staff.map((e) => ({ ...e, role: "Unknown" })) },
        input,
      ),
    ).toThrow()
  })
  it("does not serialise coworker private profile metadata", () => {
    const s = snapshot()
    expect(JSON.stringify(s)).not.toContain("PRIVATE_COWORKER_PROFILE_ADDRESS")
    expect(JSON.stringify(s)).not.toContain(
      "PRIVATE_COWORKER_EMERGENCY_CONTACT",
    )
    const coworker = developmentMockAdapter.getSnapshot("s2", s.now)
    expect(getMyProfile(coworker)?.address).toBe(
      "PRIVATE_COWORKER_PROFILE_ADDRESS",
    )
    expect(coworker.staff.find((e) => e.id === "s1")).not.toHaveProperty(
      "phone",
    )
  })
  it("projects broad employee records without private contact/status fields", () => {
    const own = getMyProfile(snapshot())!
    expect(projectEmployee(own, "s1")).toEqual(own)
    const publicRecord = projectEmployee(own, "s2")
    for (const key of [
      "phone",
      "address",
      "emergency",
      "preferred",
      "started",
      "status",
    ])
      expect(publicRecord).not.toHaveProperty(key)
  })
  it("handles an employee with no supplied personal fields or house assignments", () => {
    const s = snapshot(),
      employee = getMyProfile(s)!
    const empty = {
      ...s,
      staff: [
        {
          id: employee.id,
          name: employee.name,
          employeeId: employee.employeeId,
          email: employee.email,
          role: employee.role,
        },
      ],
      assignments: [],
    }
    expect(getMyProfile(empty)?.phone).toBeUndefined()
    expect(myHouses(empty)).toEqual([])
  })
})
