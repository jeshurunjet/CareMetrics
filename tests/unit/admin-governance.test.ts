import { describe, it, expect } from "vitest"
import { developmentMockAdapter } from "../../src/modules/staff/data/development-mock-adapter"
import {
  audienceLabel,
  managedFiles,
  removeFile,
  addManagementFiles,
  saveNotice,
  withdrawNotice,
  validateNotice,
  managedConcerns,
  reviewConcern,
  type NoticeInput,
} from "../../src/modules/admin/governance/adapter"
import developmentEvents from "../../src/modules/admin/governance/audit"
import {
  getGalleryFiles,
  getGalleryFile,
  getDemoAsset,
} from "../../src/modules/staff/files/adapter"
import { visibleNotices } from "../../src/modules/staff/data/selectors"
import { projectStaffSnapshot } from "../../src/modules/staff/data/projection"
import { mergeSnapshot } from "../../src/modules/preview/merge"
import {
  markNoticeRead,
  unreadCount,
  submitConcern,
  getConcern,
} from "../../src/modules/staff/notifications/adapter"
import { developmentFilePolicy } from "../../src/modules/staff/files/policy"
const now = "2026-10-22T01:00:00.000Z",
  role = "Administrator",
  seed = () => developmentMockAdapter.getSnapshot("s1", now, true)
const input = (patch: Partial<NoticeInput> = {}): NoticeInput => ({
  title: "Fictional notice",
  body: "Fictional message for this development session.",
  category: "staff",
  priority: "Normal",
  targetAudience: { kind: "organisation" },
  ...patch,
})
const client = { scope: "client" as const, targetId: "c1" },
  house = { scope: "house" as const, targetId: "h1" }
const file = {
  id: "selected",
  name: "example.txt",
  type: "text/plain",
  size: 12,
}
describe("shared Admin files", () => {
  it("reads only explicit gallery records, reusing the shared objects", () => {
    const s = seed()
    expect(managedFiles(s, role).find((f) => f.id === "client-garden")).toBe(
      s.attachments.find((f) => f.id === "client-garden"),
    )
    expect(
      getGalleryFiles(s, client).every(
        (f) =>
          f.association.scope === "client" && f.association.targetId === "c1",
      ),
    ).toBe(true)
    expect(getGalleryFiles(s, house).map((f) => f.id)).not.toContain(
      "client-garden",
    )
  })
  it.each(["Manager", "Administrator"])(
    "%s removes logically while preserving original metadata and other collections",
    (r) => {
      const s = seed(),
        f = s.attachments.find((f) => f.id === "client-garden")!,
        next = removeFile(s, r, f.id, "Wrong demonstration selection", now)
      expect(next.attachments.find((x) => x.id === f.id)).toEqual({
        ...f,
        removed: {
          byId: r === "Manager" ? "m1" : "a1",
          byName: s.staff.find((x) => x.id === (r === "Manager" ? "m1" : "a1"))!
            .name,
          at: now,
          reason: "Wrong demonstration selection",
        },
      })
      expect(next.diary).toBe(s.diary)
      expect(next.corrections).toBe(s.corrections)
      expect(next.attendance).toBe(s.attendance)
      expect(next.careRecords).toBe(s.careRecords)
      expect(s.attachments.find((x) => x.id === f.id)?.removed).toBeUndefined()
    },
  )
  it("removal hides listings, direct Staff detail and demo downloads while management retains metadata", () => {
    const s = removeFile(seed(), role, "client-garden", "Test removal", now)
    expect(getGalleryFile(s, client, "client-garden")).toBeUndefined()
    expect(
      projectStaffSnapshot(s).attachments.some((f) => f.id === "client-garden"),
    ).toBe(false)
    expect(
      getDemoAsset(s.attachments.find((f) => f.id === "client-garden")!),
    ).toBeUndefined()
    expect(
      managedFiles(s, role).find((f) => f.id === "client-garden")?.removed,
    ).toBeTruthy()
  })
  it.each(["Staff", "Senior Staff", "Support Worker", "unknown"])(
    "%s cannot remove, upload or read management files",
    (r) => {
      expect(() =>
        removeFile(seed(), r, "client-garden", "test", now),
      ).toThrow()
      expect(() => addManagementFiles(seed(), r, client, [file], now)).toThrow()
      expect(() => managedFiles(seed(), r)).toThrow()
    },
  )
  it.each(["missing", "notice-demo-file"])(
    "rejects missing/non-gallery id %s",
    (id) => expect(() => removeFile(seed(), role, id, "test", now)).toThrow(),
  )
  it("requires reason, current file and valid event time", () => {
    expect(() => removeFile(seed(), role, "client-garden", "", now)).toThrow()
    expect(() =>
      removeFile(seed(), role, "client-garden", "test", "invalid"),
    ).toThrow()
    expect(() =>
      removeFile(seed(), role, "client-garden", "test", "2000-01-01T00:00:00Z"),
    ).toThrow()
    expect(() =>
      removeFile(
        removeFile(seed(), role, "client-garden", "first", now),
        role,
        "client-garden",
        "second",
        now,
      ),
    ).toThrow()
  })
  it("adds validated metadata to the exact gallery without contents/URLs", () => {
    const s = addManagementFiles(
        seed(),
        role,
        house,
        [{ ...file, description: "Demo" }],
        now,
      ),
      f = s.attachments.find((x) => x.id === file.id)!
    expect(f.association).toEqual(house)
    expect(f.uploadedById).toBe("a1")
    expect(f.availability).toBe("sessionOnly")
    expect(f).not.toHaveProperty("url")
    expect(getGalleryFiles(s, client).some((x) => x.id === file.id)).toBe(false)
    expect(getGalleryFiles(s, house).some((x) => x.id === file.id)).toBe(true)
  })
  it.each([
    { ...file, size: developmentFilePolicy.maxBytes + 1 },
    { ...file, name: "active.svg", type: "image/svg+xml" },
    { ...file, size: 0 },
  ])("reuses configured file validation", (f) =>
    expect(() => addManagementFiles(seed(), role, client, [f], now)).toThrow(),
  )
  it("rejects duplicate IDs and invalid associations", () => {
    expect(() =>
      addManagementFiles(
        seed(),
        role,
        { scope: "client", targetId: "missing" },
        [file],
        now,
      ),
    ).toThrow()
    expect(() =>
      addManagementFiles(seed(), role, client, [file, file], now),
    ).toThrow()
  })
  it("does not resurrect removed files through scoped Staff merges", () => {
    const s = removeFile(seed(), role, "client-garden", "test", now),
      merged = mergeSnapshot(s, projectStaffSnapshot(s))
    expect(
      merged.attachments.find((f) => f.id === "client-garden")?.removed,
    ).toBeTruthy()
  })
})
describe("official notice configuration and audience", () => {
  it("labels legacy organisation audiences with their effective parent scope", () => {
    const s = seed()
    expect(
      audienceLabel(s, {
        targetAudience: { kind: "organisation" },
        category: "client",
        relatedId: "c1",
      }),
    ).toBe("Authorised staff · Taylor Reed")
    expect(
      audienceLabel(s, {
        targetAudience: { kind: "organisation" },
        category: "house",
        relatedId: "h1",
      }),
    ).toBe("Assigned staff · Riverside Lodge")
  })
  it("saves drafts, preserves prior draft state and leaves drafts invisible", () => {
    const s = saveNotice(
        seed(),
        role,
        "new",
        input({ body: "" }),
        "Draft",
        now,
      ),
      next = saveNotice(
        s,
        role,
        "new",
        input({ title: "Edited" }),
        "Draft",
        now,
      )
    expect(
      next.notices.find((n) => n.id === "new")?.history?.[1].previous?.title,
    ).toBe("Fictional notice")
    expect(visibleNotices(next).some((n) => n.id === "new")).toBe(false)
  })
  it("publishes a valid draft with actor/time and shared counts", () => {
    const original = seed(),
      s = saveNotice(original, role, "new", input(), "Draft", now),
      next = saveNotice(s, role, "new", input(), "Published", now)
    expect(next.notices.find((n) => n.id === "new")).toMatchObject({
      status: "Published",
      publisherId: "a1",
      date: now,
    })
    expect(unreadCount(next)).toBe(unreadCount(original) + 1)
    expect(next.notificationReads).toBe(original.notificationReads)
  })
  it.each(["Staff", "Senior Staff", "Support Worker"])(
    "%s cannot save, publish or withdraw",
    (r) => {
      expect(() =>
        saveNotice(seed(), r, "new", input(), "Published", now),
      ).toThrow()
      expect(() => withdrawNotice(seed(), r, "n1", now)).toThrow()
    },
  )
  it.each([
    { targetAudience: { kind: "employee", employeeId: "missing" } },
    {
      category: "client",
      relatedId: "missing",
      targetAudience: { kind: "client", clientId: "missing" },
    },
    {
      category: "client",
      relatedId: "c1",
      targetAudience: { kind: "organisation" },
    },
    {
      category: "client",
      relatedId: "c1",
      targetAudience: { kind: "client", clientId: "c4" },
    },
    {
      category: "house",
      relatedId: "h1",
      targetAudience: { kind: "house", houseId: "h3" },
    },
    {
      category: "client",
      relatedId: "c1",
      targetAudience: { kind: "employee", employeeId: "s4" },
    },
    { targetAudience: { kind: "role", role: "invented" } },
    { relatedId: "c1" },
    { body: "" },
    { title: "" },
    { targetAudience: { kind: "organisation", employeeId: "s4" } },
  ] as Partial<NoticeInput>[])(
    "rejects invalid content, association or audience %#",
    (patch) => expect(() => validateNotice(seed(), input(patch))).toThrow(),
  )
  it.each(["client", "house"] as const)(
    "%s notice appears only to authorised staff and in its own context",
    (category) => {
      const relatedId = category === "client" ? "c1" : "h1",
        targetAudience =
          category === "client"
            ? { kind: "client" as const, clientId: relatedId }
            : { kind: "house" as const, houseId: relatedId }
      const s = saveNotice(
        seed(),
        role,
        "scoped",
        input({ category, relatedId, targetAudience }),
        "Published",
        now,
      )
      expect(visibleNotices(s).some((n) => n.id === "scoped")).toBe(true)
      expect(
        visibleNotices({ ...s, meId: "s4" }).some((n) => n.id === "scoped"),
      ).toBe(false)
      expect(
        projectStaffSnapshot({ ...s, meId: "s4" }).notices.some(
          (n) => n.id === "scoped",
        ),
      ).toBe(false)
    },
  )
  it("employee-specific notice and reads remain private and independent", () => {
    let s = saveNotice(
      seed(),
      role,
      "specific",
      input({ targetAudience: { kind: "employee", employeeId: "s1" } }),
      "Published",
      now,
    )
    s = markNoticeRead(s, "specific", now)
    expect(
      s.notificationReads.some(
        (r) => r.employeeId === "s1" && r.notificationId === "specific",
      ),
    ).toBe(true)
    expect(
      visibleNotices({ ...s, meId: "s2" }).some((n) => n.id === "specific"),
    ).toBe(false)
    expect(unreadCount({ ...s, meId: "s2" })).toBe(
      unreadCount({ ...seed(), meId: "s2" }),
    )
    expect(() =>
      markNoticeRead({ ...s, meId: "s2" }, "specific", now),
    ).toThrow()
  })
  it("published notices cannot be edited; withdrawal keeps original content/history and hides the feed", () => {
    const s = saveNotice(seed(), role, "new", input(), "Published", now)
    expect(() =>
      saveNotice(
        s,
        role,
        "new",
        input({ title: "Silent rewrite" }),
        "Published",
        now,
      ),
    ).toThrow()
    const next = withdrawNotice(s, role, "new", now),
      n = next.notices.find((n) => n.id === "new")!
    expect(n.title).toBe("Fictional notice")
    expect(n.history?.at(-1)?.previous?.status).toBe("Published")
    expect(visibleNotices(next).some((n) => n.id === "new")).toBe(false)
    expect(() => saveNotice(next, role, "new", input(), "Draft", now)).toThrow()
  })
  it("Staff projection omits management change history while merges preserve it", () => {
    const s = saveNotice(seed(), role, "new", input(), "Published", now),
      p = projectStaffSnapshot(s)
    expect(p.notices.find((n) => n.id === "new")?.history).toBeUndefined()
    expect(
      mergeSnapshot(s, p).notices.find((n) => n.id === "new")?.history,
    ).toHaveLength(1)
  })
})
describe("same Staff concerns and management outcomes", () => {
  const submitted = () =>
    submitConcern(
      seed(),
      {
        title: "New staff concern",
        description: "Fictional information only",
        context: "client",
        targetId: "c1",
        priority: "Medium",
      },
      "new-concern",
      now,
    )
  it("Staff-created concern appears in management queue", () => {
    const s = submitted()
    expect(managedConcerns(s, role).find((c) => c.id === "new-concern")).toBe(
      s.concerns.find((c) => c.id === "new-concern"),
    )
  })
  it("start review, resolve, close and reopen preserve original and notices", () => {
    const s = submitted(),
      original = s.concerns.find((c) => c.id === "new-concern")!
    let next = reviewConcern(
      s,
      "Manager",
      original.id,
      { kind: "status", status: "Under Review" },
      now,
    )
    next = reviewConcern(
      next,
      "Manager",
      original.id,
      { kind: "status", status: "Resolved", text: "Fictional outcome" },
      now,
    )
    next = reviewConcern(
      next,
      "Manager",
      original.id,
      { kind: "status", status: "Closed", text: "Fictional closed response" },
      now,
    )
    expect(getConcern(next, original.id)).toMatchObject({
      ...original,
      status: "Closed",
      response: { text: "Fictional closed response" },
    })
    expect(
      next.concerns.find((c) => c.id === original.id)?.reviewEvents,
    ).toHaveLength(3)
    expect(next.notices).toBe(s.notices)
    next = reviewConcern(
      next,
      role,
      original.id,
      { kind: "status", status: "Under Review" },
      now,
    )
    expect(getConcern(next, original.id)?.resolvedAt).toBeUndefined()
  })
  it("internal notes are never projected; response reaches only submitter", () => {
    let s = submitted()
    s = reviewConcern(
      s,
      role,
      "new-concern",
      { kind: "internal", text: "Secret management note" },
      now,
    )
    s = reviewConcern(
      s,
      role,
      "new-concern",
      { kind: "response", text: "Author-only response" },
      now,
    )
    expect(JSON.stringify(getConcern(s, "new-concern"))).not.toContain(
      "Secret management note",
    )
    expect(getConcern(s, "new-concern")?.response?.text).toBe(
      "Author-only response",
    )
    expect(
      projectStaffSnapshot(s).concerns.find((c) => c.id === "new-concern"),
    ).not.toHaveProperty("reviewEvents")
    expect(getConcern({ ...s, meId: "s2" }, "new-concern")).toBeUndefined()
    expect(
      projectStaffSnapshot({ ...s, meId: "s2" }).concerns.some(
        (c) => c.id === "new-concern",
      ),
    ).toBe(false)
    expect(
      s.concerns.find((c) => c.id === "new-concern")?.internalNotes,
    ).toHaveLength(1)
    const merged = mergeSnapshot(s, projectStaffSnapshot(s))
    expect(
      merged.concerns.find((c) => c.id === "new-concern")?.reviewEvents,
    ).toHaveLength(2)
  })
  it.each(["Staff", "Senior Staff", "Support Worker"])(
    "%s cannot review or read management concerns",
    (r) => {
      expect(() =>
        reviewConcern(
          seed(),
          r,
          "concern-submitted",
          { kind: "status", status: "Under Review" },
          now,
        ),
      ).toThrow()
      expect(() => managedConcerns(seed(), r)).toThrow()
    },
  )
  it("rejects invalid IDs, notes, outcomes, statuses and earlier event times", () => {
    expect(() =>
      reviewConcern(
        seed(),
        role,
        "missing",
        { kind: "status", status: "Under Review" },
        now,
      ),
    ).toThrow()
    expect(() =>
      reviewConcern(
        seed(),
        role,
        "concern-submitted",
        { kind: "internal", text: " " },
        now,
      ),
    ).toThrow()
    expect(() =>
      reviewConcern(
        seed(),
        role,
        "concern-submitted",
        { kind: "status", status: "Resolved" },
        now,
      ),
    ).toThrow()
    expect(() =>
      reviewConcern(
        seed(),
        role,
        "concern-submitted",
        { kind: "status", status: "Closed", text: "No" },
        now,
      ),
    ).toThrow()
    expect(() =>
      reviewConcern(
        seed(),
        role,
        "concern-submitted",
        { kind: "status", status: "Under Review" },
        "2000-01-01T00:00:00Z",
      ),
    ).toThrow()
  })
  it("review never modifies care revisions, workforce, leave or configuration", () => {
    const s = seed(),
      n = reviewConcern(
        s,
        role,
        "concern-submitted",
        { kind: "status", status: "Under Review" },
        now,
      )
    for (const key of [
      "corrections",
      "careRecords",
      "diary",
      "attendance",
      "attendanceCorrections",
      "leaveRequests",
      "shifts",
      "careTemplates",
      "careAssignments",
    ] as const)
      expect(n[key]).toBe(s[key])
  })
})
describe("bounded development audit", () => {
  it("derives file, notice and concern events from actual mutation metadata", () => {
    let s = removeFile(seed(), role, "client-garden", "test", now)
    s = saveNotice(s, role, "new", input(), "Published", now)
    s = reviewConcern(
      s,
      role,
      "concern-submitted",
      { kind: "status", status: "Under Review" },
      now,
    )
    const events = developmentEvents(s, role)
    expect(events.some((e) => e.action === "Logical file removal")).toBe(true)
    expect(events.some((e) => e.action === "Notice published")).toBe(true)
    expect(events.some((e) => e.action === "Under Review")).toBe(true)
    expect(
      events.some((e) => e.entity === "Employee" || e.entity === "Shift"),
    ).toBe(false)
    expect(JSON.stringify(events)).not.toContain(
      "INTERNAL_MANAGEMENT_CONCERN_NOTE",
    )
  })
  it("does not manufacture missing audit history or allow Staff reads", () => {
    const s = seed()
    expect(
      developmentEvents(
        {
          ...s,
          careTemplates: [],
          diaryCategories: [],
          leaveRequests: [],
          attendanceCorrections: [],
          corrections: [],
        },
        role,
      ),
    ).toEqual([])
    expect(() => developmentEvents(s, "Staff")).toThrow()
  })
})
