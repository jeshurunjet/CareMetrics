import type { DiarySubject } from "../data/types"
export const diaryProfileHref = (s: DiarySubject) =>
  `/${
    s.scope === "client" ? "clients" : "houses"
  }/${encodeURIComponent(s.targetId)}`
export const diaryHistoryHref = (s: DiarySubject) =>
  `${diaryProfileHref(s)}?tab=diary`
export const diaryEntryHref = (
  s: DiarySubject,
  id: string,
  correction = false,
) =>
  `${diaryHistoryHref(s)}&item=${encodeURIComponent(id)}${
    correction ? "&action=correction" : ""
  }`
export const diaryFormHref = (s: DiarySubject, draftId?: string) =>
  `${diaryProfileHref(s)}/diary/new${
    draftId ? `?draft=${encodeURIComponent(draftId)}` : ""
  }`
