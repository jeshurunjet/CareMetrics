import "server-only"
import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
export function validateQuery(
  input: Record<string, string | string[] | undefined>,
  mode: "files" | "notices" | "reports" | "detail",
) {
  requirePreview()
  const allowed =
    mode === "files" ? ["fileId"] : mode === "detail" ? [] : ["tab"]
  if (
    Object.entries(input).some(
      ([k, v]) => !allowed.includes(k) || typeof v !== "string" || !v,
    )
  )
    notFound()
  const q = input as Record<string, string>
  if (q.fileId) validateId(q.fileId)
  if (
    q.tab &&
    !(
      mode === "notices" ? ["notices", "concerns"] : ["reports", "audit"]
    ).includes(q.tab)
  )
    notFound()
  return q
}
export function validateId(id: string) {
  requirePreview()
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(id)) notFound()
}
