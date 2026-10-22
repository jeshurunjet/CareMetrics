import { describe, it, expect } from "vitest"
import { developmentMockAdapter as adapter } from "../../src/modules/staff/data/development-mock-adapter"
import {
  getAssignedCareTemplates,
  getAssignedCareTemplate,
  getCareRecords,
  getCareRecord,
  queryCareHistory,
  saveCareRecord,
  requestCareCorrection,
  validateCareInput,
} from "../../src/modules/staff/care/adapter"
import {
  initialFormValues,
  sanitizeValues,
  visibleFields,
  validateForm,
  normalizeFormValues,
} from "../../src/modules/forms/engine"
import type {
  ConfigurableFormVersion,
  FormValues,
} from "../../src/modules/forms/types"
import { recordCorrections } from "../../src/modules/staff/data/correction-service"
const now = "2026-10-22T01:00:00.000Z",
  s = adapter.getSnapshot("s1", now)
const skin = getAssignedCareTemplate(s, "c1", "t1")!.version,
  medical = getAssignedCareTemplate(s, "c1", "t2")!.version
const input = {
  values: { condition: "Intact", redness: "No", pressure: 1 },
  coveredAt: "2026-10-21T23:00:00.000Z",
  offShiftReason: "Completing a fictional review",
}
describe("configured form engine", () => {
  it("renders schema differences and defaults without template-name branching", () => {
    expect(initialFormValues(skin)).toEqual({ pressure: 1 })
    expect(visibleFields(skin, {}).map((f) => f.id)).toContain("condition")
    expect(visibleFields(medical, {}).map((f) => f.id)).toContain("intake")
    expect(visibleFields(medical, {}).map((f) => f.id)).not.toContain(
      "condition",
    )
  })
  it("shows conditional fields and sections and removes hidden answers immediately", () => {
    const yes = {
      redness: "Yes",
      bodyArea: "Arms",
      areas: ["Heels"],
      unusual: "Fictional description",
    }
    expect(visibleFields(skin, yes).map((f) => f.id)).toContain("bodyArea")
    const cleared = sanitizeValues(skin, {
      ...yes,
      redness: "No",
      unknown: "discard",
    })
    expect(cleared).toEqual({ redness: "No" })
    expect(
      sanitizeValues(skin, { ...cleared, redness: "Yes" }).bodyArea,
    ).toBeUndefined()
    expect(
      visibleFields(medical, { catheter: "No" }).map((f) => f.id),
    ).not.toContain("deviceOk")
    expect(
      visibleFields(medical, { catheter: "Yes" }).map((f) => f.id),
    ).toContain("deviceOk")
  })
  it("validates visible required fields, excluding hidden requirements", () => {
    expect(validateForm(skin, input.values)).toEqual({})
    expect(
      validateForm(skin, { ...input.values, redness: "Yes" }).bodyArea,
    ).toBeTruthy()
    expect(
      validateForm(medical, {
        intake: 0,
        output: 0,
        device: "None",
        catheter: "No",
      }),
    ).toEqual({})
    expect(
      validateForm(medical, {
        intake: 0,
        output: 0,
        device: "Catheter",
        catheter: "Yes",
      }),
    ).toHaveProperty("deviceOk")
  })
  it("rejects invalid number/scale/options/multiple values", () => {
    expect(
      validateForm(medical, {
        intake: -1,
        output: Infinity,
        device: "fake",
        catheter: "No",
      }),
    ).toMatchObject({
      intake: "Must be at least 0.",
      output: "Enter a finite number.",
      device: "Choose an available option.",
    })
    expect(
      validateForm(skin, {
        condition: "fake",
        redness: "invalid",
        pressure: 9,
      }),
    ).toMatchObject({
      condition: "Choose an available option.",
      redness: "Choose Yes or No.",
      pressure: "Must be 5 or less.",
    })
    expect(
      validateForm(skin, {
        ...input.values,
        redness: "Yes",
        bodyArea: "Arms",
        areas: ["Unknown"],
      }).areas,
    ).toBeTruthy()
    expect(
      validateForm(skin, { ...input.values, pressure: 1.5 }).pressure,
    ).toBeTruthy()
  })
  it("supports all eleven field types, calendar dates, time and NZ datetime", () => {
    const fields = s.careTemplates.flatMap((t) =>
      t.versions.flatMap((v) => v.sections.flatMap((sec) => sec.fields)),
    )
    for (const type of [
      "text",
      "textarea",
      "number",
      "yesno",
      "select",
      "radio",
      "multi",
      "date",
      "time",
      "datetime",
      "scale",
    ])
      expect(fields.some((f) => f.type === type)).toBe(true)
    const receipt = getAssignedCareTemplate(s, "c1", "t3")!.version
    expect(
      validateForm(receipt, {
        received: "No",
        logged: "Yes",
        receiptDate: "2026-02-30",
        receiptTime: "25:61",
      }),
    ).toMatchObject({
      receiptDate: "Choose a valid date.",
      receiptTime: "Choose a valid time.",
    })
    expect(
      validateForm(medical, {
        intake: 1,
        output: 1,
        device: "None",
        catheter: "No",
        followup: "2026-09-27T02:30",
      }).followup,
    ).toBeTruthy()
    const normalized = normalizeFormValues(medical, {
      catheter: "No",
      followup: "2026-10-22T14:00",
    })
    expect(normalized.followup).toBe(now)
    expect(initialFormValues(medical, normalized).followup).toBe(
      "2026-10-22T14:00",
    )
  })
  it("handles declared dependencies, missing controllers and cycles without execution", () => {
    const v: ConfigurableFormVersion = {
      version: 1,
      published: true,
      sections: [
        {
          id: "s",
          title: "Examples",
          fields: [
            { id: "a", label: "A", type: "yesno" },
            {
              id: "b",
              label: "B",
              type: "text",
              showIf: { fieldId: "a", op: "equals", value: "Yes" },
            },
            {
              id: "c",
              label: "C",
              type: "text",
              showIf: { fieldId: "b", op: "equals", value: "present" },
            },
            {
              id: "d",
              label: "D",
              type: "text",
              showIf: { fieldId: "absent", op: "not_equals", value: "No" },
            },
            {
              id: "x",
              label: "X",
              type: "text",
              showIf: { fieldId: "y", op: "equals", value: "Yes" },
            },
            {
              id: "y",
              label: "Y",
              type: "text",
              showIf: { fieldId: "x", op: "equals", value: "Yes" },
            },
          ],
        },
      ],
    }
    expect(
      visibleFields(v, { a: "No", b: "present", x: "Yes", y: "Yes" }).map(
        (f) => f.id,
      ),
    ).toEqual(["a"])
  })
  it("explicitly refuses required unsupported types; never retains file/table values", () => {
    const v: ConfigurableFormVersion = {
      version: 1,
      published: true,
      sections: [
        {
          id: "s",
          title: "Unsupported",
          fields: [
            {
              id: "file",
              label: "File",
              type: "file",
              unsupported: true,
              required: true,
            },
          ],
        },
      ],
    }
    expect(validateForm(v, {}).file).toContain("not supported")
    expect(normalizeFormValues(v, { file: "pretend-upload" })).toEqual({})
  })
})
describe("care adapter scope and lifecycle", () => {
  it("returns only client-assigned published templates, including empty assignments", () => {
    expect(getAssignedCareTemplates(s, "c1").map((x) => x.template.id)).toEqual(
      ["t1", "t2", "t3"],
    )
    expect(getAssignedCareTemplates(s, "c2").map((x) => x.template.id)).toEqual(
      ["t1"],
    )
    expect(getAssignedCareTemplates(s, "c3")).toEqual([])
    expect(getAssignedCareTemplates(s, "c4")).toEqual([])
    expect(getAssignedCareTemplate(s, "c2", "t2")).toBeUndefined()
    expect(getAssignedCareTemplates({ ...s, assignments: [] }, "c1")).toEqual(
      [],
    )
    expect(s.careTemplates.some((t) => t.id === "t-private")).toBe(false)
    expect(s.careRecords.some((r) => r.id === "care-private-1")).toBe(false)
  })
  it("refuses paused assignments, unpublished versions and unassigned creation", () => {
    const paused = {
      ...s,
      careAssignments: s.careAssignments.map((a) => ({
        ...a,
        status: "paused" as const,
      })),
    }
    expect(getAssignedCareTemplates(paused, "c1")).toEqual([])
    const unpublished = {
      ...s,
      careTemplates: s.careTemplates.map((t) => ({
        ...t,
        versions: t.versions.map((v) => ({ ...v, published: false })),
      })),
    }
    expect(getAssignedCareTemplates(unpublished, "c1")).toEqual([])
    expect(() =>
      saveCareRecord(s, "c2", "t2", input, "draft", "new", now),
    ).toThrow("unavailable")
    expect(() =>
      saveCareRecord(
        { ...s, assignments: [] },
        "c1",
        "t1",
        input,
        "submitted",
        "new",
        now,
      ),
    ).toThrow("unavailable")
  })
  it("scopes histories, sorts, searches, date-filters and paginates six records", () => {
    const records = getCareRecords(s, "c1", "t1")
    expect(records).toHaveLength(8)
    expect(records.map((r) => r.submittedAt ?? r.createdAt)).toEqual(
      records
        .map((r) => r.submittedAt ?? r.createdAt)
        .sort()
        .reverse(),
    )
    expect(queryCareHistory(s, "c1", "t1").items).toHaveLength(6)
    expect(queryCareHistory(s, "c1", "t1", { page: 2 }).items).toHaveLength(2)
    expect(queryCareHistory(s, "c1", "t1", { days: 1 }).total).toBe(1)
    expect(queryCareHistory(s, "c1", "t1", { query: "Legacy" }).total).toBe(1)
    expect(getCareRecord(s, "c1", "t1", "care-c2-skin-1")).toBeUndefined()
    expect(getCareRecord(s, "c1", "t1", "care-c1-medical-1")).toBeUndefined()
    expect(getCareRecord(s, "c1", "t1", "unknown")).toBeUndefined()
  })
  it("saves incomplete own drafts and preserves version/creation while editing", () => {
    const draft = saveCareRecord(
      s,
      "c1",
      "t1",
      { ...input, values: {}, offShiftReason: "" },
      "draft",
      "new-draft",
      now,
    )
    expect(getCareRecord(draft, "c1", "t1", "new-draft")).toMatchObject({
      status: "draft",
      templateVersion: 2,
      createdAt: now,
      submittedAt: undefined,
    })
    const submitted = saveCareRecord(
      draft,
      "c1",
      "t1",
      input,
      "submitted",
      "unused",
      "2026-10-22T02:00:00.000Z",
      "new-draft",
    )
    expect(getCareRecord(submitted, "c1", "t1", "new-draft")).toMatchObject({
      status: "submitted",
      templateVersion: 2,
      createdAt: now,
      submittedAt: "2026-10-22T02:00:00.000Z",
    })
    expect(() =>
      saveCareRecord(
        submitted,
        "c1",
        "t1",
        input,
        "draft",
        "other",
        now,
        "new-draft",
      ),
    ).toThrow("drafts")
  })
  it("blocks another author's draft reads and updates", () => {
    const draft = saveCareRecord(s, "c1", "t1", input, "draft", "private", now)
    const other = { ...draft, meId: "s2" }
    expect(getCareRecord(other, "c1", "t1", "private")).toBeUndefined()
    expect(() =>
      saveCareRecord(
        other,
        "c1",
        "t1",
        input,
        "draft",
        "unused",
        now,
        "private",
      ),
    ).toThrow("drafts")
  })
  it("retains historical field definitions and does not silently upgrade old drafts", () => {
    const record = getCareRecord(s, "c1", "t1", "care-c1-skin-7")!
    expect(record.templateVersion).toBe(1)
    expect(
      getAssignedCareTemplate(s, "c1", "t1")!.template.versions.find(
        (v) => v.version === record.templateVersion,
      )!.sections[0].fields[0].label,
    ).toBe("Original skin condition")
    const old = {
      ...s,
      careAssignments: s.careAssignments.map((a) =>
        a.clientId === "c1" && a.templateId === "t1" ? { ...a, version: 1 } : a,
      ),
    }
    const draft = saveCareRecord(
      old,
      "c1",
      "t1",
      { ...input, values: { condition: "Old answer" } },
      "draft",
      "old-draft",
      now,
    )
    const upgraded = { ...draft, careAssignments: s.careAssignments }
    const result = saveCareRecord(
      upgraded,
      "c1",
      "t1",
      { ...input, values: { condition: "Old answer" } },
      "submitted",
      "unused",
      now,
      "old-draft",
    )
    expect(
      getCareRecord(result, "c1", "t1", "old-draft")!.templateVersion,
    ).toBe(1)
    expect(result.careTemplates).toEqual(s.careTemplates)
  })
  it("requires visible fields/off-shift reason and allows explicit demo-active submission", () => {
    expect(
      validateCareInput(
        s,
        "c1",
        "t1",
        2,
        { ...input, values: {}, offShiftReason: "" },
        "submitted",
      ),
    ).toMatchObject({
      condition: "This field is required.",
      offShiftReason: "A reason is required when you are not clocked in.",
    })
    const active = {
      ...s,
      demoAttendance: { employeeId: "s1", shiftId: "sh1" },
    }
    expect(
      validateCareInput(
        active,
        "c1",
        "t1",
        2,
        { ...input, offShiftReason: "" },
        "submitted",
      ),
    ).toEqual({})
    expect(
      validateCareInput(
        s,
        "c1",
        "t1",
        2,
        { ...input, coveredAt: "2030-01-01T00:00:00Z" },
        "submitted",
      ).coveredAt,
    ).toBeTruthy()
  })
  it("clears unknown/hidden answers in saved records", () => {
    const result = saveCareRecord(
      s,
      "c1",
      "t1",
      {
        ...input,
        values: {
          ...input.values,
          bodyArea: "Arms",
          unknown: "secret",
        } as FormValues,
      },
      "submitted",
      "clean",
      now,
    )
    expect(getCareRecord(result, "c1", "t1", "clean")!.values).toEqual(
      input.values,
    )
  })
  it("records corrections separately and discriminates diary/care record IDs", () => {
    const original = getCareRecord(s, "c1", "t1", "care-c1-skin-1")
    const next = requestCareCorrection(
      s,
      "c1",
      "t1",
      "care-c1-skin-1",
      "Fictional error",
      "Notes → revised fictional note",
      "correction-new",
      now,
    )
    expect(next.careRecords).toEqual(s.careRecords)
    expect(getCareRecord(next, "c1", "t1", "care-c1-skin-1")).toEqual(original)
    expect(recordCorrections(next, "care", "care-c1-skin-1")[0]).toMatchObject({
      status: "pending",
      recordType: "care",
      requestingEmployeeId: "s1",
    })
    expect(recordCorrections(next, "diary", "care-c1-skin-1")).toEqual([])
    expect(() =>
      requestCareCorrection(
        next,
        "c1",
        "t1",
        "care-c1-skin-1",
        "again",
        "again",
        "again",
        now,
      ),
    ).toThrow("unavailable")
    expect(() =>
      requestCareCorrection(
        { ...s, meId: "s2" },
        "c1",
        "t1",
        "care-c1-skin-1",
        "reason",
        "proposed",
        "bad",
        now,
      ),
    ).toThrow()
    expect(() =>
      requestCareCorrection(
        s,
        "c1",
        "t1",
        "care-c1-skin-8",
        "reason",
        "proposed",
        "bad",
        now,
      ),
    ).toThrow()
    expect(
      Object.keys(adapter).some((k) => /approve|reject|delete/i.test(k)),
    ).toBe(false)
  })
})
