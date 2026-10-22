export const careListHref = (
  clientId: string,
  kind: "care" | "chart" = "care",
) =>
  `/clients/${encodeURIComponent(clientId)}?tab=${
    kind === "chart" ? "charting" : "care"
  }`
export const careHistoryHref = (
  clientId: string,
  templateId: string,
  kind: "care" | "chart" = "care",
) => `${careListHref(clientId, kind)}&sub=${encodeURIComponent(templateId)}`
export const careDetailHref = (
  clientId: string,
  templateId: string,
  id: string,
  correction = false,
  kind: "care" | "chart" = "care",
) =>
  `${careHistoryHref(clientId, templateId, kind)}&item=${encodeURIComponent(id)}${
    correction ? "&action=correction" : ""
  }`
export const careFormHref = (
  clientId: string,
  templateId: string,
  draftId?: string,
) =>
  `/clients/${encodeURIComponent(clientId)}/records/new?templateId=${encodeURIComponent(templateId)}${
    draftId ? `&draft=${encodeURIComponent(draftId)}` : ""
  }`
