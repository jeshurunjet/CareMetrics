import { notFound } from "next/navigation"
import { isPreviewEnabled } from "@/lib/preview"
import StaffShell from "@/components/layout/StaffShell"
export const dynamic = "force-dynamic"
export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isPreviewEnabled()) notFound()
  return <StaffShell>{children}</StaffShell>
}
