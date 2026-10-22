import { describe, it, expect } from "vitest"
import { developmentMockAdapter } from "../../src/modules/staff/data/development-mock-adapter"
import {
  highlightedShift,
  upcomingShifts,
  myHouses,
  myClients,
  visibleNotices,
} from "../../src/modules/staff/data/selectors"
import { staffHref } from "../../src/modules/staff/navigation"
const now = "2026-10-22T01:00:00.000Z"
describe("fictional staff service", () => {
  it("shows both assigned houses and only their clients", () => {
    const s = developmentMockAdapter.getSnapshot("s1", now)
    expect(myHouses(s).map((x) => x.id)).toEqual(["h1", "h2"])
    expect(myClients(s).map((x) => x.id)).toEqual(["c1", "c2", "c3"])
    expect(s.houses.some((x) => x.id === "h3")).toBe(false)
  })
  it("filters a different employee and notices without leaking draft/unrelated data", () => {
    const s = developmentMockAdapter.getSnapshot("s2", now)
    expect(myHouses(s).map((x) => x.id)).toEqual(["h1"])
    expect(myClients(s).map((x) => x.id)).toEqual(["c1", "c2"])
    expect(visibleNotices(s).map((x) => x.id)).toEqual(["n1", "n3"])
    expect(() => developmentMockAdapter.getSnapshot("unknown", now)).toThrow()
  })
  it("chooses current shift, then nearest upcoming, excluding completed and unassigned shifts", () => {
    const s = developmentMockAdapter.getSnapshot("s1", now)
    expect(highlightedShift(s)?.id).toBe("sh1")
    const later = { ...s, now: "2026-10-22T08:00:00Z" }
    expect(highlightedShift(later)?.id).toBe("sh2")
    expect(upcomingShifts(later).map((x) => x.id)).not.toContain("sh1")
    expect(highlightedShift({ ...s, shifts: [] })).toBeUndefined()
  })
  it("includes highlighted shift in exactly three initial entries", () => {
    const s = developmentMockAdapter.getSnapshot("s1", now)
    const rows = upcomingShifts(s).slice(0, 3)
    expect(rows).toHaveLength(3)
    expect(rows[0].id).toBe(highlightedShift(s)?.id)
  })
  it("builds detail and query URLs", () => {
    expect(staffHref({ page: "client", id: "c3" })).toBe("/clients/c3")
    expect(staffHref({ page: "roster", tab: "team" })).toBe("/roster?tab=team")
  })
})
