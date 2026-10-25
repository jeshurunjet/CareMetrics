import type { NextConfig } from "next"
const config: NextConfig = {
  // Keep builds/test runs from invalidating a running development server.
  distDir: process.env.NEXT_BUILD_DIR || ".next-local",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Permissions-Policy", value: "geolocation=(self)" }],
      },
    ]
  },
  // Keep the optional framework indicator clear of the Staff bottom navigation.
  devIndicators: false,
}
export default config
