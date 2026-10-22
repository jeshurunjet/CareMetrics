import type { GallerySubject } from "./types"
export const galleryHref = (
  subject: GallerySubject,
  id?: string,
  action: "info" | "preview" = "info",
) =>
  `/${
    subject.scope === "client" ? "clients" : "houses"
  }/${encodeURIComponent(subject.targetId)}?tab=files${
    id ? `&fileId=${encodeURIComponent(id)}&action=${action}` : ""
  }`
