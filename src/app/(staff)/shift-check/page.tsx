import { requirePreview } from "@/lib/require-preview"
import ClockIn from "@/modules/staff/ui/ClockIn"
export default function Page() {
  requirePreview()
  return <ClockIn />
}
