import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { developmentMockAdapter as adapter } from "../../src/modules/staff/data/development-mock-adapter"
import {
  getGalleryFiles,
  getGalleryFile,
  queryGallery,
  addDemoFileMetadata,
  getDemoAsset,
  canSelectFiles,
} from "../../src/modules/staff/files/adapter"
import {
  validateFileSelection,
  developmentFilePolicy,
  acceptedFiles,
} from "../../src/modules/staff/files/policy"
import { demoAssets } from "../../src/modules/staff/files/demo-assets"
import type { GallerySubject } from "../../src/modules/staff/files/types"
const now = "2026-10-22T01:00:00.000Z",
  s = adapter.getSnapshot("s1", now)
const client: GallerySubject = { scope: "client", targetId: "c1" },
  house: GallerySubject = { scope: "house", targetId: "h1" }
const selection = {
  id: "selected-id",
  name: "fictional.txt",
  type: "text/plain",
  size: 100,
  description: "Harmless demo only",
}
describe("shared scoped gallery metadata", () => {
  it("keeps client and house files separate and excludes unauthorised fixtures from snapshots", () => {
    expect(getGalleryFiles(s, client)).toHaveLength(7)
    expect(getGalleryFiles(s, house)).toHaveLength(5)
    expect(getGalleryFile(s, client, "house-readme")).toBeUndefined()
    expect(getGalleryFile(s, house, "client-readme")).toBeUndefined()
    expect(getGalleryFiles(s, { scope: "client", targetId: "c4" })).toEqual([])
    expect(getGalleryFiles(s, { scope: "house", targetId: "h3" })).toEqual([])
    expect(s.attachments.some((f) => f.id.startsWith("private"))).toBe(false)
    const other = adapter.getSnapshot("s3", now)
    expect(getGalleryFiles(other, client)).toEqual([])
    expect(getGalleryFiles(other, house)).toEqual([])
  })
  it("checks role/subject access even for callers with a broad snapshot", () => {
    const forged = { ...s, meId: "missing" }
    expect(canSelectFiles(forged, client)).toBe(false)
    expect(
      canSelectFiles(
        {
          ...s,
          staff: s.staff.map((e) => ({ ...e, role: "Unrecognised role" })),
        },
        client,
      ),
    ).toBe(false)
    expect(getGalleryFile(s, client, "missing")).toBeUndefined()
  })
  it("shows empty subjects and scopes case-insensitive filename/type filters and six-file pages", () => {
    expect(queryGallery(s, { scope: "client", targetId: "c3" }).total).toBe(0)
    expect(queryGallery(s, { scope: "house", targetId: "h2" }).total).toBe(0)
    expect(queryGallery(s, client).items[0].id).toBe("client-garden")
    expect(queryGallery(s, client).items).toHaveLength(6)
    expect(queryGallery(s, client, "", "all", 2).items).toHaveLength(1)
    expect(queryGallery(s, client, "GARDEN", "image").items[0].id).toBe(
      "client-garden",
    )
    expect(queryGallery(s, house, "Different client").total).toBe(0)
    expect(queryGallery(s, client, "", "document").total).toBe(3)
  })
  it("enables only genuine allowlisted bundled assets and verifies their bytes", () => {
    for (const asset of Object.values(demoAssets)) {
      const bytes = readFileSync(`public${asset.path}`)
      expect(bytes.byteLength).toBe(asset.bytes)
      expect(bytes.toString()).not.toMatch(
        /Taylor Reed|Riverside Lodge|Morgan Reed/,
      )
    }
    expect(
      getDemoAsset(getGalleryFile(s, client, "client-garden")!)?.path,
    ).toBe("/demo-assets/garden-demo.png")
    expect(
      getDemoAsset(getGalleryFile(s, client, "client-pdf")!),
    ).toBeUndefined()
    expect(
      getDemoAsset(getGalleryFile(s, client, "client-docx")!),
    ).toBeUndefined()
  })
  it("adds only temporary metadata with the current author and explicit immutable association", () => {
    const before = structuredClone(s)
    const next = addDemoFileMetadata(s, client, [selection], now)
    const f = getGalleryFile(next, client, selection.id)!
    expect(f).toMatchObject({
      name: selection.name,
      uploadedById: "s1",
      uploadedAt: now,
      association: client,
      availability: "sessionOnly",
      bytes: 100,
    })
    expect(Object.keys(f)).not.toContain("url")
    expect(f.assetId).toBeUndefined()
    expect(getDemoAsset(f)).toBeUndefined()
    expect(s).toEqual(before)
    expect(getGalleryFile(next, house, selection.id)).toBeUndefined()
    expect(
      getGalleryFile(adapter.getSnapshot("s1", now), client, selection.id),
    ).toBeUndefined()
    expect(
      Object.keys(adapter).some((key) => /delete|removeFile/i.test(key)),
    ).toBe(false)
  })
  it("rejects invalid selections, duplicates and unauthorised associations without partial writes", () => {
    expect(() =>
      addDemoFileMetadata(
        s,
        { scope: "client", targetId: "c4" },
        [selection],
        now,
      ),
    ).toThrow(/unavailable/)
    expect(() =>
      addDemoFileMetadata(
        s,
        { scope: "house", targetId: "h3" },
        [selection],
        now,
      ),
    ).toThrow(/unavailable/)
    expect(() =>
      addDemoFileMetadata(s, client, [selection, selection], now),
    ).toThrow(/Duplicate/)
    expect(() =>
      addDemoFileMetadata(
        s,
        client,
        [
          selection,
          { ...selection, id: "bad", type: "application/x-msdownload" },
        ],
        now,
      ),
    ).toThrow(/Unsupported/)
    expect(s.attachments.some((f) => f.id === selection.id)).toBe(false)
  })
})
describe("central provisional selection feedback", () => {
  it("accepts configured JPEG PNG WebP PDF and document metadata with matching extensions", () => {
    for (const f of developmentFilePolicy.formats)
      expect(
        validateFileSelection({
          name: `DEMO.${f.extensions[0].toUpperCase()}`,
          type: f.mime,
          size: 1,
        }),
      ).toBeUndefined()
    expect(acceptedFiles()).toContain(".pdf")
    expect(acceptedFiles(true)).not.toContain(".pdf")
  })
  it("rejects executable HTML/SVG uploads, mismatched extensions, empty and malformed sizes", () => {
    for (const f of [
      { name: "x.exe", type: "application/x-msdownload", size: 2 },
      { name: "x.svg", type: "image/svg+xml", size: 2 },
      { name: "x.html", type: "text/html", size: 2 },
      { name: "x.pdf", type: "image/png", size: 2 },
      { name: "x.txt", type: "text/plain", size: 0 },
      { name: "x.txt", type: "text/plain", size: Infinity },
    ])
      expect(validateFileSelection(f)).toBeTruthy()
    expect(
      validateFileSelection(
        { name: "x.pdf", type: "application/pdf", size: 2 },
        true,
      ),
    ).toMatch(/Unsupported/)
  })
  it("enforces the configurable development limit without representing an approved policy", () => {
    const limit = developmentFilePolicy.maxBytes
    expect(validateFileSelection({ ...selection, size: limit })).toBeUndefined()
    expect(validateFileSelection({ ...selection, size: limit + 1 })).toMatch(
      /provisional development limit/,
    )
    expect(
      validateFileSelection({ ...selection, size: 11 }, false, {
        ...developmentFilePolicy,
        maxBytes: 10,
      }),
    ).toBeTruthy()
  })
})
