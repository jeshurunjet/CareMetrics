import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { searchStaff } from "@/server/data/staff"
import { SearchRead } from "@/modules/staff/read/StaffReadViews"
import { requirePreview } from "@/lib/require-preview"
import Search from "@/modules/staff/ui/Search"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (isBackendEnabled()) {
    const query = await searchParams
    return staffPage(
      () => searchStaff(query.q),
      (data) => <SearchRead data={data} />,
    )
  }
  requirePreview()
  return <Search />
}
