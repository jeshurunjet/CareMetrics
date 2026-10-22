import { describe, it, expect } from "vitest"
import { developmentMockAdapter as service } from "../../src/modules/staff/data/development-mock-adapter"
import { ageOnDate, formatDateOnly } from "../../src/lib/time"
import { isClientTab, isHouseTab } from "../../src/modules/staff/data/sections"
const now = "2026-10-22T01:00:00.000Z"
const s = service.getSnapshot("s1", now)
describe("Phase 1B mock retrieval", () => {
  it("retrieves every assigned house and its own clients", () => {
    expect(service.getHouses(s).map((h) => h.id)).toEqual(["h1", "h2"])
    expect(service.getHouse(s, "h2")?.name).toBe("Sunrise House")
    expect(service.getClientsByHouse(s, "h1").map((c) => c.id)).toEqual([
      "c1",
      "c2",
    ])
    expect(service.getClientsByHouse(s, "h2").map((c) => c.id)).toEqual(["c3"])
  })
  it("keeps each client, contacts and house together", () => {
    expect(service.getClient(s, "c1")?.houseId).toBe("h1")
    expect(service.getClient(s, "c3")?.houseId).toBe("h2")
    const contacts = service.getClientContacts(s, "c1")
    expect(contacts.map((c) => c.name)).toEqual(["Morgan Reed", "Devon Reed"])
    expect(contacts[0]).toMatchObject({ primary: true, emergency: true })
    expect(service.getClientContacts(s, "c3").map((c) => c.name)).toEqual([
      "Riley Quinn",
    ])
  })
  it("supports missing optional contacts and profile fields", () => {
    expect(service.getClientContacts(s, "c2")).toEqual([])
    expect(service.getClientContacts(s, "c3")[0].phone).toBeUndefined()
    expect(service.getClient(s, "c3")?.dob).toBeUndefined()
  })
  it("rejects invalid and unassigned identifiers consistently", () => {
    for (const id of ["h3", "missing", "../h1"]) {
      expect(service.getHouse(s, id)).toBeUndefined()
      expect(service.getClientsByHouse(s, id)).toEqual([])
    }
    for (const id of ["c4", "missing", "../c1"]) {
      expect(service.getClient(s, id)).toBeUndefined()
      expect(service.getClientContacts(s, id)).toEqual([])
    }
  })
  it("rechecks scope even when passed a broader dataset", () => {
    const wider = {
      ...s,
      houses: [...s.houses, { ...s.houses[0], id: "h3" }],
      clients: [
        ...s.clients,
        { ...s.clients[0], id: "c4", name: "Excluded Example", houseId: "h3" },
      ],
    }
    expect(service.getHouse(wider, "h3")).toBeUndefined()
    expect(service.getClient(wider, "c4")).toBeUndefined()
    expect(service.getClientContacts(wider, "c4")).toEqual([])
    expect(service.search(wider, "Excluded").clients).toEqual([])
  })
  it("supports another employee and empty assignments", () => {
    const other = service.getSnapshot("s2", now)
    expect(service.getHouse(other, "h2")).toBeUndefined()
    expect(service.getClient(other, "c3")).toBeUndefined()
    expect(service.getHouses({ ...s, assignments: [] })).toEqual([])
    expect(service.getClients({ ...s, assignments: [] })).toEqual([])
  })
})
describe("scoped general search", () => {
  it("finds full and preferred client names case-insensitively", () => {
    expect(service.search(s, "  TAYLOR  ").clients.map((c) => c.id)).toEqual([
      "c1",
    ])
    expect(service.search(s, "Jordy").clients.map((c) => c.id)).toEqual(["c3"])
  })
  it("returns matching house and all its authorised clients", () => {
    const results = service.search(s, "Riverside")
    expect(results.houses.map((h) => h.id)).toEqual(["h1"])
    expect(results.clients.map((c) => c.id)).toEqual(["c1", "c2"])
    expect(results.houses[0].clientNames).toEqual(["Taylor", "Casey"])
  })
  it("keeps empty, no-match and unassigned searches empty", () => {
    for (const q of [
      "",
      "   ",
      "Cedar",
      "Unassigned Example",
      "does-not-exist",
    ])
      expect(service.search(s, q)).toEqual({ houses: [], clients: [] })
  })
  it("does not search or return contact/private profile details", () => {
    for (const q of [
      "Morgan Reed",
      "000 000 0101",
      "1998-04-12",
      "NHI",
      "gardening",
    ])
      expect(service.search(s, q)).toEqual({ houses: [], clients: [] })
    const result = service.search(s, "Taylor").clients[0]
    expect(Object.keys(result).sort()).toEqual([
      "houseId",
      "houseName",
      "id",
      "name",
      "photo",
      "preferred",
      "tone",
    ])
    expect(JSON.stringify(result)).not.toMatch(
      /Morgan|contacts|dob|summary|alerts|nhi/,
    )
  })
})
it("formats birth dates as calendar dates and calculates birthdays in NZ", () => {
  expect(formatDateOnly("1998-04-12")).toBe("12 April 1998")
  expect(ageOnDate("1998-04-12", "2026-04-11T00:00:00Z")).toBe(27)
  expect(ageOnDate("1998-04-12", "2026-04-11T12:00:00Z")).toBe(28)
})
it("validates section query values without accepting arbitrary destinations", () => {
  expect(isHouseTab("files")).toBe(true)
  expect(isClientTab("care")).toBe(true)
  expect(isHouseTab(["overview"])).toBe(false)
  expect(isClientTab("unknown")).toBe(false)
})
