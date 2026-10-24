import { describe, it, expect } from "vitest"
import { developmentMockAdapter } from "../../src/modules/staff/data/development-mock-adapter"
import {
  requestCorrection,
  saveDiary,
  getDiaryEntry,
} from "../../src/modules/staff/data/diary-adapter"
import {
  requestCareCorrection,
  saveCareRecord,
} from "../../src/modules/staff/care/adapter"
import {
  managedRecord,
  submittedRecords,
  managedRequests,
  reviewCorrection,
  recordReviewSummary,
} from "../../src/modules/admin/records/adapter"
import {
  effectiveDiary,
  effectiveCare,
  latestRevision,
} from "../../src/modules/staff/documentation/revisions"
import { applyCareProposal } from "../../src/modules/staff/documentation/proposals"
import { projectStaffSnapshot } from "../../src/modules/staff/data/projection"
import { mergeSnapshot } from "../../src/modules/preview/merge"
import type { FormValue } from "../../src/modules/forms/types"
const now = "2026-10-22T01:00:00.000Z",
  role = "Administrator",
  seed = () => developmentMockAdapter.getSnapshot("s1", now, true)
const diary = (s = seed(), scope = "client") =>
  s.diary.find(
    (d) => d.scope === scope && d.authorId === "s1" && d.status === "submitted",
  )!
function diaryRequest(s = seed(), scope = "client", id = "request-diary") {
  const d = diary(s, scope)
  return {
    d,
    s: requestCorrection(
      s,
      d,
      d.id,
      "Fictional wording correction",
      "Revised fictional narrative for review.",
      id,
      now,
    ),
    id,
  }
}
function structured(
  s = seed(),
  id = "request-cell",
  recordId = "chart-equipment-1",
  fieldId = "equipment",
  rowId: string | undefined = "equipment-row-a",
  columnId: string | undefined = "serial",
  value: FormValue = "REVISED-101",
) {
  const r = s.careRecords.find((r) => r.id === recordId)!
  return {
    r,
    id,
    s: requestCareCorrection(
      s,
      r.clientId,
      r.templateId,
      r.id,
      "Fictional structured correction",
      "Replace the selected answer with the typed value.",
      id,
      now,
      { fieldId, rowId, columnId },
      value,
    ),
  }
}
describe("Submitted documentation and immutable review", () => {
  it("lists four distinct submitted contexts with original metadata and bounded UI inputs", () => {
    const s = seed(),
      rows = submittedRecords(s, role)
    expect(new Set(rows.map((r) => r.type))).toEqual(
      new Set(["Client Diary", "House Diary", "Care Plan", "Charting"]),
    )
    expect(rows.every((r) => r.submittedAt && r.authorId && r.houseId)).toBe(
      true,
    )
    expect(
      rows.filter((r) => r.type === "House Diary").every((r) => !r.clientId),
    ).toBe(true)
    expect(
      rows.every(
        (r) => r.diary?.status !== "draft" && r.care?.status !== "draft",
      ),
    ).toBe(true)
  })
  it("excludes invalid client, house, category, author and original version associations", () => {
    for (const change of ["client", "house", "category", "author", "version"]) {
      const s = seed(),
        d = diary(s),
        r = s.careRecords.find((r) => r.status === "submitted")!
      if (change === "client") r.clientId = "missing"
      if (change === "house")
        s.clients.find((c) => c.id === r.clientId)!.houseId = "missing"
      if (change === "category") d.categoryId = "missing"
      if (change === "author") r.authorId = "missing"
      if (change === "version") r.templateVersion = 999
      expect(
        managedRecord(
          s,
          role,
          change === "category" ? "diary" : "care",
          change === "category" ? d.id : r.id,
        ),
      ).toBeUndefined()
    }
  })
  it("unknown records and requests disclose no record DTO", () => {
    expect(managedRecord(seed(), role, "diary", "missing")).toBeUndefined()
    expect(
      managedRequests(seed(), role).some((x) => x.request.id === "missing"),
    ).toBe(false)
  })
  it.each(["Staff", "Senior Staff", "Support Worker", "", "unknown"])(
    "rejects %s reads and decisions",
    (r) => {
      expect(() => submittedRecords(seed(), r)).toThrow()
      expect(() =>
        reviewCorrection(seed(), r, "missing", "approved", ""),
      ).toThrow()
    },
  )
  it.each(["Administrator", "Manager"])(
    "permits existing %s operational management scope",
    (r) => expect(submittedRecords(seed(), r).length).toBeGreaterThan(0),
  )
  it("requires organisation and active matching management actor", () => {
    const s = seed()
    s.organisation = undefined
    expect(() => submittedRecords(s, role)).toThrow()
    const t = seed()
    t.staff.find((e) => e.id === "a1")!.status = "Inactive"
    expect(() => submittedRecords(t, role)).toThrow()
  })
  it("approves Client Diary without changing original arrays, association or submission", () => {
    const { s, d, id } = diaryRequest(),
      before = structuredClone(d),
      next = reviewCorrection(
        s,
        role,
        id,
        "approved",
        "Reviewed fictional wording",
      )
    expect(next.diary).toBe(s.diary)
    expect(next.careRecords).toBe(s.careRecords)
    expect(d).toEqual(before)
    expect(effectiveDiary(next, d).body).toBe(
      "Revised fictional narrative for review.",
    )
    expect(effectiveDiary(next, d).authorId).toBe(d.authorId)
    expect(next.corrections.find((c) => c.id === id)?.decision).toMatchObject({
      reviewerName: s.staff.find((e) => e.id === "a1")!.name,
      reviewerId: "a1",
      at: now,
      notes: "Reviewed fictional wording",
    })
    expect(latestRevision(next, "diary", d.id)).toMatchObject({
      requestId: id,
      kind: "diary",
    })
  })
  it("rejects House Diary with visible reason and preserves content, attendance and shifts", () => {
    const { s, d, id } = diaryRequest(seed(), "house")
    expect(() => reviewCorrection(s, role, id, "rejected", "")).toThrow(
      /reason/,
    )
    const next = reviewCorrection(
      s,
      "Manager",
      id,
      "rejected",
      "Original is accurate",
    )
    expect(effectiveDiary(next, d)).toBe(d)
    expect(next.attendance).toBe(s.attendance)
    expect(next.shifts).toBe(s.shifts)
    expect(
      next.corrections.find((c) => c.id === id)?.decision?.reviewerId,
    ).toBe("m1")
  })
  it.each(["approved", "rejected"] as const)(
    "completed %s request rejects repeat or opposite decisions",
    (outcome) => {
      const { s, id } = diaryRequest(),
        next = reviewCorrection(s, role, id, outcome, "Reviewed")
      expect(() => reviewCorrection(next, role, id, "approved", "")).toThrow(
        /once/,
      )
      expect(() =>
        reviewCorrection(next, role, id, "rejected", "Again"),
      ).toThrow(/once/)
    },
  )
  it("rejects stale simultaneous approvals but permits explained rejection", () => {
    const { s, id, d } = diaryRequest(),
      first = s.corrections.find((c) => c.id === id)!
    s.corrections.push({ ...structuredClone(first), id: "competing" })
    const approved = reviewCorrection(s, role, id, "approved", "")
    expect(() =>
      reviewCorrection(approved, role, "competing", "approved", ""),
    ).toThrow(/stale/)
    const rejected = reviewCorrection(
      approved,
      role,
      "competing",
      "rejected",
      "Baseline changed",
    )
    expect(effectiveDiary(rejected, d).body).toBe(
      "Revised fictional narrative for review.",
    )
  })
  it("captures latest base revision for a second request and follows equal-time chains", () => {
    const initial = diaryRequest(),
      { id, d } = initial
    let s = initial.s
    s = reviewCorrection(s, role, id, "approved", "")
    const base = latestRevision(s, "diary", d.id)!.id
    s = requestCorrection(
      s,
      d,
      d.id,
      "Further review",
      "Second revised fictional narrative.",
      "second",
      now,
    )
    expect(s.corrections[0].baseRevisionId).toBe(base)
    s = reviewCorrection(s, role, "second", "approved", "")
    expect(effectiveDiary(s, d).body).toBe(
      "Second revised fictional narrative.",
    )
    expect(s.diary.find((x) => x.id === d.id)!.body).toBe(d.body)
  })
  it("keeps rejected proposals and raw originals in Staff projection and merge", () => {
    const { s, d, id } = diaryRequest(),
      approved = reviewCorrection(s, role, id, "approved", "")
    const projection = projectStaffSnapshot(approved)
    expect(projection.diary.find((x) => x.id === d.id)?.body).toBe(d.body)
    expect(effectiveDiary(projection, d).status).toBe("corrected")
    const merged = mergeSnapshot(approved, projection)
    expect(merged.diary.find((x) => x.id === d.id)).toEqual(d)
    expect(merged.corrections.find((c) => c.id === id)?.decision).toEqual(
      approved.corrections.find((c) => c.id === id)?.decision,
    )
  })
  it("current house removal excludes records and their revisions from Staff", () => {
    const { s, d, id } = diaryRequest(),
      approved = reviewCorrection(s, role, id, "approved", "")
    const client = approved.clients.find((c) => c.id === d.targetId)!
    approved.assignments = approved.assignments.filter(
      (a) => a.employeeId !== "s1" || a.houseId !== client.houseId,
    )
    const scoped = projectStaffSnapshot(approved)
    expect(scoped.diary.some((x) => x.id === d.id)).toBe(false)
    expect(scoped.corrections.some((c) => c.id === id)).toBe(false)
    expect(getDiaryEntry(scoped, d, d.id)).toBeUndefined()
  })
  it("structured v1 correction uses original field definitions after v2 exists", () => {
    const s = seed(),
      r = s.careRecords.find(
        (r) =>
          r.templateId === "t1" &&
          r.templateVersion === 1 &&
          r.authorId === "s1" &&
          r.status === "submitted",
      )!
    const next = requestCareCorrection(
      s,
      r.clientId,
      r.templateId,
      r.id,
      "Original wording",
      "Replace original text",
      "v1-correction",
      now,
      { fieldId: "condition" },
      "Revised fictional v1 text",
    )
    const approved = reviewCorrection(
      next,
      role,
      "v1-correction",
      "approved",
      "",
    )
    expect(effectiveCare(approved, r).values.condition).toBe(
      "Revised fictional v1 text",
    )
    expect(r.values.condition).not.toBe("Revised fictional v1 text")
    expect(approved.careTemplates).toBe(s.careTemplates)
    expect(effectiveCare(approved, r).templateVersion).toBe(1)
  })
  it("table-cell approval preserves row identities/order, other cells and original columns", () => {
    const { s, r, id } = structured(),
      before = structuredClone(r),
      next = reviewCorrection(s, role, id, "approved", "")
    const rows = effectiveCare(next, r).values
      .equipment as import("../../src/modules/forms/types").CareTableRow[]
    expect(rows.map((row) => row.id)).toEqual([
      "equipment-row-a",
      "equipment-row-b",
    ])
    expect(rows[0].values.serial).toBe("REVISED-101")
    expect(rows[1]).toEqual((r.values.equipment as typeof rows)[1])
    expect(r).toEqual(before)
    expect(next.careTemplates).toBe(s.careTemplates)
  })
  it.each([
    ["missing", "equipment-row-a", "serial"],
    ["equipment", "missing", "serial"],
    ["equipment", "equipment-row-a", "missing"],
    ["equipment", "equipment-row-a", undefined],
    ["equipment", undefined, "serial"],
    ["__proto__", undefined, undefined],
  ])("rejects invalid stable field/row/column %s/%s/%s", (f, r, c) =>
    expect(() =>
      applyCareProposal(
        seed(),
        seed().careRecords.find((x) => x.id === "chart-equipment-1")!,
        {
          kind: "care",
          changes: [
            {
              target: { fieldId: f!, rowId: r, columnId: c },
              value: "replacement",
            },
          ],
        },
      ),
    ).toThrow(),
  )
  it.each([NaN, Infinity, {}, ["unknown"]])(
    "rejects invalid typed numeric value %j",
    (value) => {
      const s = seed(),
        r = s.careRecords.find(
          (r) =>
            r.templateId === "t5" &&
            r.authorId === "s1" &&
            r.status === "submitted" &&
            !s.corrections.some((c) => c.recordId === r.id),
        )!
      expect(() =>
        requestCareCorrection(
          s,
          r.clientId,
          r.templateId,
          r.id,
          "Review",
          "Propose value",
          "numeric",
          now,
          { fieldId: "duration" },
          value as FormValue,
        ),
      ).toThrow()
    },
  )
  it("rejects unknown options under original version", () => {
    const s = seed(),
      r = s.careRecords.find(
        (r) =>
          r.templateId === "t4" &&
          r.authorId === "s1" &&
          r.status === "submitted",
      )!
    expect(() =>
      requestCareCorrection(
        s,
        r.clientId,
        r.templateId,
        r.id,
        "Review",
        "Unknown option",
        "options",
        now,
        { fieldId: "stool" },
        "not-an-option",
      ),
    ).toThrow()
  })
  it("legacy text-only structured requests can be rejected but never auto-parsed", () => {
    const s = seed(),
      c = s.corrections.find((c) => c.id === "chart-correction")!
    expect(() => reviewCorrection(s, role, c.id, "approved", "")).toThrow(
      /typed/,
    )
    expect(
      reviewCorrection(
        s,
        role,
        c.id,
        "rejected",
        "Please submit a typed value",
      ).corrections.find((x) => x.id === c.id)?.status,
    ).toBe("rejected")
  })
  it("rejects empty/unchanged diary proposals and malformed review metadata", () => {
    const { s, id, d } = diaryRequest()
    s.corrections.find((c) => c.id === id)!.proposal = {
      kind: "diary",
      body: d.body,
    }
    expect(() => reviewCorrection(s, role, id, "approved", "")).toThrow()
    expect(() =>
      reviewCorrection(s, role, id, "rejected", "x".repeat(5001)),
    ).toThrow()
    expect(() =>
      reviewCorrection(
        { ...s, now: "invalid" },
        role,
        id,
        "rejected",
        "Reason",
      ),
    ).toThrow()
  })
  it("rejects duplicate targets, malformed table rows and unknown columns", () => {
    const s = seed(),
      r = s.careRecords.find((r) => r.id === "chart-equipment-1")!,
      target = {
        fieldId: "equipment",
        rowId: "equipment-row-a",
        columnId: "serial",
      }
    expect(() =>
      applyCareProposal(s, r, {
        kind: "care",
        changes: [
          { target, value: "new" },
          { target, value: "other" },
        ],
      }),
    ).toThrow(/Duplicate/)
    for (const value of [
      [{ id: "row", values: { unexpected: "value" } }],
      [
        { id: "same", values: {} },
        { id: "same", values: {} },
      ],
    ])
      expect(() =>
        applyCareProposal(s, r, {
          kind: "care",
          changes: [{ target: { fieldId: "equipment" }, value }],
        }),
      ).toThrow()
  })
  it("rejects unchanged typed proposals", () => {
    const s = seed(),
      r = s.careRecords.find((r) => r.id === "chart-equipment-1")!
    expect(() =>
      applyCareProposal(s, r, {
        kind: "care",
        changes: [
          {
            target: {
              fieldId: "equipment",
              rowId: "equipment-row-a",
              columnId: "serial",
            },
            value: "DEMO-101",
          },
        ],
      }),
    ).toThrow(/changed/)
  })
  it("Dashboard summary updates independently of attendance corrections", () => {
    const { s, id } = diaryRequest(),
      before = recordReviewSummary(s, role),
      after = reviewCorrection(s, role, id, "approved", "")
    expect(recordReviewSummary(after, role).pending).toBe(before.pending - 1)
    expect(recordReviewSummary(after, role).corrected).toBe(
      before.corrected + 1,
    )
    expect(recordReviewSummary(after, role).recent).toBe(1)
    expect(after.attendanceCorrections).toBe(s.attendanceCorrections)
  })
  it("Staff cannot reopen submitted diary or care as an editable draft", () => {
    const s = seed(),
      d = diary(s),
      r = s.careRecords.find(
        (r) => r.status === "submitted" && r.authorId === "s1",
      )!
    expect(() =>
      saveDiary(
        s,
        d,
        {
          title: d.title,
          categoryId: d.categoryId,
          body: "replacement",
          coveredAt: d.coveredAt,
          offShiftReason: "Example",
        },
        "draft",
        "new",
        now,
        d.id,
      ),
    ).toThrow()
    expect(() =>
      saveCareRecord(
        s,
        r.clientId,
        r.templateId,
        { values: r.values, coveredAt: r.coveredAt, offShiftReason: "Example" },
        "draft",
        "new",
        now,
        r.id,
      ),
    ).toThrow()
  })
  it("rejects mismatched requester/record associations and unknown review IDs", () => {
    const { s, id } = diaryRequest()
    s.corrections.find((c) => c.id === id)!.requestingEmployeeId = "s2"
    expect(() => reviewCorrection(s, role, id, "approved", "")).toThrow()
    expect(() =>
      reviewCorrection(seed(), role, "missing", "approved", ""),
    ).toThrow()
  })
  it("off-shift reasons and metadata survive approved correction", () => {
    const { s, id, d } = diaryRequest()
    const approved = reviewCorrection(s, role, id, "approved", "")
    expect(effectiveDiary(approved, d)).toMatchObject({
      offShiftReason: d.offShiftReason,
      submittedAt: d.submittedAt,
      createdAt: d.createdAt,
      coveredAt: d.coveredAt,
      authorId: d.authorId,
    })
  })
})
describe("Structured proposal edge cases", () => {
  it("whole-table proposal adds/removes rows by ID while preserving the original", () => {
    const s = seed(),
      r = s.careRecords.find((r) => r.id === "chart-equipment-1")!,
      rows = structuredClone(
        r.values.equipment,
      ) as import("../../src/modules/forms/types").CareTableRow[]
    rows.splice(0, 1)
    rows.push({
      id: "new-row",
      values: {
        name: "New fictional equipment",
        type: "Mobility",
        serial: "NEW",
        acquired: "2026-10-20",
      },
    })
    const requested = requestCareCorrection(
      s,
      "c1",
      "t6",
      r.id,
      "Review rows",
      "Replace configured rows explicitly.",
      "whole-table",
      now,
      { fieldId: "equipment" },
      rows,
    )
    const approved = reviewCorrection(
      requested,
      role,
      "whole-table",
      "approved",
      "",
    )
    expect(
      (effectiveCare(approved, r).values.equipment as typeof rows).map(
        (row) => row.id,
      ),
    ).toEqual(["equipment-row-b", "new-row"])
    expect((r.values.equipment as typeof rows).map((row) => row.id)).toEqual([
      "equipment-row-a",
      "equipment-row-b",
    ])
    const next = requestCareCorrection(
      approved,
      "c1",
      "t6",
      r.id,
      "Review added row",
      "Correct serial on new row.",
      "new-cell",
      now,
      { fieldId: "equipment", rowId: "new-row", columnId: "serial" },
      "NEW-REVIEWED",
    )
    expect(
      reviewCorrection(next, role, "new-cell", "approved", "").corrections.find(
        (c) => c.id === "new-cell",
      )?.status,
    ).toBe("approved")
  })
  it("conditional correction never silently removes existing dependent answers", () => {
    const s = seed(),
      r = s.careRecords.find(
        (r) =>
          r.templateId === "t1" &&
          r.templateVersion === 2 &&
          r.status === "submitted",
      )!
    r.values = {
      condition: "Intact",
      redness: "Yes",
      bodyArea: "Arms",
      unusual: "Retain this historical answer",
    }
    expect(() =>
      applyCareProposal(s, r, {
        kind: "care",
        changes: [{ target: { fieldId: "redness" }, value: "No" }],
      }),
    ).toThrow(/hides an existing/)
    const values = applyCareProposal(s, r, {
      kind: "care",
      changes: [
        { target: { fieldId: "redness" }, value: "No" },
        { target: { fieldId: "bodyArea" }, value: "" },
        { target: { fieldId: "unusual" }, value: "" },
      ],
    })
    expect(values.redness).toBe("No")
    expect(r.values.unusual).toBe("Retain this historical answer")
  })
  it("required visible scalar cannot be cleared", () => {
    const s = seed(),
      r = s.careRecords.find((r) => r.id === "care-c1-skin-7")!
    expect(() =>
      applyCareProposal(s, r, {
        kind: "care",
        changes: [{ target: { fieldId: "condition" }, value: "" }],
      }),
    ).toThrow()
  })
  it("duplicate object-key order cannot disguise the same target", () => {
    const s = seed(),
      r = s.careRecords.find((r) => r.id === "chart-equipment-1")!
    expect(() =>
      applyCareProposal(s, r, {
        kind: "care",
        changes: [
          {
            target: {
              fieldId: "equipment",
              rowId: "equipment-row-a",
              columnId: "serial",
            },
            value: "NEW",
          },
          {
            target: {
              columnId: "serial",
              rowId: "equipment-row-a",
              fieldId: "equipment",
            },
            value: "OTHER",
          },
        ],
      }),
    ).toThrow(/Duplicate/)
  })
})

describe("Review event time", () => {
  it("uses an explicit current decision time when a request follows initial page load", () => {
    const s = seed(),
      d = diary(s),
      requestedAt = "2026-10-22T01:01:00.000Z",
      decidedAt = "2026-10-22T01:02:00.000Z"
    const requested = requestCorrection(
      s,
      d,
      d.id,
      "Later request",
      "Fictional later-time replacement.",
      "later-request",
      requestedAt,
    )
    expect(() =>
      reviewCorrection(requested, role, "later-request", "approved", ""),
    ).toThrow(/precedes/)
    const approved = reviewCorrection(
      requested,
      role,
      "later-request",
      "approved",
      "",
      decidedAt,
    )
    expect(
      approved.corrections.find((c) => c.id === "later-request")?.decision?.at,
    ).toBe(decidedAt)
    expect(approved.now).toBe(decidedAt)
    expect(approved.diary).toBe(s.diary)
  })
})

describe("Unavailable operational targets", () => {
  it("rejects reserved photo/file targets before rendering or approval", () => {
    const s = seed(),
      r = s.careRecords.find(
        (r) =>
          r.templateId === "t1" &&
          r.templateVersion === 2 &&
          r.status === "submitted",
      )!
    expect(() =>
      applyCareProposal(s, r, {
        kind: "care",
        changes: [{ target: { fieldId: "photo" }, value: "fake-file" }],
      }),
    ).toThrow(/Unsupported/)
  })
})
