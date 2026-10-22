"use client"
import { useRouter } from "next/navigation"
import { beginMockSession } from "../mock-session"
import LoginView from "./LoginView"
export default function LoginPreview({
  previewEnabled,
}: {
  previewEnabled: boolean
}) {
  const router = useRouter()
  return (
    <LoginView
      previewEnabled={previewEnabled}
      onLogin={(role) => {
        if (!previewEnabled) return
        if (role === "employee") beginMockSession()
        router.push(role === "employee" ? "/shift-check" : "/admin/dashboard")
      }}
    />
  )
}
