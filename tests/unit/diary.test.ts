import { describe, it, expect } from "vitest"
import { developmentMockAdapter as adapter } from "../../src/modules/staff/data/development-mock-adapter"
import {
  saveDiary,
  getHistory,
  getDiaryEntry,
  requestCorrection,
  validateDiary,
  isDemoOnShift,
  diaryQueries,
  queryDiaryHistory,
} from "../../src/modules/staff/data/diary-adapter"
import { toNZDateTimeInput, fromNZDateTimeInput } from "../../src/lib/time"
const now = "2026-10-22T01:00:00.000Z",
  s = adapter.getSnapshot("s1", now)
const client = { scope: "client", targetId: "c1" } as const,
  house = { scope: "house", targetId: "h1" } as const
const input = {
  title: "Fictional update",
  categoryId: "cat1",
  body: "A sufficiently detailed fictional entry.",
  coveredAt: "2026-10-21T22:00:00.000Z",
  offShiftReason: "Finishing after handover",
}
describe("diary development adapter", () => {
  it("keeps subjects separate, scoped and newest first", () => {
    for (const subject of [client, house]) {
      const entries = getHistory(s, subject)
      expect(entries).toHaveLength(8)
      expect(
        entries.every(
          (d) => d.scope === subject.scope && d.targetId === subject.targetId,
        ),
      ).toBe(true)
      expect(entries.map((d) => d.submittedAt ?? d.createdAt)).toEqual(
        entries
          .map((d) => d.submittedAt ?? d.createdAt)
          .sort()
          .reverse(),
      )
    }
    expect(getHistory(s, { scope: "client", targetId: "c4" })).toEqual([])
    expect(getHistory(s, { scope: "house", targetId: "h3" })).toEqual([])
    expect(getDiaryEntry(s, client, "house-h1-1")).toBeUndefined()
    expect(getDiaryEntry(s, client, "missing")).toBeUndefined()
  })
  it("refuses creation without assignment, even over a broader snapshot", () => {
    expect(() =>
      saveDiary(
        { ...s, assignments: [] },
        client,
        input,
        "submitted",
        "new",
        now,
      ),
    ).toThrow("unavailable")
    expect(() =>
      saveDiary(
        s,
        { scope: "client", targetId: "c4" },
        input,
        "draft",
        "new",
        now,
      ),
    ).toThrow("unavailable")
  })
  it("saves a partial own draft, edits and submits it retaining original creation time", () => {
    const draft = saveDiary(
      s,
      client,
      { ...input, body: "", offShiftReason: "" },
      "draft",
      "new",
      now,
    )
    expect(getDiaryEntry(draft, client, "new")).toMatchObject({
      status: "draft",
      createdAt: now,
      submittedAt: undefined,
    })
    const later = "2026-10-22T02:00:00.000Z"
    const submitted = saveDiary(
      draft,
      client,
      input,
      "submitted",
      "unused",
      later,
      "new",
    )
    expect(getDiaryEntry(submitted, client, "new")).toMatchObject({
      status: "submitted",
      createdAt: now,
      submittedAt: later,
      coveredAt: input.coveredAt,
      offShiftReason: input.offShiftReason,
    })
    expect(() =>
      saveDiary(submitted, client, input, "draft", "bad", later, "new"),
    ).toThrow("drafts")
  })
  it("keeps drafts private to their author", () => {
    const draft = saveDiary(s, client, input, "draft", "private", now)
    const other = { ...draft, meId: "s2" }
    expect(getDiaryEntry(other, client, "private")).toBeUndefined()
    expect(() =>
      saveDiary(other, client, input, "draft", "bad", now, "private"),
    ).toThrow("drafts")
  })
  it("validates all submission fields and category context", () => {
    const errors = validateDiary(
      s,
      client,
      {
        title: "",
        categoryId: "cat5",
        body: "tiny",
        coveredAt: "bad",
        offShiftReason: "",
      },
      "submitted",
    )
    expect(Object.keys(errors).sort()).toEqual(
      ["title", "categoryId", "body", "coveredAt", "offShiftReason"].sort(),
    )
    expect(
      validateDiary(
        s,
        client,
        { ...input, coveredAt: "2027-01-01T01:00:00Z" },
        "submitted",
      ).coveredAt,
    ).toBeTruthy()
    expect(
      validateDiary(s, client, { ...input, title: "" }, "draft").title,
    ).toBeTruthy()
  })
  it("uses explicit demo attendance, never a scheduled shift alone", () => {
    expect(isDemoOnShift(s)).toBe(false)
    expect(
      validateDiary(s, client, { ...input, offShiftReason: "" }, "submitted")
        .offShiftReason,
    ).toBeTruthy()
    const active = {
      ...s,
      demoAttendance: { employeeId: s.meId, shiftId: "sh1" },
    }
    expect(isDemoOnShift(active)).toBe(true)
    expect(
      validateDiary(
        active,
        client,
        { ...input, offShiftReason: "" },
        "submitted",
      ),
    ).toEqual({})
    expect(
      isDemoOnShift({
        ...active,
        demoAttendance: { employeeId: "s2", shiftId: "sh1" },
      }),
    ).toBe(false)
    expect(isDemoOnShift({ ...active, now: "2030-01-01T00:00:00Z" })).toBe(
      false,
    )
  })
  it("records correction separately, preserves original, and refuses duplicate/personal review", () => {
    const id = "client-c1-1",
      original = getDiaryEntry(s, client, id)
    const next = requestCorrection(
      s,
      client,
      id,
      "Wrong wording",
      "Proposed fictional replacement",
      "cor1",
      now,
    )
    expect(getDiaryEntry(next, client, id)).toEqual(original)
    expect(next.corrections[0]).toMatchObject({
      status: "pending",
      recordId: id,
      requestingEmployeeId: "s1",
    })
    expect(() =>
      requestCorrection(next, client, id, "Again", "Again", "cor2", now),
    ).toThrow("unavailable")
    expect(
      Object.keys(diaryQueries).some((k) => /approve|review|delete/i.test(k)),
    ).toBe(false)
  })
  it("refuses correction for another author, draft, wrong subject or empty fields", () => {
    expect(() =>
      requestCorrection(
        { ...s, meId: "s2" },
        client,
        "client-c1-1",
        "reason",
        "proposal",
        "cor",
        now,
      ),
    ).toThrow()
    expect(() =>
      requestCorrection(
        s,
        client,
        "client-c1-8",
        "reason",
        "proposal",
        "cor",
        now,
      ),
    ).toThrow()
    expect(() =>
      requestCorrection(
        s,
        house,
        "client-c1-1",
        "reason",
        "proposal",
        "cor",
        now,
      ),
    ).toThrow()
    expect(() =>
      requestCorrection(s, client, "client-c1-1", " ", "proposal", "cor", now),
    ).toThrow()
  })
  it("supports house drafts, submissions and corrections without adding client history", () => {
    const next = saveDiary(
      s,
      house,
      { ...input, categoryId: "cat5" },
      "submitted",
      "house-new",
      now,
    )
    const requested = requestCorrection(
      next,
      house,
      "house-new",
      "Reason",
      "Proposed",
      "house-cor",
      now,
    )
    expect(getDiaryEntry(requested, house, "house-new")).toBeTruthy()
    expect(getDiaryEntry(requested, client, "house-new")).toBeUndefined()
  })
  it("queries category/date/search and clamps six-record pages", () => {
    expect(queryDiaryHistory(s, client).items).toHaveLength(6)
    expect(queryDiaryHistory(s, client, { page: 2 }).items).toHaveLength(2)
    expect(queryDiaryHistory(s, client, { page: 99 }).page).toBe(2)
    expect(
      queryDiaryHistory(s, client, { query: "  DAILY ACTIVITIES 5  " }).items[0]
        ?.id,
    ).toBe("client-c1-5")
    expect(
      queryDiaryHistory(s, client, { categoryId: "cat2" }).items.map(
        (d) => d.id,
      ),
    ).toEqual(["client-c1-3"])
    expect(queryDiaryHistory(s, client, { days: 1 }).total).toBe(1)
    expect(queryDiaryHistory(s, client, { query: "missing" }).total).toBe(0)
    expect(
      queryDiaryHistory(s, house, { query: "Daily activities" }).total,
    ).toBe(0)
  })
  it("converts NZ wall time regardless of device zone, refusing DST ambiguity", () => {
    expect(toNZDateTimeInput(now)).toBe("2026-10-22T14:00")
    expect(fromNZDateTimeInput("2026-10-22T14:00")).toBe(now)
    expect(fromNZDateTimeInput("2026-07-22T14:00")).toBe(
      "2026-07-22T02:00:00.000Z",
    )
    expect(fromNZDateTimeInput("2026-09-27T02:30")).toBe("")
    expect(fromNZDateTimeInput("2026-04-05T02:30")).toBe("")
    expect(fromNZDateTimeInput("2026-02-30T12:00")).toBe("")
  })
})
