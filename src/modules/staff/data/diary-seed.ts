import type { DiaryCategory, DiaryEntry } from "./types"
export const diaryCategories: DiaryCategory[] = ([
  ["client", "Progress Notes"],
  ["client", "GP / OT / Health Appointments"],
  ["client", "Incident Reports"],
  ["client", "General Update"],
  ["house", "Operational Update"],
  ["house", "Maintenance"],
  ["house", "General Update"],
] as const).map(([scope, name], i) => ({
  id: `cat${i + 1}`,
  scope,
  name,
  active: true,
}))
export function seedDiary(now: string): DiaryEntry[] {
  return ([
    ["client", "c1", "cat1"],
    ["client", "c2", "cat4"],
    ["house", "h1", "cat5"],
    ["house", "h2", "cat7"],
    ["client", "c4", "cat1"],
    ["house", "h3", "cat5"],
  ] as const).flatMap(([scope, targetId, categoryId]) =>
    Array.from(
      { length: targetId === "c1" || targetId === "h1" ? 9 : 1 },
      (_, i) => {
        const at = (hours: number) =>
          new Date(Date.parse(now) - hours * 3600000).toISOString()
        return {
          id: `${scope}-${targetId}-${i + 1}`,
          scope,
          targetId,
          authorId: i === 8 ? "s2" : "s1",
          title: `${
            scope === "client" ? "Daily activities" : "House handover"
          } ${i + 1}`,
          categoryId: scope === "client" && i === 2 ? "cat2" : categoryId,
          body:
            scope === "client"
              ? "Fictional diary note for interface review. The planned activity was discussed and preferences were recorded. No real care or health information is included.\nA follow-up conversation is planned during the next visit."
              : "Fictional operational note for interface review. Shared spaces were checked and the next team was given the general house update. This note does not belong to a client diary.",
          coveredAt: at(i * 48 + 2),
          createdAt: at(i * 48 + 1.5),
          submittedAt: i === 7 || i === 8 ? undefined : at(i * 48 + 1),
          status: i === 7 || i === 8 ? "draft" : "submitted",
          offShiftReason: "Completing fictional notes after handover",
        }
      },
    ),
  )
}
