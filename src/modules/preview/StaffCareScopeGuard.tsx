"use client"
import { notFound } from "next/navigation"
import { useStaffData } from "../staff/data/context"
import { getAssignedCareTemplate } from "../staff/care/adapter"
export default function StaffCareScopeGuard({
  clientId,
  templateId,
  kind,
  children,
}: {
  clientId: string
  templateId: string
  kind: "care" | "chart"
  children: React.ReactNode
}) {
  const s = useStaffData()
  if (!getAssignedCareTemplate(s, clientId, templateId, kind)) notFound()
  return children
}
