import { notFound } from "next/navigation"
import { isPreviewEnabled } from "@/lib/preview"
import AdminShell from "@/components/layout/AdminShell"
export const dynamic = "force-dynamic"
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isPreviewEnabled()) notFound()
  return <AdminShell>{children}</AdminShell>
}
