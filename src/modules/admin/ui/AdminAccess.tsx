"use client"
/** Demo UI boundary only. Every server page independently retains the production preview guard. */
import { usePreviewSession } from "@/modules/preview/context"
import { canManage } from "../data/adapter"
export default function AdminAccess({
  children,
}: {
  children: React.ReactNode
}) {
  const session = usePreviewSession()
  return canManage(session.role) && session.loaded ? children : null
}
