"use client"
import { useRouter } from "next/navigation"
export interface StaffRoute {
  page: string
  id?: string
  tab?: string
  sub?: string
  item?: string
}
export function staffHref(r: StaffRoute): string {
  const path =
    r.page === "home"
      ? "/dashboard"
      : r.page === "clock"
        ? "/shift-check"
        : r.page === "house"
          ? `/houses/${encodeURIComponent(r.id ?? "")}`
          : r.page === "client"
            ? `/clients/${encodeURIComponent(r.id ?? "")}`
            : `/${r.page}`
  const q = new URLSearchParams()
  if (r.tab) q.set("tab", r.tab)
  if (r.sub) q.set("sub", r.sub)
  if (r.item) q.set("item", r.item)
  return path + (q.size ? `?${q}` : "")
}
export function useNav() {
  const router = useRouter()
  return {
    go: (r: StaffRoute) => router.push(staffHref(r)),
    back: () => {
      if (window.history.length > 1) router.back()
      else router.push("/dashboard")
    },
    canBack: true,
  }
}
