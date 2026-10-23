import { redirect } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
export default function Page() {
  requirePreview()
  redirect("/admin/dashboard")
}
