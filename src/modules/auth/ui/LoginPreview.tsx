"use client"
import { useOptionalPreviewSession } from "@/modules/preview/context"
import { useRouter } from "next/navigation"
import { beginMockSession } from "../mock-session"
import LoginView from "./LoginView"
export default function LoginPreview({
  previewEnabled,
}: {
  previewEnabled: boolean
}) {
  const router = useRouter()
  const session = useOptionalPreviewSession()
  return (
    <LoginView
      previewEnabled={previewEnabled}
      onLogin={(role) => {
        if (!previewEnabled) return
        session?.reset()
        session?.setRole(role === "employee" ? "Staff" : "Administrator")
        if (role === "employee") beginMockSession()
        router.push(role === "employee" ? "/shift-check" : "/admin/dashboard")
      }}
    />
  )
}
