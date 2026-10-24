import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { requireHouse } from "@/server/data/access"
import { requirePreview } from "@/lib/require-preview"
import StaffScopeGuard from "@/modules/preview/StaffScopeGuard"
export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ id: string }>
  children: React.ReactNode
}) {
  const { id } = await params
  if (isBackendEnabled())
    return staffPage(
      () => requireHouse(id),
      () => children,
    )
  requirePreview()
  return (
    <StaffScopeGuard kind="house" id={id}>
      {children}
    </StaffScopeGuard>
  )
}
