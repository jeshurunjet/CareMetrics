import { describe, it, expect } from "vitest"
import { developmentMockAdapter as adapter } from "../../src/modules/staff/data/development-mock-adapter"
import {
  getAssignedCareTemplates,
  getAssignedCareTemplate,
  getCareRecords,
  getCareRecord,
  queryCareHistory,
  saveCareRecord,
  validateCareInput,
  requestCareCorrection,
} from "../../src/modules/staff/care/adapter"
import {
  initialFormValues,
  validateForm,
  normalizeFormValues,
  sanitizeValues,
  isTableRows,
} from "../../src/modules/forms/engine"
import type {
  ConfigurableFormVersion,
  FormValues,
  CareTableRow,
} from "../../src/modules/forms/types"
import { chartPoints } from "../../src/modules/staff/charting/history"
const now = "2026-10-22T01:00:00.000Z",
  s = adapter.getSnapshot("s1", now)
const equipment = getAssignedCareTemplate(s, "c1", "t6", "chart")!
const row = (id = "new-row"): CareTableRow => ({
  id,
  values: {
    name: "Fictional frame",
    type: "Mobility",
    acquired: "2025-10-01",
    due: "2027-10-01",
  },
})
const input = {
  coveredAt: "2026-10-21T23:00:00.000Z",
  offShiftReason: "Fictional after-handover entry",
  values: { equipment: [row()] },
}
const cellVersion: ConfigurableFormVersion = {
  version: 1,
  published: true,
  sections: [
    {
      id: "s",
      title: "Example",
      fields: [
        {
          id: "rows",
          label: "Configured rows",
          type: "repeatingTable",
          minRows: 1,
          maxRows: 2,
          columns: [
            { id: "text", label: "Text", type: "text", required: true },
            {
              id: "number",
              label: "Number",
              type: "number",
              required: true,
              min: 0,
              max: 10,
              step: 1,
            },
            { id: "date", label: "Date", type: "date", required: true },
            { id: "time", label: "Time", type: "time", required: true },
            { id: "yes", label: "Yes/No", type: "yesno", required: true },
            {
              id: "select",
              label: "Dropdown",
              type: "select",
              required: true,
              options: [{ value: "a", label: "A" }],
            },
            {
              id: "radio",
              label: "Radio",
              type: "radio",
              required: true,
              options: [{ value: "b", label: "B" }],
            },
            { id: "photo", label: "Photo", type: "photo", unsupported: true },
          ],
        },
      ],
    },
  ],
}
const cells = {
  text: "Demo",
  number: 0,
  date: "2026-10-01",
  time: "12:30",
  yes: "No",
  select: "a",
  radio: "b",
}
describe("shared chart template and record model", () => {
  it("shows only client-assigned chart templates, separately from care", () => {
    expect(
      getAssignedCareTemplates(s, "c1", "chart").map((t) => t.template.id),
    ).toEqual(["t4", "t5", "t6"])
    expect(getAssignedCareTemplates(s, "c2", "chart")).toHaveLength(1)
    expect(getAssignedCareTemplates(s, "c3", "chart")).toEqual([])
    expect(getAssignedCareTemplates(s, "c4", "chart")).toEqual([])
    expect(getAssignedCareTemplate(s, "c1", "t4")).toBeUndefined()
    expect(s.careTemplates.some((t) => t.id === "chart-private")).toBe(false)
  })
  it("scopes history and excludes another author's drafts", () => {
    expect(getCareRecords(s, "c1", "t4")).toHaveLength(9)
    expect(getCareRecord(s, "c1", "t4", "chart-c2-bowel")).toBeUndefined()
    expect(getCareRecord(s, "c1", "t6", "chart-private-draft")).toBeUndefined()
    expect(getCareRecords(s, "c4", "chart-private")).toEqual([])
  })
  it("orders, searches, date-filters and paginates six records", () => {
    expect(queryCareHistory(s, "c1", "t4").items[0].id).toBe("chart-bowel-1")
    expect(queryCareHistory(s, "c1", "t4", { page: 2 }).items).toHaveLength(3)
    expect(queryCareHistory(s, "c1", "t4", { days: 1 }).total).toBe(1)
    expect(
      queryCareHistory(s, "c1", "t4", { query: "observation 8" }).items[0].id,
    ).toBe("chart-bowel-8")
  })
  it("preserves row IDs, values, order and draft creation on resume/submit", () => {
    const draft = saveCareRecord(
      s,
      "c1",
      "t6",
      { ...input, values: { equipment: [row("a"), { id: "b", values: {} }] } },
      "draft",
      "new-draft",
      now,
    )
    const resumed = getCareRecord(draft, "c1", "t6", "new-draft")!
    expect(resumed.values.equipment).toEqual([
      row("a"),
      { id: "b", values: {} },
    ])
    const submitted = saveCareRecord(
      draft,
      "c1",
      "t6",
      { ...input, values: { equipment: [row("b"), row("a")] } },
      "submitted",
      "ignored",
      now,
      resumed.id,
    )
    const r = getCareRecord(submitted, "c1", "t6", resumed.id)!
    expect(r.values.equipment).toEqual([row("b"), row("a")])
    expect(r.templateVersion).toBe(2)
    expect(r.createdAt).toBe(resumed.createdAt)
    expect(r.coveredAt).not.toBe(r.submittedAt)
    expect(() =>
      saveCareRecord(submitted, "c1", "t6", input, "draft", "id", now, r.id),
    ).toThrow(/own drafts/)
  })
  it("rejects wrong-client, unassigned templates and other-author draft edits", () => {
    for (const [client, template, draft] of [
      ["c2", "t6", undefined],
      ["c4", "chart-private", undefined],
      ["c1", "t6", "chart-private-draft"],
      ["c1", "t6", "chart-equipment-1"],
    ])
      expect(() =>
        saveCareRecord(
          s,
          client!,
          template!,
          input,
          "draft",
          "new",
          now,
          draft,
        ),
      ).toThrow()
  })
  it("requires an off-shift reason but accepts explicitly active demo attendance", () => {
    expect(
      validateCareInput(
        s,
        "c1",
        "t6",
        2,
        { ...input, offShiftReason: "" },
        "submitted",
      ),
    ).toHaveProperty("offShiftReason")
    const active = {
      ...s,
      demoAttendance: { shiftId: "sh1", employeeId: "s1" },
    }
    expect(
      validateCareInput(
        active,
        "c1",
        "t6",
        2,
        { ...input, offShiftReason: "" },
        "submitted",
      ),
    ).toEqual({})
  })
  it("keeps old versions/columns available and retains draft versions after assignment changes", () => {
    const old = getCareRecord(s, "c1", "t6", "chart-equipment-old")!
    const field = equipment.template.versions.find(
      (v) => v.version === old.templateVersion,
    )!.sections[0].fields[0]
    expect(
      field.type === "repeatingTable" && field.columns.map((c) => c.id),
    ).not.toContain("due")
    expect(field.type === "repeatingTable" && field.columns[0].label).toBe(
      "Original equipment name",
    )
    const oldDraft = {
      ...old,
      id: "old-draft",
      status: "draft" as const,
      submittedAt: undefined,
    }
    const next = saveCareRecord(
      { ...s, careRecords: [oldDraft, ...s.careRecords] },
      "c1",
      "t6",
      { ...input, values: old.values },
      "submitted",
      oldDraft.id,
      now,
      oldDraft.id,
    )
    expect(getCareRecord(next, "c1", "t6", oldDraft.id)?.templateVersion).toBe(
      1,
    )
  })
  it("stores validated row/column correction targets separately without modifying originals", () => {
    const before = structuredClone(s.careRecords),
      target = {
        fieldId: "equipment",
        rowId: "equipment-row-a",
        columnId: "serial",
      }
    const next = requestCareCorrection(
      s,
      "c1",
      "t6",
      "chart-equipment-1",
      "Fictional typo",
      "DEMO-103",
      "request",
      now,
      target,
    )
    expect(next.careRecords).toEqual(before)
    expect(next.corrections[0]).toMatchObject({
      status: "pending",
      targets: [target],
    })
    expect(() =>
      requestCareCorrection(
        s,
        "c1",
        "t6",
        "chart-equipment-1",
        "Reason",
        "New",
        "r2",
        now,
        { ...target, rowId: "bad" },
      ),
    ).toThrow(/target/)
    expect(() =>
      requestCareCorrection(
        next,
        "c1",
        "t6",
        "chart-equipment-1",
        "Reason",
        "New",
        "r2",
        now,
        target,
      ),
    ).toThrow()
    expect(
      Object.keys(adapter).some((key) => /approve|reject/i.test(key)),
    ).toBe(false)
  })
})
describe("configured repeating table validation", () => {
  it("validates all seven scalar cell kinds through the shared field rules", () => {
    expect(
      validateForm(cellVersion, { rows: [{ id: "a", values: cells }] }),
    ).toEqual({})
    const errors = validateForm(cellVersion, {
      rows: [
        {
          id: "stable",
          values: {
            text: "",
            number: Infinity,
            date: "2026-02-30",
            time: "25:01",
            yes: "maybe",
            select: "bad",
            radio: "bad",
          },
        },
      ],
    })
    for (const c of [
      "text",
      "number",
      "date",
      "time",
      "yes",
      "select",
      "radio",
    ])
      expect(errors[`rows.stable.${c}`]).toMatch(/^Row 1,/)
  })
  it("enforces required/min/max rows and identity integrity", () => {
    expect(validateForm(equipment.version, {})).toHaveProperty("equipment")
    expect(validateForm(cellVersion, { rows: [] })).toHaveProperty("rows")
    expect(
      validateForm(cellVersion, { rows: [row("a"), row("b"), row("c")] }).rows,
    ).toMatch(/2 rows/)
    expect(
      validateForm(cellVersion, { rows: [row("a"), row("a")] }).rows,
    ).toMatch(/unique ID/)
    expect(validateForm(cellVersion, { rows: [row("")] }).rows).toMatch(
      /unique ID/,
    )
    expect(validateForm(cellVersion, { rows: "malformed" }).rows).toMatch(
      /valid table/,
    )
  })
  it("validates zero, numeric bounds and step without inventing row limits", () => {
    for (const n of [-1, 11, 0.5, NaN])
      expect(
        validateForm(cellVersion, {
          rows: [{ id: "a", values: { ...cells, number: n } }],
        }),
      ).toHaveProperty("rows.a.number")
    const unlimited: ConfigurableFormVersion = {
      version: 1,
      published: true,
      sections: [
        {
          id: "s",
          title: "Rows",
          fields: [
            { id: "rows", label: "Rows", type: "repeatingTable", columns: [] },
          ],
        },
      ],
    }
    expect(
      validateForm(unlimited, {
        rows: Array.from({ length: 40 }, (_, i) => ({
          id: String(i),
          values: {},
        })),
      }),
    ).toEqual({})
  })
  it("clears hidden tables and strips unknown/unsupported cell values without mutating input", () => {
    const values: FormValues = {
      equipment: [{ ...row(), values: { ...row().values, extra: "remove" } }],
    }
    const clean = normalizeFormValues(equipment.version, values)
    expect(
      isTableRows(clean.equipment) && clean.equipment[0].values.extra,
    ).toBeUndefined()
    expect(
      isTableRows(values.equipment) && values.equipment[0].values.extra,
    ).toBe("remove")
    const conditional: ConfigurableFormVersion = {
      version: 1,
      published: true,
      sections: [
        {
          id: "s",
          title: "S",
          fields: [
            { id: "show", label: "Show", type: "yesno" },
            {
              ...equipment.version.sections[0].fields[0],
              showIf: { fieldId: "show", op: "equals", value: "Yes" },
            },
          ],
        },
      ],
    }
    expect(sanitizeValues(conditional, { ...values, show: "No" })).toEqual({
      show: "No",
    })
    expect(initialFormValues(equipment.version, values)).not.toBe(values)
  })
  it("does not silently support required photo/file cells", () => {
    const version: ConfigurableFormVersion = {
      version: 1,
      published: true,
      sections: [
        {
          id: "s",
          title: "S",
          fields: [
            {
              id: "rows",
              label: "Rows",
              type: "repeatingTable",
              columns: [
                {
                  id: "photo",
                  label: "Photo",
                  type: "photo",
                  required: true,
                  unsupported: true,
                },
              ],
            },
          ],
        },
      ],
    }
    expect(
      validateForm(version, { rows: [{ id: "a", values: {} }] }),
    ).toHaveProperty("rows.a.photo")
  })
  it("uses only real finite numeric submitted points including zero and provides empty results", () => {
    const t = getAssignedCareTemplate(s, "c1", "t5", "chart")!.template,
      records = getCareRecords(s, "c1", "t5")
    expect(chartPoints(t, records)).toHaveLength(8)
    expect(chartPoints(t, records).some((p) => p.value === 0)).toBe(true)
    expect(
      chartPoints(t, [
        { ...records[0], values: {} },
        { ...records[0], status: "draft" },
        { ...records[0], values: { duration: NaN } },
      ]),
    ).toEqual([])
    expect(chartPoints(equipment.template, records)).toEqual([])
  })
})
