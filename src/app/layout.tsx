import type { Metadata } from "next"
import { preconnect, preinit } from "react-dom"
import "../index.css"
import "../styles/staff.css"
import "../styles/admin.css"
import "../styles/bootstrap.css"
export const metadata: Metadata = {
  title: "CareMetrics",
  description: "CareMetrics application foundation — UI only",
  robots: { index: false, follow: false },
}
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Preserve the export's remote font CSS: the CSS bundler drops its external @import.
  preconnect("https://fonts.googleapis.com")
  preconnect("https://fonts.gstatic.com", { crossOrigin: "anonymous" })
  preinit(
    "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap",
    { as: "style", precedence: "low" },
  )
  return (
    <html lang="en-NZ">
      <body>{children}</body>
    </html>
  )
}
