export interface AdminRoute {
  page: string
  id?: string
  tab?: string
}
const pages: Record<string, string> = {
  employee: "employees",
  "employee-form": "employees",
  house: "houses",
  "house-form": "houses",
  client: "clients",
  "client-form": "clients",
  docs: "documentation",
  notices: "notifications",
  "notice-form": "notifications",
  concern: "concerns",
}
export function adminHref(r: AdminRoute) {
  const group = pages[r.page] ?? r.page
  const entity = ["employee", "house", "client", "concern"].includes(r.page)
  const form = r.page.endsWith("-form")
  const path = `/admin/${group}${
    entity
      ? `/${encodeURIComponent(r.id ?? "missing")}`
      : form
        ? r.id
          ? `/${encodeURIComponent(r.id)}/edit`
          : "/new"
        : ""
  }`
  return path + (r.tab ? `?tab=${encodeURIComponent(r.tab)}` : "")
}
