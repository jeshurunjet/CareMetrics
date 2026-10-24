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
    if (!(await entryIdentity(true))) return <BackendUnavailable />
    return (
      <>
        <div className="ad-desktop-guard">
          <h2>Desktop required</h2>
          <p>
            CareMetrics Administration is available on desktop browsers. Please
            open this interface on a larger screen.
          </p>
        </div>
        <div className="ad-app">
          <main className="ad-main">{children}</main>
        </div>
      </>
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
