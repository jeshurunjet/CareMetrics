import { requirePreview } from "@/lib/require-preview"
import HouseList from "@/modules/staff/ui/HouseList"
export default function Page() {
  requirePreview()
  return <HouseList />
}
