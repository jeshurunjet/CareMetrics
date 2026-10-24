import LoginBackend from "@/modules/auth/ui/LoginBackend"
import { isBackendEnabled } from "@/server/config/backend"
import LoginPreview from "@/modules/auth/ui/LoginPreview"
import { isPreviewEnabled } from "@/lib/preview"
export const dynamic = "force-dynamic"
export default function LoginPage() {
  if (isBackendEnabled()) return <LoginBackend />
  return <LoginPreview previewEnabled={isPreviewEnabled()} />
}
