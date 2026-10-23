import { requirePreview } from "@/lib/require-preview"
import Settings from "@/modules/staff/profile/Settings"
export default function Page() {
  requirePreview()
  return <Settings />
}
