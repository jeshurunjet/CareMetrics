import "server-only"
import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import { developmentMockAdapter } from "@/modules/staff/data/development-mock-adapter"
export function validateAdminId(
  kind: "employees" | "houses" | "clients",
  id: string,
) {
  requirePreview()
  const s = developmentMockAdapter.getSnapshot(
    "s1",
    process.env.CAREMETRICS_DEMO_NOW || new Date().toISOString(),
    true,
  )
  const rows =
    kind === "employees" ? s.staff : kind === "houses" ? s.houses : s.clients
  if (
    !rows.some((r) => r.id === id) &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  )
    notFound()
}
export function validateAdminTab(kind: string, value: unknown) {
  const tabs: Record<string, string[]> = {
    employees: [
      "overview",
      "houses",
      "roster",
      "attendance",
      "leave",
      "account",
    ],
    houses: [
      "overview",
      "employees",
      "clients",
      "location",
      "diary",
      "files",
      "notices",
    ],
    clients: [
      "overview",
      "contacts",
      "house",
      "diary",
      "care",
      "chart",
      "files",
      "notices",
      "activity",
    ],
  }
  if (
    value !== undefined &&
    (typeof value !== "string" || !tabs[kind]?.includes(value))
  )
    notFound()
}
