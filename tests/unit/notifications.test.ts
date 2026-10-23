import { describe, it, expect } from "vitest"
import { developmentMockAdapter } from "../../src/modules/staff/data/development-mock-adapter"
import { visibleNotices } from "../../src/modules/staff/data/selectors"
import { seedConcerns } from "../../src/modules/staff/notifications/seed"
import {
  getNotice,
  getConcern,
  getMyConcerns,
  queryNotifications,
  queryConcerns,
  markNoticeRead,
  isNoticeRead,
  unreadCount,
  submitConcern,
  validateConcern,
  getParentAttachments,
} from "../../src/modules/staff/notifications/adapter"
import type { ConcernInput } from "../../src/modules/staff/notifications/types"
const now = "2026-10-22T01:00:00.000Z"
const snapshot = () => developmentMockAdapter.getSnapshot("s1", now)
const input: ConcernInput = {
  title: "Fictional concern",
  description: "Fictional description",
  context: "client",
  targetId: "c1",
  priority: "High",
}
describe("development notifications and own concerns", () => {
  it("combines only published scoped notices in newest order", () => {
    expect(visibleNotices(snapshot()).map((n) => n.id)).toEqual([
      "n1",
      "n2",
      "n3",
    ])
  })
  it.each(["client", "house", "staff"])("filters %s category", (category) => {
    expect(queryNotifications(snapshot(), category)).toHaveLength(1)
    expect(queryNotifications(snapshot(), category)[0].category).toBe(category)
  })
  it("rejects unauthorised client and house notices even on broad snapshots", () => {
    const s = snapshot(),
      n = s.notices[0]
    s.notices.push(
      { ...n, id: "badclient", category: "client", relatedId: "c4" },
      { ...n, id: "badhouse", relatedId: "h3" },
    )
    expect(getNotice(s, "badclient")).toBeUndefined()
    expect(getNotice(s, "badhouse")).toBeUndefined()
  })
  it("rejects private employee, role and house audiences", () => {
    const s = snapshot(),
      n = s.notices[2]
    s.notices = [
      { ...n, targetAudience: { kind: "employee", employeeId: "s2" } },
      {
        ...n,
        id: "role",
        targetAudience: { kind: "role", role: "Administrator" },
      },
      { ...n, id: "house", targetAudience: { kind: "house", houseId: "h3" } },
    ]
    expect(visibleNotices(s)).toEqual([])
  })
  it("supports explicit employee, assigned-house and matching-role audiences", () => {
    const s = snapshot(),
      n = s.notices[2]
    for (const targetAudience of [
      { kind: "employee", employeeId: "s1" },
      { kind: "house", houseId: "h2" },
      { kind: "role", role: "Support Worker" },
    ] as const) {
      expect(
        visibleNotices({ ...s, notices: [{ ...n, targetAudience }] }),
      ).toHaveLength(1)
    }
  })
  it("does not infer house scope for client notices", () => {
    expect(
      queryNotifications(snapshot(), "house", {
        context: "house",
        targetId: "h2",
      }),
    ).toEqual([])
  })
  it("supports search, dates, unread and no matches", () => {
    const s = snapshot()
    expect(
      queryNotifications(s, "all", { search: "JORDAN" }).map((n) => n.id),
    ).toEqual(["n2"])
    expect(queryNotifications(s, "all", { from: "2026-10-23" })).toEqual([])
    expect(queryNotifications(s, "all", { to: "2026-10-21" })).toEqual([])
    expect(queryNotifications(s, "all", { unread: true })).toHaveLength(2)
    expect(queryNotifications(s, "all", { search: "no match" })).toEqual([])
  })
  it("gets one notice and rejects missing/draft IDs", () => {
    const s = snapshot()
    expect(getNotice(s, "n2")?.title).toBe("Updated support information")
    expect(getNotice(s, "n5")).toBeUndefined()
    expect(getNotice(s, "missing")).toBeUndefined()
  })
  it("marks own read state without changing notices or a colleague's read state", () => {
    const s = snapshot()
    s.notificationReads.push({
      notificationId: "n1",
      employeeId: "s2",
      readAt: now,
    })
    expect(isNoticeRead(s, "n1")).toBe(false)
    const next = markNoticeRead(s, "n1", now)
    expect(unreadCount(next)).toBe(1)
    expect(next.notices).toBe(s.notices)
    expect(
      next.notificationReads.filter((r) => r.notificationId === "n1"),
    ).toHaveLength(2)
    expect(markNoticeRead(next, "n1", now)).toBe(next)
    expect(() => markNoticeRead(s, "n4", now)).toThrow("unavailable")
    expect(() => markNoticeRead(s, "n1", "invalid")).toThrow()
  })
  it("serialises no private notices, other authors or internal notes", () => {
    const s = snapshot(),
      json = JSON.stringify(s)
    for (const marker of [
      "PRIVATE_CLIENT_NOTICE",
      "PRIVATE_EMPLOYEE_NOTICE",
      "PRIVATE_COWORKER_CONCERN",
      "INTERNAL_MANAGEMENT_CONCERN_NOTE",
      "PRIVATE_RESTRICTED_CONCERN",
    ])
      expect(json).not.toContain(marker)
    expect(s.notificationReads.every((r) => r.employeeId === "s1")).toBe(true)
  })
  it("rechecks own concerns and strips internal fields against broader data", () => {
    const s = { ...snapshot(), concerns: seedConcerns(now) }
    expect(getMyConcerns(s)).toHaveLength(4)
    expect(JSON.stringify(getMyConcerns(s))).not.toContain(
      "INTERNAL_MANAGEMENT",
    )
    expect(getConcern(s, "concern-other")).toBeUndefined()
    expect(getConcern(s, "concern-restricted")).toBeUndefined()
    expect(getConcern(s, "missing")).toBeUndefined()
    expect(getMyConcerns({ ...s, assignments: [] })).toEqual([])
  })
  it.each(["Submitted", "Under Review", "Resolved", "Closed"])(
    "retains fictional %s status",
    (status) => {
      expect(getMyConcerns(snapshot()).some((c) => c.status === status)).toBe(
        true,
      )
    },
  )
  it("shows only shared management response, with resolution metadata", () => {
    const c = getConcern(snapshot(), "concern-resolved")!
    expect(c.response?.text).toContain("repair is complete")
    expect(c.resolvedAt).toBeTruthy()
  })
  it("filters own history newest first by search, status, context and dates", () => {
    const s = snapshot()
    expect(getMyConcerns(s)[0].id).toBe("concern-submitted")
    expect(
      queryConcerns(s, { status: "Under Review", context: "client" }),
    ).toHaveLength(1)
    expect(
      queryConcerns(s, { search: "cupboard", targetId: "h1" }),
    ).toHaveLength(1)
    expect(
      queryConcerns(s, { from: "2026-10-22", to: "2026-10-22" }),
    ).toHaveLength(1)
    expect(queryConcerns(s, { context: "client", targetId: "c3" })).toEqual([])
  })
  it("validates required fields and priority", () => {
    expect(
      validateConcern(snapshot(), {
        ...input,
        title: " ",
        description: "",
        context: "other",
        targetId: "",
        priority: "Urgent",
      }),
    ).toMatchObject({
      title: expect.any(String),
      description: expect.any(String),
      context: expect.any(String),
      targetId: expect.any(String),
      priority: expect.any(String),
    })
  })
  it.each([
    ["client", "c4"],
    ["house", "h3"],
    ["client", "h1"],
    ["house", "c1"],
  ])("rejects forged %s/%s context", (context, targetId) => {
    expect(() =>
      submitConcern(snapshot(), { ...input, context, targetId }, "new", now),
    ).toThrow()
  })
  it("forces author and Submitted status, ignoring forged reviewer, notice and decision fields", () => {
    const s = snapshot()
    const next = submitConcern(
      s,
      {
        ...input,
        submittedById: "s2",
        status: "Resolved",
        response: { text: "forged" },
        noticeId: "n1",
      } as ConcernInput,
      "new",
      now,
    )
    expect(getConcern(next, "new")).toMatchObject({
      submittedById: "s1",
      status: "Submitted",
      context: "client",
      targetId: "c1",
    })
    expect(getConcern(next, "new")?.response).toBeUndefined()
    for (const key of [
      "notices",
      "notificationReads",
      "shifts",
      "attendance",
      "leaveRequests",
    ] as const)
      expect(next[key]).toBe(s[key])
    expect(getMyConcerns(next)[0].id).toBe("new")
    expect(getConcern({ ...next, meId: "s2" }, "new")).toBeUndefined()
  })
  it("rejects duplicate IDs, invalid timestamp and unsupported role", () => {
    const s = snapshot()
    expect(() => submitConcern(s, input, "concern-review", now)).toThrow()
    expect(() => submitConcern(s, input, "new", "bad")).toThrow()
    s.staff = s.staff.map((e) =>
      e.id === "s1" ? { ...e, role: "unknown" } : e,
    )
    expect(() => submitConcern(s, input, "new", now)).toThrow()
  })
  it("retains validated selection metadata with explicit concern association only", () => {
    const s = snapshot(),
      next = submitConcern(
        s,
        {
          ...input,
          attachment: { name: "example.txt", size: 12, type: "text/plain" },
        },
        "new",
        now,
      ),
      c = getConcern(next, "new")!
    expect(getParentAttachments(next, c, "concern")).toEqual([
      expect.objectContaining({
        availability: "sessionOnly",
        association: { scope: "concern", targetId: "new" },
        uploadedById: "s1",
      }),
    ])
    expect(JSON.stringify(next.attachments.at(-1))).not.toContain("url")
    expect(() =>
      submitConcern(
        s,
        {
          ...input,
          attachment: { name: "bad.html", type: "text/html", size: 10 },
        },
        "bad",
        now,
      ),
    ).toThrow()
    expect(getParentAttachments({ ...next, meId: "s2" }, c, "concern")).toEqual(
      [],
    )
  })
  it("allows only explicit notice attachment IDs and parent association", () => {
    const s = snapshot(),
      n = getNotice(s, "n2")!
    expect(getParentAttachments(s, n, "notification").map((f) => f.id)).toEqual(
      ["notice-demo-readme"],
    )
    expect(
      getParentAttachments(s, { ...n, id: "private" }, "notification"),
    ).toEqual([])
    s.attachments.push({
      ...s.attachments.find((f) => f.id === "notice-demo-readme")!,
      id: "unlisted-parent-file",
    })
    expect(
      getParentAttachments(
        s,
        { ...n, attachmentIds: ["unlisted-parent-file"] },
        "notification",
      ).map((f) => f.id),
    ).toEqual(["notice-demo-readme"])
  })
  it("exports no staff publication or management review operations", async () => {
    const api = await import("../../src/modules/staff/notifications/adapter")
    for (const key of [
      "publishNotice",
      "editNotice",
      "deleteNotice",
      "reviewConcern",
      "resolveConcern",
      "deleteConcern",
    ])
      expect(api).not.toHaveProperty(key)
  })
})
