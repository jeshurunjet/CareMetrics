import { notFound } from "next/navigation"
import { isPreviewEnabled } from "@/lib/preview"
import { developmentMockAdapter } from "@/modules/staff/data/development-mock-adapter"
import AdminShell from "@/components/layout/AdminShell"
export const dynamic = "force-dynamic"
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isPreviewEnabled()) notFound()
  return (
    <AdminShell
      data={developmentMockAdapter.getSnapshot(
        "s1",
        process.env.CAREMETRICS_DEMO_NOW || new Date().toISOString(),
        true,
      )}
    >
      {children}
    </AdminShell>
  )
}
