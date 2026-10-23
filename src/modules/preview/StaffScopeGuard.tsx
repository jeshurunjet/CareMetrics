"use client"
import { notFound } from "next/navigation"
import { useStaffData } from "../staff/data/context"
import { getHouse, getClient } from "../staff/data/queries"
export default function StaffScopeGuard({
  kind,
  id,
  children,
}: {
  kind: "house" | "client"
  id: string
  children: React.ReactNode
}) {
  const s = useStaffData()
  if (!(kind === "house" ? getHouse(s, id) : getClient(s, id))) notFound()
  return children
}
