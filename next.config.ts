import type { NextConfig } from "next"
const config: NextConfig = {
  // Keep builds/test runs from invalidating a running development server.
  distDir:
    process.env.NEXT_BUILD_DIR ||
    (process.env.VERCEL === "1" ? ".next" : ".next-local"),
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=()",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ]
  },
  // Keep the optional framework indicator clear of the Staff bottom navigation.
  devIndicators: false,
}
export default config
