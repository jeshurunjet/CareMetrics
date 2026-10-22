import { notFound } from "next/navigation"
import { isPreviewEnabled } from "@/lib/preview"
import { developmentMockAdapter } from "@/modules/staff/data/development-mock-adapter"
import StaffShell from "@/components/layout/StaffShell"
export const dynamic = "force-dynamic"
export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isPreviewEnabled()) notFound()
  return (
    <StaffShell
      data={developmentMockAdapter.getSnapshot(
        "s1",
        process.env.CAREMETRICS_DEMO_NOW || new Date().toISOString(),
      )}
    >
      {children}
    </StaffShell>
  )
}
