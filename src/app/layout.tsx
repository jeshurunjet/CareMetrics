import OnlineOnly from "@/modules/auth/ui/OnlineOnly"
import { isBackendEnabled } from "@/server/config/backend"
import type { Metadata, Viewport } from "next"
import { preconnect, preinit } from "react-dom"
import "../index.css"
import "../styles/staff.css"
import "../styles/admin.css"
import "../styles/bootstrap.css"
import "../styles/admin-migration.css"
import { isPreviewEnabled } from "@/lib/preview"
import { developmentMockAdapter } from "@/modules/staff/data/development-mock-adapter"
import StaffDataProvider from "@/modules/staff/data/context"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "CareMetrics",
  description:
    "Care and workforce management for authorised CareMetrics staff.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/caremetrics-192.png",
    apple: "/icons/caremetrics-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "CareMetrics",
    statusBarStyle: "default",
  },
  robots: { index: false, follow: false },
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a6b7a",
  interactiveWidget: "resizes-content",
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
      <body style={isBackendEnabled() ? { visibility: "hidden" } : undefined}>
        {isPreviewEnabled() ? (
          <StaffDataProvider
            data={developmentMockAdapter.getSnapshot(
              "s1",
              process.env.CAREMETRICS_DEMO_NOW || new Date().toISOString(),
            )}
          >
            {children}
          </StaffDataProvider>
        ) : isBackendEnabled() ? (
          <OnlineOnly>{children}</OnlineOnly>
        ) : (
          children
        )}
        {isBackendEnabled() && (
          <noscript>
            <p style={{ visibility: "visible" }}>
              CareMetrics requires JavaScript and an internet connection.
            </p>
          </noscript>
        )}
      </body>
    </html>
  )
}
