import {
  submitConcern,
  getParentAttachments,
} from "../../src/modules/staff/notifications/adapter"
import { nzDay } from "../../src/modules/staff/roster/dates"
import { describe, it, expect } from "vitest"
import { developmentMockAdapter } from "../../src/modules/staff/data/development-mock-adapter"
import { projectStaffSnapshot } from "../../src/modules/staff/data/projection"
import { getClient, getHouse } from "../../src/modules/staff/data/queries"
import { updateMyProfile } from "../../src/modules/staff/profile/adapter"
import { mergeSnapshot } from "../../src/modules/preview/merge"
import { adminHref } from "../../src/modules/admin/navigation"
import {
  validateEmployee,
  saveEmployee,
  assignHouses,
  setEmployeeStatus,
  validateHouse,
  saveHouse,
  validateClient,
  saveClient,
  validateContacts,
  saveContacts,
  transferClient,
  dashboardSummary,
  employeeHouses,
} from "../../src/modules/admin/data/adapter"
import type {
  EmployeeInput,
  HouseInput,
  ClientInput,
} from "../../src/modules/admin/data/types"
const now = "2026-10-22T01:00:00.000Z"
const seed = () => developmentMockAdapter.getSnapshot("s1", now, true)
const employee: EmployeeInput = {
  first: "Fictional",
  last: "Worker",
  preferred: "Demo",
  employeeId: "EMP-NEW",
  email: "new@example.invalid",
  phone: "000 000 1234",
  address: "Fictional address",
  emergency: "Fictional contact",
  role: "Support Worker",
  status: "Invited",
  started: "2026-10-22",
  houses: ["h1", "h2"],
}
const house: HouseInput = {
  name: "Fictional house",
  code: "HOUSE-NEW",
  address: "Example address",
  suburb: "Hamilton",
  phone: "000 000 4321",
  email: "house@example.invalid",
  description: "Fictional house",
  manager: "Example Manager",
  status: "Active",
  lat: "-37.78",
  lng: "175.28",
  geofence: "",
}
const client: ClientInput = {
  first: "Fictional",
  last: "Client",
  preferred: "Demo",
  dob: "2000-01-01",
  ref: "CLIENT-NEW",
  nhi: "",
  houseId: "h1",
  summary: "Fictional profile",
  status: "Active",
  alerts: "",
}
describe("Admin core domain over the shared development snapshot", () => {
  it("uses the same existing IDs, arrays and relation model; projections retain privacy", () => {
    const full = seed(),
      staff = projectStaffSnapshot(full)
    expect(staff.houses.map((h) => h.id)).toEqual(["h1", "h2"])
    expect(staff.clients).not.toContainEqual(
      expect.objectContaining({ id: "c4" }),
    )
    expect(staff.staff.find((e) => e.id === "s2")).not.toHaveProperty("address")
    expect(full.staff.some((e) => e.id === "a1")).toBe(true)
  })
  it("employee creation derives session counts and valid multi-house assignments", () => {
    const s = seed(),
      result = saveEmployee(s, "Administrator", employee)
    expect(result.data.staff).toHaveLength(s.staff.length + 1)
    expect(employeeHouses(result.data, result.id)).toEqual(["h1", "h2"])
    expect(
      result.data.staff.find((e) => e.id === result.id),
    ).not.toHaveProperty("password")
    expect(dashboardSummary(result.data).activeEmployees).toBe(
      dashboardSummary(s).activeEmployees,
    )
  })
  it.each(["Staff", "Senior Staff"] as const)(
    "%s cannot mutate employees, houses, clients, contacts or transfers",
    (role) => {
      const s = seed()
      expect(() => saveEmployee(s, role, employee)).toThrow()
      expect(() => assignHouses(s, role, "s1", ["h1"])).toThrow()
      expect(() => setEmployeeStatus(s, role, "s1", "Inactive")).toThrow()
      expect(() => saveHouse(s, role, house)).toThrow()
      expect(() => saveClient(s, role, client, [])).toThrow()
      expect(() => saveContacts(s, role, "c1", [])).toThrow()
      expect(() => transferClient(s, role, "c1", "h2", true)).toThrow()
    },
  )
  it("Manager can edit operational employees but cannot grant or edit Administrator accounts", () => {
    const s = seed()
    expect(validateEmployee(s, "Manager", employee)).toEqual({})
    expect(
      validateEmployee(s, "Manager", { ...employee, role: "Administrator" }),
    ).toHaveProperty("role")
    expect(() => setEmployeeStatus(s, "Manager", "a1", "Inactive")).toThrow()
    expect(() => assignHouses(s, "Manager", "a1", ["h1"])).toThrow()
    expect(validateEmployee(s, "Manager", employee, "a1")).toHaveProperty(
      "form",
    )
  })
  it.each([
    ["first", ""],
    ["last", ""],
    ["employeeId", " EMP-001 "],
    ["email", " JAMIE@example.invalid "],
    ["email", "invalid"],
    ["phone", "fake"],
    ["status", "Root"],
    ["started", "2026-02-30"],
    ["role", "Root"],
  ])("rejects invalid employee %s=%s", (key, value) => {
    expect(
      Object.keys(
        validateEmployee(seed(), "Administrator", {
          ...employee,
          [key]: value,
        }),
      ),
    ).not.toHaveLength(0)
  })
  it("rejects malformed, unknown management fields and bad foreign assignments", () => {
    const s = seed()
    for (const f of [
      null,
      [],
      { ...employee, password: "fake" },
      { ...employee, houses: ["missing"] },
      { ...employee, houses: ["h1", "h1"] },
    ])
      expect(
        Object.keys(validateEmployee(s, "Administrator", f)),
      ).not.toHaveLength(0)
    expect(() => assignHouses(s, "Administrator", "missing", [])).toThrow()
    expect(() => assignHouses(s, "Administrator", "s1", ["missing"])).toThrow()
  })
  it("adding a house updates the same employee's Staff scope without altering history", () => {
    const s = seed(),
      next = assignHouses(s, "Administrator", "s1", ["h1", "h2", "h3"])
    expect(getHouse(projectStaffSnapshot(next), "h3")?.id).toBe("h3")
    expect(getClient(projectStaffSnapshot(next), "c4")?.id).toBe("c4")
    expect(next.diary).toBe(s.diary)
    expect(next.careRecords).toBe(s.careRecords)
    expect(next.shifts).toBe(s.shifts)
  })
  it("blocks removal with current/future shifts and retains roster", () => {
    const s = seed()
    expect(() => assignHouses(s, "Administrator", "s1", ["h1"])).toThrow(
      /scheduled shifts/,
    )
    expect(
      s.shifts.some((sh) => sh.staffId === "s1" && sh.houseId === "h2"),
    ).toBe(true)
  })
  it("allows non-conflicting removal, withdrawing house/client visibility while retaining authorship", () => {
    let s = seed()
    s = assignHouses(s, "Administrator", "s1", ["h1", "h2", "h3"])
    const next = assignHouses(s, "Administrator", "s1", ["h1", "h2"])
    expect(getHouse(projectStaffSnapshot(next), "h3")).toBeUndefined()
    expect(getClient(projectStaffSnapshot(next), "c4")).toBeUndefined()
    expect(next.diary).toBe(s.diary)
    expect(next.attendance).toBe(s.attendance)
  })
  it("deactivation is reversible and retains historical records/assignments", () => {
    const s = seed(),
      next = setEmployeeStatus(s, "Administrator", "s1", "Inactive")
    expect(projectStaffSnapshot(next).houses).toEqual([])
    expect(next.diary).toBe(s.diary)
    expect(next.careRecords).toBe(s.careRecords)
    expect(next.assignments).toBe(s.assignments)
    expect(
      projectStaffSnapshot(
        setEmployeeStatus(next, "Administrator", "s1", "Active"),
      ).houses,
    ).toHaveLength(2)
  })
  it("Admin contact edits propagate to Staff and Staff edits preserve broader domain arrays", () => {
    const s = seed(),
      mine = s.staff.find((e) => e.id === "s1")!,
      [first, ...last] = mine.name.split(" ")
    const next = saveEmployee(
      s,
      "Administrator",
      {
        ...employee,
        first,
        last: last.join(" "),
        employeeId: mine.employeeId,
        email: mine.email,
        phone: "000 000 9999",
        role: mine.role,
        status: "Active",
        houses: ["h1", "h2"],
      },
      "s1",
    ).data
    expect(
      projectStaffSnapshot(next).staff.find((e) => e.id === "s1")?.phone,
    ).toBe("000 000 9999")
    const patch = updateMyProfile(projectStaffSnapshot(next), {
        phone: "000 000 8888",
        address: "Fictional",
        emergency: "Demo",
      }),
      merged = mergeSnapshot(next, patch)
    expect(merged.houses).toHaveLength(3)
    expect(merged.clients).toHaveLength(4)
    expect(merged.careAssignments).toHaveLength(next.careAssignments.length)
    expect(merged.staff.find((e) => e.id === "s2")?.address).toBe(
      "PRIVATE_COWORKER_PROFILE_ADDRESS",
    )
    expect(merged.diary.map((d) => d.authorId)).toEqual(
      next.diary.map((d) => d.authorId),
    )
  })
  it("house creation and editing use shared counts and Staff information", () => {
    const s = seed(),
      created = saveHouse(s, "Manager", house),
      next = saveHouse(
        created.data,
        "Administrator",
        { ...house, name: "Updated Riverside", code: "HOUSE-1" },
        "h1",
      )
    expect(dashboardSummary(created.data).houses).toBe(
      dashboardSummary(s).houses + 1,
    )
    expect(getHouse(projectStaffSnapshot(next.data), "h1")?.name).toBe(
      "Updated Riverside",
    )
    expect(
      next.data.houses.find((h) => h.id === created.id)?.geofence,
    ).toBeNull()
  })
  it.each([
    ["name", ""],
    ["code", "HOUSE-1"],
    ["address", ""],
    ["phone", "invalid"],
    ["email", "invalid"],
    ["lat", "NaN"],
    ["lat", "91"],
    ["lng", "181"],
    ["geofence", "-1"],
  ])("rejects invalid house %s=%s", (key, value) => {
    expect(
      Object.keys(
        validateHouse(seed(), "Administrator", { ...house, [key]: value }),
      ),
    ).not.toHaveLength(0)
  })
  it("permits explicitly unconfigured location, never inventing verification/radius", () => {
    const s = saveHouse(seed(), "Administrator", {
        ...house,
        lat: "",
        lng: "",
      }).data,
      h = s.houses.at(-1)!
    expect(h.locationSet).toBe(false)
    expect(h.geofence).toBeNull()
    expect(
      Object.keys(
        validateHouse(seed(), "Administrator", {
          ...house,
          lat: "",
          lng: "175",
        }),
      ),
    ).toContain("lat")
  })
  it.each([
    ["first", ""],
    ["last", ""],
    ["ref", "CLIENT-1"],
    ["houseId", "missing"],
    ["dob", "2026-02-30"],
    ["dob", "2030-01-01"],
    ["nhi", "bad"],
  ])("rejects invalid client %s=%s", (key, value) => {
    expect(
      Object.keys(
        validateClient(seed(), "Administrator", { ...client, [key]: value }),
      ),
    ).not.toHaveLength(0)
  })
  it("creates one current client-house relationship visible only to assigned staff", () => {
    const s = seed(),
      r = saveClient(s, "Manager", client, [])
    expect(getClient(projectStaffSnapshot(r.data), r.id)?.houseId).toBe("h1")
    expect(
      getClient(projectStaffSnapshot({ ...r.data, meId: "s3" }), r.id),
    ).toBeUndefined()
    expect(dashboardSummary(r.data).clients).toBe(
      dashboardSummary(s).clients + 1,
    )
  })
  it("contact mutations preserve IDs and enforce at most one primary, multiple emergency allowed", () => {
    const s = seed(),
      contacts = s.clients
        .find((c) => c.id === "c1")!
        .contacts.map((c) => ({ ...c, emergency: true }))
    contacts[0].phone = "000 000 3333"
    const next = saveContacts(s, "Manager", "c1", contacts)
    expect(getClient(projectStaffSnapshot(next), "c1")?.contacts[0]).toEqual(
      contacts[0],
    )
    expect(validateContacts(contacts)).toEqual({})
    expect(
      validateContacts(contacts.map((c) => ({ ...c, primary: true }))),
    ).toHaveProperty("contacts")
    expect(validateContacts([...contacts, contacts[0]])).toHaveProperty(
      "contacts",
    )
    expect(next.diary).toBe(s.diary)
  })
  it.each([
    null,
    [{ id: "x", name: "", relation: "Parent" }],
    [{ id: "x", name: "Demo", relation: "" }],
    [{ id: "x", name: "Demo", relation: "Parent", email: "bad" }],
    [{ id: "x", name: "Demo", relation: "Parent", phone: "bad" }],
    [{ id: "x", name: "Demo", relation: "Parent", primary: "yes" }],
  ])("rejects invalid contact input %#", (input) => {
    expect(validateContacts(input)).toHaveProperty("contacts")
  })
  it("requires explicit transfer confirmation and preserves all historical collections", () => {
    const s = seed()
    expect(() =>
      transferClient(s, "Administrator", "c1", "h3", false),
    ).toThrow()
    expect(() =>
      transferClient(s, "Administrator", "missing", "h3", true),
    ).toThrow()
    expect(() =>
      transferClient(s, "Administrator", "c1", "missing", true),
    ).toThrow()
    const next = transferClient(s, "Administrator", "c1", "h3", true)
    expect(getClient(projectStaffSnapshot(next), "c1")).toBeUndefined()
    expect(
      getClient(projectStaffSnapshot({ ...next, meId: "s4" }), "c1")?.id,
    ).toBe("c1")
    expect(
      getClient(
        projectStaffSnapshot(
          assignHouses(next, "Administrator", "s1", ["h1", "h2", "h3"]),
        ),
        "c1",
      )?.houseId,
    ).toBe("h3")
    for (const key of [
      "diary",
      "careRecords",
      "careTemplates",
      "careAssignments",
      "attachments",
      "attendance",
      "shifts",
      "corrections",
    ] as const)
      expect(next[key]).toBe(s[key])
    expect(next.clients.find((c) => c.id === "c1")?.contacts).toBe(
      s.clients.find((c) => c.id === "c1")?.contacts,
    )
  })
  it("client editing cannot bypass the explicit transfer workflow", () => {
    expect(
      validateClient(
        seed(),
        "Administrator",
        { ...client, ref: "CLIENT-1", houseId: "h3" },
        "c1",
      ),
    ).toHaveProperty("houseId")
  })
  it("dashboard totals derive from actual collections including corrections across record kinds", () => {
    const s = seed(),
      summary = dashboardSummary(s)
    expect(summary.corrections).toBe(
      s.corrections.filter((c) => c.status === "pending").length +
        s.attendanceCorrections.filter((c) => c.status === "pending").length,
    )
    expect(summary.clockedIn).toBe(
      s.attendance.filter((a) => a.clockIn && !a.clockOut).length,
    )
    expect(summary.today.every((sh) => nzDay(sh.start) === "2026-10-22")).toBe(
      true,
    )
  })
  it("stable route mapping supports core entity links and future modules", () => {
    expect(adminHref({ page: "employee", id: "s1", tab: "houses" })).toBe(
      "/admin/employees/s1?tab=houses",
    )
    expect(adminHref({ page: "house-form", id: "h1" })).toBe(
      "/admin/houses/h1/edit",
    )
    expect(adminHref({ page: "client-form" })).toBe("/admin/clients/new")
    expect(adminHref({ page: "docs" })).toBe("/admin/documentation")
  })
})
it("shared job roles permit ordinary Senior/Team Leader Staff views without management grants", () => {
  for (const role of ["Senior Support Worker", "Team Leader"]) {
    const s = seed()
    s.staff = s.staff.map((e) => (e.id === "s1" ? { ...e, role } : e))
    expect(projectStaffSnapshot(s).houses).toHaveLength(2)
    expect(getClient(projectStaffSnapshot(s), "c1")?.id).toBe("c1")
    expect(() => saveHouse(s, "Senior Staff", house)).toThrow()
  }
})
it("restricted client NHI is absent from the Staff projection and directory/search contracts", () => {
  const s = seed()
  s.clients = s.clients.map((c) =>
    c.id === "c1" ? { ...c, nhi: "ZZZ1234" } : c,
  )
  expect(s.clients.find((c) => c.id === "c1")?.nhi).toBe("ZZZ1234")
  expect(
    projectStaffSnapshot(s).clients.find((c) => c.id === "c1"),
  ).not.toHaveProperty("nhi")
})

it("shared re-projection retains authorised session concern attachment metadata and excludes other authors", () => {
  const s = seed(),
    next = submitConcern(
      s,
      {
        title: "Fictional concern",
        description: "Fictional observation only.",
        context: "client",
        targetId: "c1",
        priority: "Medium",
        attachment: { name: "example.txt", type: "text/plain", size: 24 },
      },
      "session-concern",
      now,
    )
  const view = projectStaffSnapshot(next),
    concern = view.concerns.find((c) => c.id === "session-concern")!
  expect(getParentAttachments(view, concern, "concern")).toHaveLength(1)
  expect(getParentAttachments(view, concern, "concern")[0]).toMatchObject({
    name: "example.txt",
    availability: "sessionOnly",
    association: { scope: "concern", targetId: "session-concern" },
  })
  expect(
    projectStaffSnapshot({ ...next, meId: "s2" }).attachments.some(
      (f) => f.association.targetId === "session-concern",
    ),
  ).toBe(false)
  const merged = mergeSnapshot(s, view)
  expect(
    getParentAttachments(projectStaffSnapshot(merged), concern, "concern"),
  ).toHaveLength(1)
})
