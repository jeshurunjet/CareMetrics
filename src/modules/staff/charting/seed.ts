import type {
  CareTemplate,
  ClientCareTemplateAssignment,
  CareRecord,
} from "../care/types"
import type {
  CareTableColumn,
  ConfigurableFormVersion,
} from "../../forms/types"
const options = (labels: string[]) =>
  labels.map((label) => ({ value: label, label }))
const equipmentColumns: readonly CareTableColumn[] = [
  { id: "name", label: "Equipment name", type: "text", required: true },
  {
    id: "type",
    label: "Equipment type",
    type: "select",
    required: true,
    options: options(["Mobility", "Daily living", "Exercise", "Other"]),
  },
  { id: "serial", label: "Serial number", type: "text" },
  { id: "acquired", label: "Date acquired", type: "date", required: true },
  { id: "due", label: "Maintenance due", type: "date" },
  { id: "notes", label: "Condition / notes", type: "text" },
]
const equipmentVersion = (
  version: number,
  old = false,
): ConfigurableFormVersion => ({
  version,
  published: true,
  sections: [
    {
      id: "equipment",
      title: "Equipment register",
      fields: [
        {
          id: "equipment",
          label: "Equipment items",
          type: "repeatingTable",
          required: true,
          help: "Fictional equipment documentation. Add one row per item.",
          minRows: 1,
          maxRows: 6,
          allowAdd: true,
          columns: old
            ? equipmentColumns
                .filter((c) => c.id !== "due")
                .map((c) =>
                  c.id === "name"
                    ? { ...c, label: "Original equipment name" }
                    : c,
                )
            : equipmentColumns,
        },
      ],
    },
  ],
})
export const chartTemplates: CareTemplate[] = [
  {
    id: "t4",
    kind: "chart",
    name: "Bowel Movement Chart",
    description: "Bristol stool chart observations.",
    history: { columns: ["stool", "size", "incontinence"] },
    versions: [
      {
        version: 1,
        published: true,
        reference: {
          label: "Bristol stool reference",
          items: [
            "Separate hard lumps",
            "Lumpy sausage",
            "Cracked sausage",
            "Smooth, soft",
            "Soft blobs",
            "Mushy",
            "Liquid",
          ].map((label, i) => ({ value: String(i + 1), label })),
        },
        sections: [
          {
            id: "bowel",
            title: "Bowel movement",
            fields: [
              {
                id: "stool",
                label: "Stool type (Bristol)",
                type: "select",
                required: true,
                options: options(
                  Array.from({ length: 7 }, (_, i) => `Type ${i + 1}`),
                ),
                help: "Fictional observation categories only; no clinical interpretation or advice.",
              },
              {
                id: "size",
                label: "Size",
                type: "radio",
                required: true,
                options: options(["Small", "Medium", "Large"]),
              },
              {
                id: "incontinence",
                label: "Incontinence",
                type: "yesno",
                required: true,
              },
              { id: "notes", label: "Notes", type: "textarea" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "t5",
    kind: "chart",
    name: "Exercise Chart",
    description: "Exercise sessions and duration.",
    history: {
      columns: ["setting", "kind", "duration"],
      chart: { fieldId: "duration", unit: "minutes" },
    },
    versions: [
      {
        version: 1,
        published: true,
        sections: [
          {
            id: "exercise",
            title: "Exercise session",
            fields: [
              {
                id: "setting",
                label: "Exercise setting",
                type: "radio",
                required: true,
                options: options(["Home", "OT", "Centre"]),
              },
              {
                id: "kind",
                label: "Exercise type",
                type: "select",
                required: true,
                options: options([
                  "Walking",
                  "Hydrotherapy",
                  "Stretching",
                  "Strength",
                  "Physio programme",
                ]),
              },
              {
                id: "duration",
                label: "Duration (minutes)",
                type: "number",
                required: true,
                min: 0,
                step: 1,
                help: "Minutes recorded; no clinical target or recommendation.",
              },
              { id: "notes", label: "Notes", type: "textarea" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "t6",
    kind: "chart",
    name: "Equipment Register",
    description: "Equipment, identifiers and maintenance dates.",
    history: { columns: ["equipment"] },
    versions: [equipmentVersion(1, true), equipmentVersion(2)],
  },
  {
    id: "chart-private",
    kind: "chart",
    name: "Restricted chart example",
    description: "Unassigned chart content",
    versions: [equipmentVersion(1)],
  },
]
export const chartAssignments: ClientCareTemplateAssignment[] = [
  ...["t4", "t5", "t6"].map((templateId) => ({
    clientId: "c1",
    templateId,
    version: templateId === "t6" ? 2 : 1,
    status: "active" as const,
  })),
  { clientId: "c2", templateId: "t4", version: 1, status: "active" },
  { clientId: "c4", templateId: "chart-private", version: 1, status: "active" },
]
export function seedChartRecords(now: string): CareRecord[] {
  const at = (days: number, hours = 0) =>
    new Date(Date.parse(now) - days * 86400000 - hours * 3600000).toISOString()
  const base = (id: string, templateId: string, i: number): CareRecord => ({
    id,
    templateId,
    templateVersion: 1,
    clientId: "c1",
    authorId: i % 3 === 0 ? "s2" : "s1",
    status: "submitted",
    coveredAt: at(i, 3),
    createdAt: at(i, 2),
    submittedAt: at(i, 1),
    offShiftReason: "Fictional retrospective documentation",
    values: {},
  })
  return [
    ...Array.from({ length: 9 }, (_, i) => ({
      ...base(`chart-bowel-${i + 1}`, "t4", i),
      values: {
        stool: `Type ${(i % 7) + 1}`,
        size: ["Small", "Medium", "Large"][i % 3],
        incontinence: i % 2 ? "Yes" : "No",
        notes: `Fictional bowel observation ${i + 1}`,
      },
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      ...base(`chart-exercise-${i + 1}`, "t5", i),
      values: {
        setting: ["Home", "OT", "Centre"][i % 3],
        kind: ["Walking", "Stretching", "Hydrotherapy"][i % 3],
        duration: [30, 20, 45, 25, 40, 15, 35, 0][i],
        notes: `Fictional exercise session ${i + 1}`,
      },
    })),
    {
      ...base("chart-equipment-1", "t6", 1),
      templateVersion: 2,
      authorId: "s1",
      values: {
        equipment: [
          {
            id: "equipment-row-a",
            values: {
              name: "Demo walking frame",
              type: "Mobility",
              serial: "DEMO-101",
              acquired: "2025-02-10",
              due: "2027-02-10",
              notes: "Fictional example; good condition",
            },
          },
          {
            id: "equipment-row-b",
            values: {
              name: "Demo exercise mat",
              type: "Exercise",
              serial: "DEMO-102",
              acquired: "2025-05-01",
              due: "2027-05-01",
              notes: "Fictional demonstration only",
            },
          },
        ],
      },
    },
    {
      ...base("chart-equipment-old", "t6", 20),
      authorId: "s1",
      values: {
        equipment: [
          {
            id: "legacy-row",
            values: {
              name: "Historical demo frame",
              type: "Mobility",
              serial: "OLD-DEMO",
              acquired: "2024-01-01",
              notes: "Original version columns",
            },
          },
        ],
      },
    },
    {
      ...base("chart-equipment-draft", "t6", 3),
      templateVersion: 2,
      status: "draft",
      authorId: "s1",
      submittedAt: undefined,
      values: {
        equipment: [
          {
            id: "draft-row-a",
            values: { name: "Partial demo item", type: "Mobility" },
          },
          { id: "draft-row-b", values: { serial: "PARTIAL-DEMO" } },
        ],
      },
    },
    {
      ...base("chart-private-draft", "t6", 3),
      templateVersion: 2,
      status: "draft",
      authorId: "s2",
      submittedAt: undefined,
    },
    {
      ...base("chart-c2-bowel", "t4", 2),
      clientId: "c2",
      values: {
        stool: "Type 3",
        size: "Small",
        incontinence: "No",
        notes: "Different client's fictional chart",
      },
    },
    {
      ...base("chart-restricted-record", "chart-private", 2),
      clientId: "c4",
      values: { notes: "Unassigned chart content" },
    },
  ]
}
