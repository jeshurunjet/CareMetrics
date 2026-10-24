import { isStaffPreviewRole } from "../data/permissions"
import type { StaffSnapshot } from "../data/types"
import type { GallerySubject, FileRecord, FileSelectionMetadata } from "./types"
import { getClient, getHouse } from "../data/queries"
import { demoAssets } from "./demo-assets"
import { validateFileSelection } from "./policy"
export function getGallerySubject(s: StaffSnapshot, subject: GallerySubject) {
  if (!s.staff.some((e) => e.id === s.meId && isStaffPreviewRole(e.role)))
    return undefined
  return subject.scope === "client"
    ? getClient(s, subject.targetId)
    : getHouse(s, subject.targetId)
}
export const canSelectFiles = (s: StaffSnapshot, subject: GallerySubject) =>
  !!getGallerySubject(s, subject)
export function getGalleryFiles(s: StaffSnapshot, subject: GallerySubject) {
  if (!getGallerySubject(s, subject)) return []
  return s.attachments
    .filter(
      (f) =>
        !f.removed &&
        f.association.scope === subject.scope &&
        f.association.targetId === subject.targetId,
    )
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
}
export const getGalleryFile = (
  s: StaffSnapshot,
  subject: GallerySubject,
  id: string,
) => getGalleryFiles(s, subject).find((f) => f.id === id)
export function getDemoAsset(file: FileRecord) {
  return !file.removed &&
    file.availability === "bundled" &&
    file.assetId &&
    Object.prototype.hasOwnProperty.call(demoAssets, file.assetId)
    ? demoAssets[file.assetId]
    : undefined
}
export function queryGallery(
  s: StaffSnapshot,
  subject: GallerySubject,
  query = "",
  category = "all",
  requestedPage = 1,
) {
  const files = getGalleryFiles(s, subject).filter(
    (f) =>
      f.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (category === "all" || f.category === category),
  )
  const page = Math.max(
    1,
    Math.min(requestedPage, Math.ceil(files.length / 6) || 1),
  )
  return {
    items: files.slice((page - 1) * 6, page * 6),
    total: files.length,
    page,
  }
}
/** Metadata only. Does not accept File/Blob/URL data or persist contents. No deletion operation. */
export function addDemoFileMetadata(
  s: StaffSnapshot,
  subject: GallerySubject,
  selections: readonly FileSelectionMetadata[],
  now: string,
): StaffSnapshot {
  if (!canSelectFiles(s, subject)) throw new Error("Gallery unavailable")
  const ids = new Set(s.attachments.map((f) => f.id))
  const files: FileRecord[] = selections.map((f) => {
    const error = validateFileSelection(f)
    if (error) throw new Error(error)
    if (!f.id || ids.has(f.id)) throw new Error("Duplicate or missing file ID")
    ids.add(f.id)
    return {
      id: f.id,
      name: f.name,
      description: f.description?.trim(),
      mimeType: f.type,
      bytes: f.size,
      category: f.type.startsWith("image/")
        ? "image"
        : f.type === "application/pdf"
          ? "pdf"
          : "document",
      uploadedAt: now,
      uploadedById: s.meId,
      association: { ...subject },
      availability: "sessionOnly",
    }
  })
  return { ...s, attachments: [...files, ...s.attachments] }
}
export const fileQueries = {
  getGalleryFiles,
  getGalleryFile,
  queryGallery,
  addDemoFileMetadata,
}
