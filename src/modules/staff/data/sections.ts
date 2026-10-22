export const houseTabs = ["overview", "diary", "files", "concerns"] as const
export const clientTabs = [
  "overview",
  "diary",
  "care",
  "charting",
  "files",
] as const
export type HouseTab = typeof houseTabs[number]
export type ClientTab = typeof clientTabs[number]
export function isHouseTab(value: unknown): value is HouseTab {
  return houseTabs.some((t) => t === value)
}
export function isClientTab(value: unknown): value is ClientTab {
  return clientTabs.some((t) => t === value)
}
