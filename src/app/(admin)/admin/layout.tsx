import { database } from "@/server/db"
import AdminReadShell from "@/modules/admin/read/AdminReadShell"
import { isBackendEnabled } from "@/server/config/backend"
import {
  entryIdentity,
  BackendUnavailable,
} from "@/modules/auth/ui/BackendEntry"
import { notFound } from "next/navigation"
import { isPreviewEnabled } from "@/lib/preview"
import { developmentMockAdapter } from "@/modules/staff/data/development-mock-adapter"
import AdminShell from "@/components/layout/AdminShell"
export const dynamic = "force-dynamic"
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (isBackendEnabled()) {
    const employee = await entryIdentity(true)
    if (!employee) return <BackendUnavailable />
    const organisation = await database().organisation.findUniqueOrThrow({
      where: { id: employee.organisationId },
      select: { isFictionalDemo: true },
    })
    return (
      <AdminReadShell
        fictionalDemo={organisation.isFictionalDemo}
        name={employee.name}
        recordId={employee.id}
      >
        {children}
      </AdminReadShell>
    )
  }
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
