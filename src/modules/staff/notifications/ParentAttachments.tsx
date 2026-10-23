"use client"
import { useStaffData } from "../data/context"
import { getParentAttachments } from "./adapter"
import { demoAssets } from "../files/demo-assets"
import { formatBytes } from "../files/policy"
import type { Notice } from "../data/types"
import type { Concern } from "./types"
export default function ParentAttachments({
  parent,
  scope,
}: {
  parent: Notice | Concern
  scope: "notification" | "concern"
}) {
  const s = useStaffData(),
    files = getParentAttachments(s, parent, scope)
  return (
    files.length > 0 && (
      <section aria-label="Supporting attachments">
        <h3 className="cm-h3">Supporting attachments</h3>
        {files.map((f) => {
          const asset =
            f.availability === "bundled" && f.assetId
              ? demoAssets[f.assetId]
              : undefined
          return (
            <div key={f.id} className="cm-notice-card">
              <strong>{f.name}</strong>
              <p>
                {f.mimeType} · {formatBytes(f.bytes)}
              </p>
              {asset ? (
                <a className="cm-link" href={asset.path} download>
                  Download public demonstration file
                </a>
              ) : (
                <p className="cm-hint">
                  Metadata only · selected contents were not retained. Preview
                  and download unavailable; no file was uploaded.
                </p>
              )}
            </div>
          )
        })}
      </section>
    )
  )
}
