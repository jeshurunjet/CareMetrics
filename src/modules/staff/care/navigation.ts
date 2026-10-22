export const careListHref = (clientId: string) =>
  `/clients/${encodeURIComponent(clientId)}?tab=care`
export const careHistoryHref = (clientId: string, templateId: string) =>
  `${careListHref(clientId)}&sub=${encodeURIComponent(templateId)}`
export const careDetailHref = (
  clientId: string,
  templateId: string,
  id: string,
  correction = false,
) =>
  `${careHistoryHref(clientId, templateId)}&item=${encodeURIComponent(id)}${
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
