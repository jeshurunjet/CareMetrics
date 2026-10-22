import type {
  CareTemplate,
  ClientCareTemplateAssignment,
  CareRecord,
} from "./types"
import type { FormFieldDefinition, FormOption } from "../../forms/types"
const options = (...names: string[]): FormOption[] =>
  names.map((value) => ({ value, label: value }))
const skinFields: readonly FormFieldDefinition[] = [
  {
    id: "condition",
    type: "radio",
    label: "Overall skin condition",
    required: true,
    options: options("Intact", "Dry", "Broken", "Other"),
  },
  {
    id: "redness",
    type: "yesno",
    label: "Redness or discolouration observed?",
    required: true,
  },
  {
    id: "areas",
    type: "multi",
    label: "Affected areas",
    options: options("Sacrum", "Heels", "Hips", "Elbows", "Shoulders"),
    showIf: { fieldId: "redness", op: "equals", value: "Yes" },
  },
  {
    id: "bodyArea",
    type: "select",
    label: "Body area",
    required: true,
    options: options("Arms", "Legs", "Torso", "Other"),
    showIf: { fieldId: "redness", op: "equals", value: "Yes" },
  },
  {
    id: "unusual",
    type: "text",
    label: "Unusual findings",
    help: "Fictional interface example; not clinical guidance.",
    showIf: { fieldId: "redness", op: "equals", value: "Yes" },
  },
  {
    id: "pressure",
    type: "scale",
    label: "Pressure-area observation",
    min: 1,
    max: 5,
    step: 1,
    defaultValue: 1,
    help: "Demonstration scale only; not a validated clinical score.",
  },
  {
    id: "photo",
    type: "photo",
    label: "Photo of area (optional)",
    unsupported: true,
  },
  { id: "notes", type: "textarea", label: "Notes" },
]
export const careTemplates: CareTemplate[] = [
  {
    id: "t1",
    kind: "care",
    name: "Skin Integrity",
    description: "Weekly skin check and pressure-area review.",
    versions: [
      {
        version: 1,
        published: true,
        sections: [
          {
            id: "skin",
            title: "Skin observations",
            fields: [
              {
                id: "condition",
                type: "text",
                label: "Original skin condition",
                required: true,
              },
              {
                id: "notes",
                type: "textarea",
                label: "Original observation notes",
              },
            ],
          },
        ],
      },
      {
        version: 2,
        published: true,
        sections: [
          { id: "skin", title: "Skin observations", fields: skinFields },
        ],
      },
    ],
  },
  {
    id: "t2",
    kind: "care",
    name: "Medical Cares Record",
    description: "Fluid balance, feeding and device checks.",
    versions: [
      {
        version: 1,
        published: true,
        sections: [
          {
            id: "fluids",
            title: "Fluid observations",
            fields: [
              {
                id: "fluids",
                type: "table",
                label: "Fluid intake / output log",
                unsupported: true,
                help: "Repeating tables are planned for Phase 1C.3; use the demonstration totals below.",
              },
              {
                id: "intake",
                type: "number",
                label: "Fluid intake (ml)",
                min: 0,
                max: 10000,
                required: true,
                help: "Fictional data-entry range only; no clinical calculation.",
              },
              {
                id: "output",
                type: "number",
                label: "Urine output (ml)",
                min: 0,
                max: 10000,
                required: true,
              },
              {
                id: "device",
                type: "select",
                label: "Equipment/device",
                required: true,
                options: options(
                  "None",
                  "Catheter",
                  "Stoma",
                  "PEG feeding tube",
                ),
              },
              {
                id: "catheter",
                type: "yesno",
                label: "Catheter present?",
                required: true,
              },
            ],
          },
          {
            id: "catheter-details",
            title: "Catheter observations",
            showIf: { fieldId: "catheter", op: "equals", value: "Yes" },
            fields: [
              {
                id: "deviceOk",
                type: "yesno",
                label: "Device site clean and secure?",
                required: true,
              },
              {
                id: "deviceNotes",
                type: "textarea",
                label: "Device-related observations",
                required: true,
              },
            ],
          },
          {
            id: "notes",
            title: "Additional observations",
            fields: [
              { id: "notes", type: "textarea", label: "Observations" },
              {
                id: "followup",
                type: "datetime",
                label: "Observation follow-up time",
                help: "Optional fictional Pacific/Auckland time; no scheduling service.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "t3",
    kind: "care",
    name: "Medication Receipt Record",
    description:
      "Documentation only — records receipt of medication deliveries.",
    documentationOnly: true,
    versions: [
      {
        version: 1,
        published: true,
        sections: [
          {
            id: "receipt",
            title: "Receipt documentation",
            fields: [
              {
                id: "received",
                type: "yesno",
                label: "Medications received or collected?",
                required: true,
              },
              {
                id: "source",
                type: "select",
                label: "Received from",
                options: options(
                  "Pharmacy delivery",
                  "Collected by staff",
                  "Family",
                ),
                showIf: { fieldId: "received", op: "equals", value: "Yes" },
              },
              {
                id: "logged",
                type: "yesno",
                label: "Receipt recorded in check-in log?",
                required: true,
              },
              {
                id: "receiptDate",
                type: "date",
                label: "Receipt date",
                required: true,
              },
              {
                id: "receiptTime",
                type: "time",
                label: "Receipt time",
                required: true,
              },
              {
                id: "reference",
                type: "text",
                label: "Delivery reference",
                defaultValue: "DEMO-",
              },
              { id: "notes", type: "textarea", label: "Notes" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "t-private",
    kind: "care",
    name: "Restricted assessment example",
    description: "Unassigned fixture only",
    versions: [
      {
        version: 1,
        published: true,
        sections: [
          {
            id: "private",
            title: "Restricted",
            fields: [
              { id: "private", type: "text", label: "Restricted field" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "t-unassigned",
    kind: "care",
    name: "Unassigned template example",
    description: "Not assigned to any client",
    versions: [{ version: 1, published: true, sections: [] }],
  },
]
export const careAssignments: ClientCareTemplateAssignment[] = [
  { clientId: "c1", templateId: "t1", version: 2, status: "active" },
  { clientId: "c1", templateId: "t2", version: 1, status: "active" },
  { clientId: "c1", templateId: "t3", version: 1, status: "active" },
  { clientId: "c2", templateId: "t1", version: 2, status: "active" },
  { clientId: "c4", templateId: "t-private", version: 1, status: "active" },
]
export function seedCareRecords(now: string): CareRecord[] {
  const at = (hours: number) =>
    new Date(Date.parse(now) - hours * 3600000).toISOString()
  const records: CareRecord[] = Array.from(
    { length: 9 },
    (_, i): CareRecord => ({
      id: `care-c1-skin-${i + 1}`,
      clientId: "c1",
      templateId: "t1",
      templateVersion: i === 6 ? 1 : 2,
      authorId: i === 8 ? "s2" : "s1",
      coveredAt: at(i * 48 + 3),
      createdAt: at(i * 48 + 2),
      submittedAt: i >= 7 ? undefined : at(i * 48 + 1),
      status: i >= 7 ? "draft" : "submitted",
      offShiftReason: "Fictional review after handover",
      values:
        i === 6
          ? {
              condition: "Legacy fictional observation",
              notes: "Recorded using the original published version.",
            }
          : {
              condition: "Intact",
              redness: "No",
              pressure: 1,
              notes: `Fictional observation ${i + 1}. Interface demonstration only; no real health information.`,
            },
    }),
  )
  records.push({
    id: "care-c1-medical-1",
    clientId: "c1",
    templateId: "t2",
    templateVersion: 1,
    authorId: "s1",
    coveredAt: at(4),
    createdAt: at(3),
    submittedAt: at(2),
    status: "submitted",
    values: {
      intake: 250,
      output: 200,
      device: "None",
      catheter: "No",
      notes: "Fictional numeric entry for UI testing.",
      followup: at(1),
    },
  })
  records.push({
    id: "care-c2-skin-1",
    clientId: "c2",
    templateId: "t1",
    templateVersion: 2,
    authorId: "s2",
    coveredAt: at(4),
    createdAt: at(3),
    submittedAt: at(2),
    status: "submitted",
    values: {
      condition: "Dry",
      redness: "No",
      pressure: 1,
      notes: "Separate fictional client observation.",
    },
  })
  records.push({
    id: "care-private-1",
    clientId: "c4",
    templateId: "t-private",
    templateVersion: 1,
    authorId: "s1",
    coveredAt: at(4),
    createdAt: at(3),
    submittedAt: at(2),
    status: "submitted",
    values: { private: "Unassigned assessment content" },
  })
  return records
}
