export interface GallerySubject {
  scope: "client" | "house"
  targetId: string
}
export type AttachmentAssociation = GallerySubject | {
  scope: "diary" | "careRecord" | "notification" | "concern"
  targetId: string
}
export type DemoAssetId = "garden" | "room" | "readme" | "inventory"
export interface FileRecord {
  id: string
  name: string
  description?: string
  mimeType: string
  bytes: number
  category: "image" | "pdf" | "document"
  uploadedAt: string
  uploadedById: string
  association: AttachmentAssociation
  availability: "bundled" | "unavailable" | "sessionOnly"
  removed?: {
    byId: string
    byName: string
    at: string
    reason: string
  }
  assetId?: DemoAssetId
}
export interface FileSelectionMetadata {
  id: string
  name: string
  type: string
  size: number
  description?: string
}
