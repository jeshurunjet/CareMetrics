import "server-only"
import { notFound } from "next/navigation"
import { isPreviewEnabled } from "./preview"
/** Call before rendering any preview page; layout guards alone do not guard child execution. */
export function requirePreview(): void {
  if (!isPreviewEnabled()) notFound()
}
