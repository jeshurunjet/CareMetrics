import { requirePreview } from "@/lib/require-preview"
import Search from "@/modules/staff/ui/Search"
export default function Page() {
  requirePreview()
  return <Search />
}
