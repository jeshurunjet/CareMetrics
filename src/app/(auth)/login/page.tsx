import LoginPreview from "@/modules/auth/ui/LoginPreview"
import { isPreviewEnabled } from "@/lib/preview"
export const dynamic = "force-dynamic"
export default function LoginPage() {
  return <LoginPreview previewEnabled={isPreviewEnabled()} />
}
