import type {
  ConfigurableFormVersion,
  FormValues,
} from "../../src/modules/forms/types"
/** Fictional review questions only; not a clinical protocol or approved care assessment. */
export const careFormV1: ConfigurableFormVersion = {
  version: 1,
  published: true,
  name: "Fictional support review v1",
  sections: [
    {
      id: "review",
      title: "Original review questions",
      fields: [
        {
          id: "notes",
          type: "textarea",
          label: "Original observations",
          required: true,
        },
        { id: "summary", type: "text", label: "Short summary" },
        {
          id: "support",
          type: "select",
          label: "Support type",
          required: true,
          options: [
            { value: "routine", label: "Original routine choice" },
            { value: "follow-up", label: "Follow-up" },
          ],
        },
        {
          id: "followUp",
          type: "text",
          label: "Follow-up details",
          required: true,
          showIf: { fieldId: "support", op: "equals", value: "follow-up" },
        },
        {
          id: "count",
          type: "number",
          label: "Activity count",
          min: 0,
          max: 10,
          step: 1,
        },
        {
          id: "rating",
          type: "scale",
          label: "Fictional rating",
          min: 1,
          max: 5,
          step: 1,
          required: true,
        },
        {
          id: "consent",
          type: "yesno",
          label: "Preferences discussed",
          required: true,
        },
        {
          id: "activities",
          type: "multi",
          label: "Activity locations",
          options: [
            { value: "home", label: "Home" },
            { value: "community", label: "Community" },
          ],
        },
        {
          id: "choice",
          type: "radio",
          label: "Preferred activity",
          options: [
            { value: "walk", label: "Walk" },
            { value: "read", label: "Read" },
          ],
        },
        { id: "eventDate", type: "date", label: "Activity date" },
        { id: "eventTime", type: "time", label: "Activity time" },
        { id: "eventAt", type: "datetime", label: "Activity date and time" },
        {
          id: "items",
          type: "repeatingTable",
          label: "Review items",
          required: true,
          minRows: 1,
          maxRows: 3,
          allowAdd: true,
          defaultValue: [
            {
              id: "configured-row",
              values: { item: "Fictional item", quantity: 1, state: "checked" },
            },
          ],
          columns: [
            {
              id: "item",
              type: "text",
              label: "Original item",
              required: true,
            },
            {
              id: "quantity",
              type: "number",
              label: "Quantity",
              min: 0,
              max: 4,
              step: 1,
              required: true,
            },
            {
              id: "state",
              type: "select",
              label: "State",
              options: [
                { value: "checked", label: "Checked" },
                { value: "pending", label: "Pending" },
              ],
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
export const careFormV2: ConfigurableFormVersion = structuredClone(careFormV1)
careFormV2.version = 2
careFormV2.name = "Fictional support review v2"
careFormV2.sections = careFormV2.sections.map((s) => ({
  ...s,
  title: "Updated review questions",
  fields: s.fields.map((f) =>
    f.id === "notes"
      ? { ...f, label: "Updated observations" }
      : f.id === "support" && f.type === "select"
        ? {
            ...f,
            options: [
              { value: "routine", label: "Updated routine choice" },
              { value: "follow-up", label: "Follow-up" },
            ],
          }
        : f.id === "items" && f.type === "repeatingTable"
          ? {
              ...f,
              columns: f.columns.map((c) =>
                c.id === "item" ? { ...c, label: "Updated item" } : c,
              ),
            }
          : f,
  ),
}))
export function careValues(): FormValues {
  return {
    notes: "Fictional respectful observation only.",
    support: "routine",
    count: 0,
    rating: 3,
    consent: "Yes",
    activities: ["home"],
    choice: "walk",
    eventDate: "2026-01-01",
    eventTime: "23:30",
    eventAt: "2026-01-01T23:30",
    items: [
      {
        id: "stable-row",
        values: { item: "Fictional item", quantity: 1, state: "checked" },
      },
    ],
  }
}
