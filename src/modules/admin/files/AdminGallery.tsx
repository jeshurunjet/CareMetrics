"use client"
import { useState } from "react"
import Link from "next/link"
import { useAdmin, Panel } from "../ui/core"
import {
  managedFiles,
  subjectName,
  addManagementFiles,
} from "../governance/adapter"
import { Btn, Empty, Modal } from "../../staff/ui"
import FileUploadArea from "../../staff/files/FileUploadArea"
import type { GallerySubject } from "../../staff/files/types"
import { fileHref, FileThumbnail } from "./FilesPage"
import { formatDate } from "@/lib/time"
export default function AdminGallery({ subject }: { subject: GallerySubject }) {
  const { data: s, role, update } = useAdmin(),
    [upload, setUpload] = useState(false),
    [removed, setRemoved] = useState(false)
  const rows = managedFiles(s, role)
    .filter(
      (f) =>
        f.association.scope === subject.scope &&
        f.association.targetId === subject.targetId &&
        (removed || !f.removed),
    )
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  const name = subjectName(s, subject)
  if (!name) return <Empty title="Gallery unavailable" />
  return (
    <Panel
      title="Gallery & files"
      actions={
        <>
          <label className="ad-check">
            <input
              type="checkbox"
              checked={removed}
              onChange={(e) => setRemoved(e.target.checked)}
            />
            Show removed
          </label>
          <Btn size="sm" icon="upload" onClick={() => setUpload(true)}>
            Upload
          </Btn>
        </>
      }
    >
      {rows.length ? (
        <div className="ad-gallery">
          {rows.map((f) => (
            <Link
              className={`ad-tile${f.removed ? " removed" : ""}`}
              key={f.id}
              href={fileHref(f.id)}
            >
              <FileThumbnail file={f} />
              <span className="ad-tile-meta">
                <b>{f.name}</b>
                <small>
                  {f.removed
                    ? "Removed"
                    : s.staff.find((e) => e.id === f.uploadedById)?.name}{" "}
                  · {formatDate(f.uploadedAt)}
                </small>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          icon="image"
          title="No files yet"
          text="Only this client's or house's explicitly associated files appear here."
        />
      )}
      {upload && (
        <Modal
          wide
          title="Upload file · development preview"
          subtitle={`Attach to ${name}`}
          onClose={() => setUpload(false)}
          footer={
            <Btn variant="secondary" onClick={() => setUpload(false)}>
              Close selection
            </Btn>
          }
        >
          <FileUploadArea
            subject={subject}
            service={{
              name,
              complete: (files, at) =>
                update((current) =>
                  addManagementFiles(current, role, subject, files, at),
                ),
            }}
          />
        </Modal>
      )}
    </Panel>
  )
}
