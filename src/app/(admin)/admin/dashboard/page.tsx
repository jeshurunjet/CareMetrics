import { requirePreview } from "@/lib/require-preview"
import UnportedScreen from "@/components/UnportedScreen"
export default function Page() {
  requirePreview()
  return <UnportedScreen title="Dashboard" />
}
