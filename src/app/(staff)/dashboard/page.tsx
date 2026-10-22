import { requirePreview } from "@/lib/require-preview"
import Dashboard from "@/modules/staff/ui/Dashboard"
export default function Page() {
  requirePreview()
  return <Dashboard />
}
