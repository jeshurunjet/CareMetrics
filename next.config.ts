import type { NextConfig } from "next"
const config: NextConfig = {
  // Keep builds/test runs from invalidating a running development server.
  distDir: process.env.NEXT_BUILD_DIR || ".next-local",
  poweredByHeader: false,
}
export default config
