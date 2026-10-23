import { requirePreview } from "@/lib/require-preview"
import StaffScopeGuard from "@/modules/preview/StaffScopeGuard"
export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ id: string }>
  children: React.ReactNode
}) {
  requirePreview()
  const { id } = await params
  return (
    <StaffScopeGuard kind="client" id={id}>
      {children}
    </StaffScopeGuard>
  )
}
