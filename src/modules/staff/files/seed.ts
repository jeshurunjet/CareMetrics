import type { FileRecord, DemoAssetId, GallerySubject } from "./types"
import { demoAssets } from "./demo-assets"
export function seedAttachments(now: string): FileRecord[] {
  let hours = 1
  const make = (
    id: string,
    subject: GallerySubject,
    name: string,
    assetId?: DemoAssetId,
    mimeType = "application/pdf",
  ): FileRecord => ({
    id,
    name,
    association: subject,
    assetId,
    mimeType: assetId ? demoAssets[assetId].mimeType : mimeType,
    bytes: assetId ? demoAssets[assetId].bytes : 4096,
    category:
      assetId === "garden" || assetId === "room"
        ? "image"
        : mimeType === "application/pdf" && !assetId
          ? "pdf"
          : "document",
    description:
      "Harmless fictional development example. Contains no client or health information.",
    uploadedById: hours % 2 ? "s1" : "s2",
    uploadedAt: new Date(Date.parse(now) - hours++ * 3600000).toISOString(),
    availability: assetId ? "bundled" : "unavailable",
  })
  const c1: GallerySubject = { scope: "client", targetId: "c1" },
    h1: GallerySubject = { scope: "house", targetId: "h1" }
  return [
    make("client-garden", c1, "Demo garden illustration.png", "garden"),
    make("client-room", c1, "Demo room illustration.png", "room"),
    make(
      "client-activity",
      c1,
      "Demo activity-space illustration with a deliberately long filename for responsive layout review.png",
      "garden",
    ),
    make("client-readme", c1, "Public demonstration notes.txt", "readme"),
    make("client-csv", c1, "Public demonstration inventory.csv", "inventory"),
    make("client-pdf", c1, "Fictional document example.pdf"),
    make(
      "client-docx",
      c1,
      "Fictional document example.docx",
      undefined,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ),
    make(
      "client-c2-notes",
      { scope: "client", targetId: "c2" },
      "Different client demo notes.txt",
      "readme",
    ),
    make(
      "client-c2-pdf",
      { scope: "client", targetId: "c2" },
      "Different client demo document.pdf",
    ),
    make("house-garden", h1, "House demo garden.png", "garden"),
    make("house-room", h1, "House demo room.png", "room"),
    make("house-readme", h1, "House public demonstration notes.txt", "readme"),
    make(
      "house-csv",
      h1,
      "House public demonstration inventory.csv",
      "inventory",
    ),
    make("house-pdf", h1, "House fictional document example.pdf"),
    make(
      "private-client-file",
      { scope: "client", targetId: "c4" },
      "Restricted client file example.pdf",
    ),
    make(
      "private-house-file",
      { scope: "house", targetId: "h3" },
      "Restricted house file example.pdf",
    ),
  ]
}
