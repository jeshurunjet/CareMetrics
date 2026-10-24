import { isBackendEnabled } from "@/server/config/backend"
import { notFound } from "next/navigation"
import { isPreviewEnabled } from "@/lib/preview"
import { staffPage } from "@/server/data/page"
import { getCurrentStaff } from "@/server/data/staff"
import { StaffReadShell } from "@/modules/staff/read/StaffReadViews"
import StaffShell from "@/components/layout/StaffShell"
export const dynamic = "force-dynamic"
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (isBackendEnabled()) {
    return staffPage(getCurrentStaff, (employee) => (
      <StaffReadShell employee={employee}>{children}</StaffReadShell>
    ))
  }
  if (!isPreviewEnabled()) notFound()
  return <StaffShell>{children}</StaffShell>
}
