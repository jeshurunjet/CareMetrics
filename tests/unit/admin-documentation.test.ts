import { describe, it, expect } from "vitest"
import { developmentMockAdapter } from "../../src/modules/staff/data/development-mock-adapter"
import { projectStaffSnapshot } from "../../src/modules/staff/data/projection"
import { mergeSnapshot } from "../../src/modules/preview/merge"
import {
  saveDiary,
  getCategories,
} from "../../src/modules/staff/data/diary-adapter"
import {
  getAssignedCareTemplate,
  getAssignedCareTemplates,
  getCareRecord,
  saveCareRecord,
  getReadableCareTemplate,
} from "../../src/modules/staff/care/adapter"
import {
  initialFormValues,
  sanitizeValues,
  validateForm,
} from "../../src/modules/forms/engine"
import type { FormFieldDefinition } from "../../src/modules/forms/types"
import type { TemplateDraft } from "../../src/modules/staff/care/types"
import {
  createTemplate,
  saveDraft,
  publishTemplate,
  newDraftVersion,
  saveCategory,
  assignTemplate,
  archiveTemplate,
} from "../../src/modules/admin/documentation/adapter"
import {
  fieldTypes,
  cellTypes,
  validateTemplate,
} from "../../src/modules/admin/documentation/validation"
import {
  makeField,
  changeFieldType,
  duplicateField,
  move,
  newSection,
} from "../../src/modules/admin/documentation/builder-model"
const now = "2026-10-22T01:00:00.000Z",
  seed = () => developmentMockAdapter.getSnapshot("s1", now, true),
  role = "Administrator"
function draft(
  fields: readonly FormFieldDefinition[] = [
    { id: "notes", label: "Observation", type: "text", required: true },
  ],
): TemplateDraft {
  return {
    name: "Fictional configured assessment",
    description: "Development only",
    summary: "Initial version",
    form: {
      version: 1,
      published: false,
      sections: [{ id: "observations", title: "Observations", fields }],
    },
  }
}
function publish(kind: "care" | "chart" = "care", d = draft()) {
  const created = createTemplate(seed(), role, d.name, d.description, kind),
    saved = saveDraft(created.data, role, created.id, d)
  return {
    id: created.id,
    data: publishTemplate(saved, role, created.id, true),
  }
}
const issues = (f: FormFieldDefinition) =>
  validateTemplate(draft([f]))
    .map((e) => e.message)
    .join(" ")
describe("Diary category configuration", () => {
  it.each(["client", "house"] as const)(
    "creates %s categories in only the correct selector",
    (scope) => {
      const s = saveCategory(seed(), role, {
          name: "Fictional new category",
          description: "Example",
          scope,
          active: true,
        }),
        c = s.diaryCategories.at(-1)!
      expect(getCategories(s, scope)).toContain(c)
      expect(
        getCategories(s, scope === "client" ? "house" : "client"),
      ).not.toContain(c)
      expect(c.createdBy).toBe("a1")
    },
  )
  it("preserves historical category names and stable references when edited or deactivated", () => {
    const s = seed(),
      c = s.diaryCategories.find((c) => c.scope === "client")!,
      entries = s.diary.filter(
        (d) => d.categoryId === c.id && d.status !== "draft",
      )
    expect(entries.length).toBeGreaterThan(0)
    const next = saveCategory(
      s,
      role,
      { name: "Renamed", description: "Edited", scope: c.scope, active: false },
      c.id,
    )
    expect(getCategories(next, c.scope)).not.toContainEqual(
      expect.objectContaining({ id: c.id }),
    )
    for (const r of entries)
      expect(next.diary.find((d) => d.id === r.id)).toMatchObject({
        categoryId: c.id,
        categoryName: c.name,
        body: r.body,
      })
  })
  it("captures a newly submitted category name and retains it on later edits", () => {
    let s = saveCategory(seed(), role, {
      name: "Initial name",
      description: "",
      scope: "client",
      active: true,
    })
    const id = s.diaryCategories.at(-1)!.id
    s = saveDiary(
      s,
      { scope: "client", targetId: "c1" },
      {
        title: "Fictional entry",
        categoryId: id,
        body: "Fictional observation only",
        coveredAt: now,
        offShiftReason: "Example",
      },
      "submitted",
      "new-diary",
      now,
    )
    s = saveCategory(
      s,
      role,
      { name: "New name", description: "", scope: "client", active: true },
      id,
    )
    expect(s.diary.find((d) => d.id === "new-diary")?.categoryName).toBe(
      "Initial name",
    )
  })
  it("rejects blank, duplicate active names, invalid context, unknown IDs and context transfers", () => {
    const s = seed(),
      c = s.diaryCategories[0],
      f = { name: c.name, description: "", scope: c.scope, active: true }
    expect(() => saveCategory(s, role, f)).toThrow(/already exists/)
    expect(() => saveCategory(s, role, { ...f, name: " " })).toThrow()
    expect(() =>
      saveCategory(s, role, { ...f, scope: "invalid" as never }),
    ).toThrow()
    expect(() => saveCategory(s, role, f, "missing")).toThrow()
    expect(() =>
      saveCategory(
        s,
        role,
        { ...f, scope: c.scope === "client" ? "house" : "client" },
        c.id,
      ),
    ).toThrow(/context/)
  })
  it("reactivation rechecks active-name uniqueness", () => {
    let s = saveCategory(seed(), role, {
      name: "Duplicate inactive",
      description: "",
      scope: "house",
      active: false,
    })
    const id = s.diaryCategories.at(-1)!.id
    s = saveCategory(s, role, {
      name: "Duplicate inactive",
      description: "",
      scope: "house",
      active: true,
    })
    expect(() =>
      saveCategory(
        s,
        role,
        {
          name: "Duplicate inactive",
          description: "",
          scope: "house",
          active: true,
        },
        id,
      ),
    ).toThrow()
  })
})
describe("Shared builder structure and publication validation", () => {
  it("creates an unassigned unpublished draft and permits incomplete saving", () => {
    const s = seed(),
      result = createTemplate(s, role, "Fictional", "", "chart"),
      t = result.data.careTemplates.at(-1)!
    expect(t.versions).toEqual([])
    expect(t.draft?.form.sections).toEqual([])
    expect(result.data.careAssignments).toBe(s.careAssignments)
    expect(
      saveDraft(result.data, role, result.id, t.draft!).careTemplates.at(-1)
        ?.draft,
    ).toEqual(t.draft)
    expect(() => publishTemplate(result.data, role, result.id, true)).toThrow()
  })
  it("adds, reorders, renames, changes type and duplicates without index identity", () => {
    const a = newSection(),
      b = newSection(),
      f = makeField("select"),
      copy = duplicateField(f)
    expect(move([a, b], 1, -1).map((s) => s.id)).toEqual([b.id, a.id])
    expect(move([f, copy], 0, 1).map((s) => s.id)).toEqual([copy.id, f.id])
    expect(changeFieldType({ ...f, label: "Renamed" }, "number")).toMatchObject(
      { id: f.id, label: "Renamed", type: "number" },
    )
    expect(copy.id).not.toBe(f.id)
    if ("options" in f && "options" in copy)
      expect(copy.options).not.toBe(f.options)
  })
  it.each(fieldTypes)(
    "configures supported %s through the same typed model",
    (type) => {
      let field = makeField(type)
      if (field.type === "repeatingTable")
        field = {
          ...field,
          columns: [{ id: "name", label: "Name", type: "text" }],
        }
      expect(validateTemplate(draft([field]))).toEqual([])
    },
  )
  it("rejects duplicate sections/fields, invalid IDs and missing metadata", () => {
    const d = draft(),
      s = d.form.sections[0]
    expect(validateTemplate({ ...d, name: "" })).not.toEqual([])
    expect(
      validateTemplate({ ...d, form: { ...d.form, sections: [s, s] } }),
    ).not.toEqual([])
    expect(validateTemplate(draft([s.fields[0], s.fields[0]]))).not.toEqual([])
    expect(issues({ ...s.fields[0], id: "__proto__" })).toContain("stable")
  })
  it("requires meaningful section titles and fields", () => {
    const d = draft(),
      s = d.form.sections[0]
    expect(
      validateTemplate({
        ...d,
        form: { ...d.form, sections: [{ ...s, title: "", fields: [] }] },
      }),
    ).toHaveLength(2)
  })
  it("rejects blank/duplicate option values, empty lists and invalid defaults", () => {
    expect(
      issues({ id: "choice", label: "Choice", type: "select", options: [] }),
    ).toContain("option")
    expect(
      issues({
        id: "choice",
        label: "Choice",
        type: "radio",
        options: [
          { value: "x", label: "X" },
          { value: "x", label: "Other" },
        ],
      }),
    ).toContain("unique")
    expect(
      issues({
        id: "choice",
        label: "Choice",
        type: "select",
        options: [{ value: "", label: "X" }],
      }),
    ).toContain("nonblank")
    expect(
      issues({
        id: "choice",
        label: "Choice",
        type: "select",
        options: [{ value: "x", label: "X" }],
        defaultValue: "missing",
      }),
    ).toContain("default")
  })
  it("uses Staff validation for valid defaults including zero and multiselect", () => {
    const d = draft([
      { id: "zero", label: "Zero", type: "number", min: 0, defaultValue: 0 },
      {
        id: "multi",
        label: "Multi",
        type: "multi",
        options: [{ value: "x", label: "X" }],
        defaultValue: ["x"],
      },
    ])
    expect(validateTemplate(d)).toEqual([])
    expect(initialFormValues(d.form)).toEqual({ zero: 0, multi: ["x"] })
  })
  it.each(["photo", "file", "table"] as const)(
    "blocks publishing unsupported %s even optional",
    (type) => expect(issues(makeField(type))).toContain("unavailable"),
  )
  it("validates numeric ranges, scale choices, positive steps and invalid date defaults", () => {
    expect(
      issues({ id: "n", label: "N", type: "number", min: 4, max: 1 }),
    ).toContain("bounds")
    expect(issues({ id: "n", label: "N", type: "number", step: 0 })).toContain(
      "positive",
    )
    expect(issues({ id: "s", label: "S", type: "scale", max: 500 })).toContain(
      "101",
    )
    expect(
      issues({ id: "d", label: "D", type: "date", defaultValue: "2026-02-30" }),
    ).toContain("default")
  })
  it("supports declarative conditions, sanitizes hidden values and skips hidden requirements", () => {
    const d = draft([
      { id: "red", label: "Redness", type: "yesno", required: true },
      {
        id: "detail",
        label: "Details",
        type: "text",
        required: true,
        showIf: { fieldId: "red", op: "equals", value: "Yes" },
      },
    ])
    expect(validateTemplate(d)).toEqual([])
    expect(
      sanitizeValues(d.form, { red: "No", detail: "Previously entered" }),
    ).toEqual({ red: "No" })
    expect(validateForm(d.form, { red: "No" })).toEqual({})
    expect(validateForm(d.form, { red: "Yes" })).toHaveProperty("detail")
  })
  it("rejects unknown/self/cyclic dependencies including conditional sections", () => {
    const a: FormFieldDefinition = {
      id: "a",
      label: "A",
      type: "text",
      showIf: { fieldId: "missing", op: "equals", value: "x" },
    }
    expect(issues(a)).toContain("existing")
    expect(
      issues({ ...a, showIf: { fieldId: "a", op: "equals", value: "x" } }),
    ).toContain("Circular")
    const b: FormFieldDefinition = {
      id: "b",
      label: "B",
      type: "text",
      showIf: { fieldId: "a", op: "equals", value: "x" },
    }
    expect(
      validateTemplate(
        draft([
          { ...a, showIf: { fieldId: "b", op: "equals", value: "x" } },
          b,
        ]),
      ).some((e) => e.message.includes("Circular")),
    ).toBe(true)
    const d = draft([{ ...a, showIf: undefined }]),
      section = d.form.sections[0]
    expect(
      validateTemplate({
        ...d,
        form: {
          ...d.form,
          sections: [
            { ...section, showIf: { fieldId: "a", op: "equals", value: "x" } },
          ],
        },
      }).some((e) => e.message.includes("Circular")),
    ).toBe(true)
  })
  it("rejects executable/unsupported operators and invalid controller values", () => {
    const f: FormFieldDefinition = { id: "a", label: "A", type: "text" }
    expect(
      validateTemplate(
        draft([
          f,
          {
            ...f,
            id: "b",
            showIf: { fieldId: "a", op: "eval" as never, value: "alert(1)" },
          },
        ]),
      ),
    ).not.toEqual([])
    expect(
      validateTemplate(
        draft([
          { ...f, type: "yesno" },
          {
            ...f,
            id: "b",
            showIf: { fieldId: "a", op: "equals", value: "invalid" },
          },
        ]),
      ),
    ).not.toEqual([])
  })
  it("validates table columns, selectable cells, row limits and reachable rows", () => {
    const table = {
      id: "items",
      label: "Items",
      type: "repeatingTable" as const,
      columns: [{ id: "name", label: "Name", type: "text" as const }],
    }
    expect(issues({ ...table, columns: [] })).toContain("column")
    expect(
      issues({ ...table, columns: [table.columns[0], table.columns[0]] }),
    ).toContain("unique")
    expect(issues({ ...table, minRows: 4, maxRows: 1 })).toContain("row limits")
    expect(issues({ ...table, required: true, maxRows: 0 })).toContain(
      "row limits",
    )
    expect(issues({ ...table, minRows: 1, allowAdd: false })).toContain(
      "cannot be supplied",
    )
    expect(
      issues({
        ...table,
        columns: [
          { id: "choice", label: "Choice", type: "select", options: [] },
        ],
      }),
    ).toContain("option")
    expect(issues({ ...table, minRows: -1 })).toContain("row limits")
  })
})
describe("Additional configuration boundaries", () => {
  it.each(cellTypes)(
    "configures %s table cells through the scalar Staff engine",
    (type) => {
      const col =
        type === "select" || type === "radio"
          ? {
              id: "cell",
              label: "Cell",
              type,
              options: [{ value: "example", label: "Example" }],
            }
          : { id: "cell", label: "Cell", type }
      expect(
        validateTemplate(
          draft([
            {
              id: "items",
              label: "Items",
              type: "repeatingTable",
              columns: [col],
            },
          ]),
        ),
      ).toEqual([])
    },
  )
  it("rejects empty category IDs and cross-kind or unknown templates", () => {
    expect(() =>
      saveCategory(
        seed(),
        role,
        { name: "Valid", description: "", scope: "client", active: true },
        "",
      ),
    ).toThrow()
    expect(() =>
      createTemplate(seed(), role, "Valid", "", "invalid" as never),
    ).toThrow()
    expect(() => saveDraft(seed(), role, "missing", draft())).toThrow()
  })
  it("projects published configuration and merges Staff edits without dropping the management draft", () => {
    const p = publish(),
      s = newDraftVersion(
        assignTemplate(p.data, role, p.id, "c1", 1, "assign"),
        role,
        p.id,
      ),
      projected = projectStaffSnapshot(s)
    expect(
      projected.careTemplates.find((t) => t.id === p.id),
    ).not.toHaveProperty("draft")
    expect(
      mergeSnapshot(s, projected).careTemplates.find((t) => t.id === p.id)
        ?.draft,
    ).toEqual(s.careTemplates.find((t) => t.id === p.id)?.draft)
  })
  it("rejects invalid history fields and charts without numeric semantics/units", () => {
    const d = draft()
    expect(
      validateTemplate({ ...d, history: { columns: ["missing"] } }),
    ).not.toEqual([])
    expect(
      validateTemplate({
        ...d,
        history: { columns: ["notes"], chart: { fieldId: "notes", unit: "" } },
      }),
    ).not.toEqual([])
  })
})
describe("Immutable published versions, assignments and Staff integration", () => {
  it.each(["care", "chart"] as const)(
    "publishes and assigns a %s form rendered by the shared engine",
    (kind) => {
      const p = publish(kind),
        s = assignTemplate(p.data, role, p.id, "c1", 1, "assign"),
        projected = projectStaffSnapshot(s)
      expect(
        getAssignedCareTemplate(projected, "c1", p.id, kind)?.version
          .sections[0].fields[0].label,
      ).toBe("Observation")
      const next = saveCareRecord(
        projected,
        "c1",
        p.id,
        {
          values: { notes: "Fictional observation" },
          coveredAt: now,
          offShiftReason: "Example handover",
        },
        "submitted",
        "record-new",
        now,
      )
      expect(getCareRecord(next, "c1", p.id, "record-new")).toMatchObject({
        templateVersion: 1,
        status: "submitted",
      })
      expect(
        mergeSnapshot(s, next).careTemplates.find((t) => t.id === p.id)
          ?.versions,
      ).toEqual(s.careTemplates.find((t) => t.id === p.id)?.versions)
      expect(
        getAssignedCareTemplates(s, "c2", kind).some(
          (t) => t.template.id === p.id,
        ),
      ).toBe(false)
    },
  )
  it("preserves table column labels and values in original versions", () => {
    const d = draft([
        {
          id: "equipment",
          label: "Equipment",
          type: "repeatingTable",
          required: true,
          columns: [
            {
              id: "name",
              label: "Original equipment label",
              type: "text",
              required: true,
            },
          ],
          allowRemoveDraftRows: false,
        },
      ]),
      p = publish("chart", d),
      assigned = assignTemplate(p.data, role, p.id, "c1", 1, "assign"),
      s = saveCareRecord(
        assigned,
        "c1",
        p.id,
        {
          values: {
            equipment: [{ id: "row-a", values: { name: "Fictional chair" } }],
          },
          coveredAt: now,
          offShiftReason: "Example",
        },
        "submitted",
        "table-record",
        now,
      )
    expect(s.careRecords[0].values.equipment).toEqual([
      { id: "row-a", values: { name: "Fictional chair" } },
    ])
    const next = newDraftVersion(s, role, p.id),
      t = next.careTemplates.find((t) => t.id === p.id)!
    expect(t.draft!.form.sections[0].fields[0]).not.toBe(
      t.versions[0].sections[0].fields[0],
    )
    expect(t.versions[0].sections[0].fields[0]).toMatchObject({
      columns: [{ id: "name", label: "Original equipment label" }],
    })
  })
  it("published versions cannot be edited in place; publish requires confirmation", () => {
    const p = publish()
    expect(() => saveDraft(p.data, role, p.id, draft())).toThrow(/new draft/)
    const s = newDraftVersion(p.data, role, p.id)
    expect(() => newDraftVersion(s, role, p.id)).toThrow()
    expect(() => publishTemplate(s, role, p.id, false)).toThrow(/Confirm/)
  })
  it("copies stable IDs, preserves history, and requires explicit reassignment", () => {
    const p = publish(),
      s = assignTemplate(p.data, role, p.id, "c1", 1, "assign"),
      withRecord = saveCareRecord(
        s,
        "c1",
        p.id,
        {
          values: { notes: "Original record" },
          coveredAt: now,
          offShiftReason: "Example",
        },
        "submitted",
        "old",
        now,
      ),
      next = newDraftVersion(withRecord, role, p.id),
      t = next.careTemplates.find((t) => t.id === p.id)!,
      d = t.draft!
    const edited = saveDraft(next, role, p.id, {
        ...d,
        name: "New name",
        form: {
          ...d.form,
          sections: d.form.sections.map((s) => ({
            ...s,
            fields: s.fields.map((f) => ({ ...f, label: "New label" })),
          })),
        },
      }),
      published = publishTemplate(edited, role, p.id, true)
    expect(
      published.careTemplates.find((t) => t.id === p.id)?.versions[0],
    ).toEqual(p.data.careTemplates.find((t) => t.id === p.id)?.versions[0])
    expect(
      getAssignedCareTemplate(published, "c1", p.id)?.version.version,
    ).toBe(1)
    expect(getAssignedCareTemplate(published, "c1", p.id)?.template.name).toBe(
      draft().name,
    )
    const updated = assignTemplate(published, role, p.id, "c1", 2, "update")
    expect(getAssignedCareTemplate(updated, "c1", p.id)?.version.version).toBe(
      2,
    )
    expect(getCareRecord(updated, "c1", p.id, "old")?.templateVersion).toBe(1)
    expect(getCareRecord(updated, "c1", p.id, "old")?.values).toEqual({
      notes: "Original record",
    })
  })
  it("old-version own drafts retain values and can submit after explicit version reassignment", () => {
    const p = publish(),
      assigned = assignTemplate(p.data, role, p.id, "c1", 1, "assign"),
      input = {
        values: { notes: "Original draft" },
        coveredAt: now,
        offShiftReason: "Example",
      },
      withDraft = saveCareRecord(
        assigned,
        "c1",
        p.id,
        input,
        "draft",
        "old-draft",
        now,
      ),
      next = newDraftVersion(withDraft, role, p.id),
      published = publishTemplate(next, role, p.id, true),
      updated = assignTemplate(published, role, p.id, "c1", 2, "update"),
      submitted = saveCareRecord(
        updated,
        "c1",
        p.id,
        input,
        "submitted",
        "ignored",
        now,
        "old-draft",
      )
    expect(getCareRecord(submitted, "c1", p.id, "old-draft")).toMatchObject({
      templateVersion: 1,
      values: input.values,
      status: "submitted",
    })
  })
  it("deactivation retains readable history but prevents new entries and draft submission", () => {
    const p = publish(),
      s = assignTemplate(p.data, role, p.id, "c1", 1, "assign"),
      input = {
        values: { notes: "Original" },
        coveredAt: now,
        offShiftReason: "Example",
      },
      recorded = saveCareRecord(s, "c1", p.id, input, "submitted", "old", now),
      next = assignTemplate(recorded, role, p.id, "c1", 1, "deactivate"),
      projected = projectStaffSnapshot(next)
    expect(getAssignedCareTemplate(projected, "c1", p.id)).toBeUndefined()
    expect(getReadableCareTemplate(projected, "c1", p.id)).toBeDefined()
    expect(getCareRecord(projected, "c1", p.id, "old")).toBeDefined()
    expect(() =>
      saveCareRecord(next, "c1", p.id, input, "submitted", "new", now),
    ).toThrow()
    expect(getReadableCareTemplate(next, "c4", p.id)).toBeUndefined()
  })
  it("rejects unpublished, duplicate, missing client/version, unknown action and foreign targets", () => {
    const c = createTemplate(seed(), role, "Draft", "", "care")
    expect(() =>
      assignTemplate(c.data, role, c.id, "c1", 1, "assign"),
    ).toThrow()
    const p = publish(),
      s = assignTemplate(p.data, role, p.id, "c1", 1, "assign")
    expect(() => assignTemplate(s, role, p.id, "c1", 1, "assign")).toThrow(
      /already/,
    )
    expect(() =>
      assignTemplate(s, role, p.id, "missing", 1, "assign"),
    ).toThrow()
    expect(() => assignTemplate(s, role, p.id, "c2", 999, "assign")).toThrow()
    expect(() =>
      assignTemplate(s, role, "missing", "c2", 1, "assign"),
    ).toThrow()
    expect(() =>
      assignTemplate(s, role, p.id, "c2", 1, "delete" as never),
    ).toThrow()
    expect(() => newDraftVersion(p.data, role, p.id, 999)).toThrow()
  })
  it("archives only after assignments are deactivated, retaining all versions and records", () => {
    const p = publish(),
      s = assignTemplate(p.data, role, p.id, "c1", 1, "assign")
    expect(() => archiveTemplate(s, role, p.id, true)).toThrow(/Deactivate/)
    const next = archiveTemplate(
      assignTemplate(s, role, p.id, "c1", 1, "deactivate"),
      role,
      p.id,
      true,
    )
    expect(next.careTemplates.find((t) => t.id === p.id)?.versions).toEqual(
      p.data.careTemplates.find((t) => t.id === p.id)?.versions,
    )
    expect(() => assignTemplate(next, role, p.id, "c2", 1, "assign")).toThrow()
  })
  it.each(["Staff", "Senior Staff", "Unknown"])(
    "rejects every management mutation for %s",
    (restricted) => {
      const p = publish(),
        s = newDraftVersion(p.data, role, p.id)
      const actions = [
        () => createTemplate(s, restricted, "Name", "", "care"),
        () => saveDraft(s, restricted, p.id, draft()),
        () => publishTemplate(s, restricted, p.id, true),
        () => newDraftVersion(p.data, restricted, p.id),
        () => archiveTemplate(s, restricted, p.id, true),
        () => assignTemplate(s, restricted, p.id, "c1", 1, "assign"),
        () =>
          saveCategory(s, restricted, {
            name: "Example",
            description: "",
            scope: "client",
            active: true,
          }),
      ]
      for (const action of actions) expect(action).toThrow(/permission/)
    },
  )
  it("renaming a legacy template preserves its old published metadata and labels", () => {
    const original = seed(),
      old = original.careTemplates.find((t) => t.id === "t1")!,
      next = newDraftVersion(original, role, "t1"),
      t = next.careTemplates.find((t) => t.id === "t1")!,
      published = publishTemplate(
        saveDraft(next, role, "t1", {
          ...t.draft!,
          name: "New display name",
          form: {
            ...t.draft!.form,
            sections: t.draft!.form.sections.map((s) => ({
              ...s,
              fields: s.fields.filter(
                (f) => !["photo", "file", "table"].includes(f.type),
              ),
            })),
          },
        }),
        role,
        "t1",
        true,
      )
    expect(getAssignedCareTemplate(published, "c1", "t1")?.template.name).toBe(
      old.name,
    )
    expect(
      published.careTemplates.find((t) => t.id === "t1")?.versions[0],
    ).toEqual(old.versions[0])
    expect(
      newDraftVersion(published, role, "t1", 1).careTemplates.find(
        (t) => t.id === "t1",
      )?.draft?.name,
    ).toBe(old.name)
  })
  it("permits Manager operational configuration without altering account privileges", () => {
    const s = seed(),
      next = createTemplate(s, "Manager", "Manager draft", "", "care")
    expect(next.data.careTemplates.at(-1)?.createdBy).toBe("m1")
    expect(next.data.staff).toBe(s.staff)
    expect(next.data.assignments).toBe(s.assignments)
  })
  it("rejects missing organisation and malformed template shapes", () => {
    expect(() =>
      createTemplate(
        { ...seed(), organisation: undefined },
        role,
        "Name",
        "",
        "care",
      ),
    ).toThrow(/Organisation/)
    const c = createTemplate(seed(), role, "Name", "", "care")
    expect(() =>
      saveDraft(c.data, role, c.id, {
        ...draft(),
        form: { ...draft().form, published: true },
      }),
    ).toThrow()
    expect(
      validateTemplate(
        draft([
          { id: "bad", label: "Bad", type: "select" } as FormFieldDefinition,
        ]),
      ),
    ).not.toEqual([])
  })
})
