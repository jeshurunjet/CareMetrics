import type { DemoAssetId } from "./types"
/** Public, harmless bundled examples only. Never put private care files here. */
export const demoAssets: Record<DemoAssetId, {
  path: string
  mimeType: string
  bytes: number
}> = {
  garden: {
    path: "/demo-assets/garden-demo.png",
    mimeType: "image/png",
    bytes: 34453,
  },
  room: {
    path: "/demo-assets/room-demo.png",
    mimeType: "image/png",
    bytes: 24974,
  },
  readme: {
    path: "/demo-assets/public-demo-readme.txt",
    mimeType: "text/plain",
    bytes: 242,
  },
  inventory: {
    path: "/demo-assets/public-demo-inventory.csv",
    mimeType: "text/csv",
    bytes: 106,
  },
}
