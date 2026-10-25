import { it, expect } from "vitest"
import { careFormV1, careValues } from "../fixtures/care-plan"
import {
  publishedDefinition,
  submittedAnswers,
  storedAnswers,
  canonicalJson,
} from "../../src/modules/forms/submission"
import type { ConfigurableFormVersion } from "../../src/modules/forms/types"
const definition = () => publishedDefinition(careFormV1, 1, "Fictional")
it("reuses the configured fields, validates answers and normalises NZ datetime without flattening rows", () => {
  const form = definition(),
    values = submittedAnswers(form, careValues())
  expect(values.eventAt).toBe("2026-01-01T10:30:00.000Z")
  expect(values.items).toEqual(careValues().items)
  expect(storedAnswers(form, values)).toEqual(values)
})
it("does not require a correctly hidden question, requires it when visible, and rejects submitted hidden data", () => {
  expect(submittedAnswers(definition(), careValues())).not.toHaveProperty(
    "followUp",
  )
  expect(() =>
    submittedAnswers(definition(), { ...careValues(), support: "follow-up" }),
  ).toThrow()
  expect(
    submittedAnswers(definition(), {
      ...careValues(),
      support: "follow-up",
      followUp: "Fictional follow-up",
    }).followUp,
  ).toBe("Fictional follow-up")
  expect(() =>
    submittedAnswers(definition(), {
      ...careValues(),
      followUp: "Hidden answer",
    }),
  ).toThrow()
})
it.each([
  { notes: undefined },
  { notes: 1 },
  { notes: " " },
  { notes: "x".repeat(10001) },
  { notes: "invalid\u0000text" },
  { support: "unknown" },
  { count: -1 },
  { count: 11 },
  { count: 1.5 },
  { count: Infinity },
  { rating: 6 },
  { rating: "3" },
  { consent: true },
  { consent: "Maybe" },
  { activities: ["bad"] },
  { activities: ["home", "home"] },
  { choice: "bad" },
  { eventDate: "2026-02-30" },
  { eventTime: "24:00" },
  { eventAt: "2026-04-05T02:30" },
  { eventAt: "2026-09-27T02:30" },
  { forgedField: "answer" },
  { items: "flattened" },
  { items: [] },
  {
    items: [{ id: "a", values: { item: "x", quantity: 5, state: "checked" } }],
  },
  { items: [{ id: "a", values: { item: "x", quantity: 1, state: "bad" } }] },
  {
    items: [
      {
        id: "a",
        values: { item: "x", quantity: 1, state: "checked", unknown: "value" },
      },
    ],
  },
  { items: [{ id: "a", values: { item: "x" } }] },
  {
    items: [
      { id: "a", values: {} },
      { id: "a", values: {} },
    ],
  },
  { items: [{ id: "__proto__", values: {} }] },
  { items: [{ id: "a", values: {}, extra: "unknown" }] },
])("strictly rejects invalid answer %j", (patch) =>
  expect(() =>
    submittedAnswers(definition(), { ...careValues(), ...patch }),
  ).toThrow(),
)
it("enforces configured add/remove constraints without losing stable IDs", () => {
  const raw = structuredClone(careFormV1)
  raw.sections = raw.sections.map((s) => ({
    ...s,
    fields: s.fields.map((f) =>
      f.type === "repeatingTable"
        ? { ...f, allowAdd: false, allowRemoveDraftRows: false }
        : f,
    ),
  }))
  const form = publishedDefinition(raw, 1, "Fictional")
  expect(() => submittedAnswers(form, careValues())).toThrow()
  expect(
    submittedAnswers(form, {
      ...careValues(),
      items: [
        {
          id: "configured-row",
          values: { item: "Fictional", quantity: 0, state: "checked" },
        },
      ],
    }).items,
  ).toHaveLength(1)
})
it.each([
  (f: ConfigurableFormVersion) => ({ ...f, version: 2 }),
  (f: ConfigurableFormVersion) => ({ ...f, published: false }),
  (f: ConfigurableFormVersion) => ({ ...f, execute: "arbitrary script" }),
  (f: ConfigurableFormVersion) => ({
    ...f,
    sections: [
      {
        ...f.sections[0],
        fields: [
          { id: "file", type: "file", label: "Upload", unsupported: true },
        ],
      },
    ],
  }),
  (f: ConfigurableFormVersion) => ({
    ...f,
    sections: [
      {
        ...f.sections[0],
        fields: [f.sections[0].fields[0], f.sections[0].fields[0]],
      },
    ],
  }),
  (f: ConfigurableFormVersion) => ({
    ...f,
    sections: [
      {
        ...f.sections[0],
        fields: [
          {
            id: "x",
            type: "text",
            label: "x",
            showIf: { fieldId: "x", op: "equals", value: "x" },
          },
        ],
      },
    ],
  }),
  (f: ConfigurableFormVersion) => ({
    ...f,
    sections: [
      {
        ...f.sections[0],
        fields: [
          {
            id: "x",
            type: "select",
            label: "x",
            options: [
              { value: "a", label: "A" },
              { value: "a", label: "Again" },
            ],
          },
        ],
      },
    ],
  }),
])("rejects invalid/unsupported version definition %#", (patch) =>
  expect(() =>
    publishedDefinition(patch(structuredClone(careFormV1)), 1, "Fictional"),
  ).toThrow(),
)
it("keeps exact object semantics for retry and preserves array/row order", () => {
  expect(canonicalJson({ a: 1, b: { c: 2, d: 3 } })).toBe(
    canonicalJson({ b: { d: 3, c: 2 }, a: 1 }),
  )
  expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]))
})
it("keeps literal markup as text and rejects oversized total payloads", () => {
  expect(
    submittedAnswers(definition(), {
      ...careValues(),
      notes: "<script>literal only</script>",
    }).notes,
  ).toContain("<script>")
  expect(() =>
    submittedAnswers(definition(), {
      ...careValues(),
      notes: "x".repeat(10000),
      summary: "y".repeat(10000),
      followUp: "z".repeat(10000),
    }),
  ).toThrow()
})

import { uniqueKeyJson } from "../../src/lib/json-keys"
it.each([
  '{"notes":"a","notes":"b"}',
  '{"values":{"notes":"a","no\\u0074es":"b"}}',
  '{"rows":[{"id":"a","id":"b"}]}',
])("rejects duplicate JSON answer keys %s", (source) =>
  expect(() => uniqueKeyJson(source)).toThrow(),
)
it("allows repeated field names in distinct rows, and braces/escaped quotes inside text", () => {
  const source = JSON.stringify({
    rows: [
      { id: "a", values: { text: '{} [] \" : ' } },
      { id: "b", values: { text: "safe" } },
    ],
  })
  expect(uniqueKeyJson(source)).toEqual(JSON.parse(source))
})
