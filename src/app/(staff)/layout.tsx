import { isBackendEnabled } from "@/server/config/backend"
import {
  entryIdentity,
  BackendUnavailable,
} from "@/modules/auth/ui/BackendEntry"
import { notFound } from "next/navigation"
import { isPreviewEnabled } from "@/lib/preview"
import StaffShell from "@/components/layout/StaffShell"
export const dynamic = "force-dynamic"
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (isBackendEnabled()) {
    if (!(await entryIdentity())) return <BackendUnavailable />
    return <main className="cm-content">{children}</main>
  }
  if (!isPreviewEnabled()) notFound()
  return <StaffShell>{children}</StaffShell>
}
