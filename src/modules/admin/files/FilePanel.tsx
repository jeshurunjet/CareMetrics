"use client"
import { useState } from "react"
import Link from "next/link"
import { useAdmin, KV } from "../ui/core"
import { managedFiles, subjectName, removeFile } from "../governance/adapter"
import Drawer from "../workforce/Drawer"
import { Banner, Btn, Empty, Modal } from "../../staff/ui"
import { Field } from "../ui/Form"
import FileImage from "../../staff/files/FileImage"
import DownloadAction from "../../staff/files/DownloadAction"
import { getDemoAsset } from "../../staff/files/adapter"
import { formatBytes } from "../../staff/files/policy"
import { formatDateTime } from "@/lib/time"
import type { GallerySubject } from "../../staff/files/types"
export default function FilePanel({
  id,
  onClose,
}: {
  id: string
  onClose: () => void
}) {
  const { data: s, role, update } = useAdmin(),
    f = managedFiles(s, role).find((f) => f.id === id)
  const [confirm, setConfirm] = useState(false),
    [reason, setReason] = useState(""),
    [error, setError] = useState("")
  if (!f)
    return (
      <Drawer title="File unavailable" onClose={onClose}>
        <Empty
          title="File unavailable"
          text="This file could not be found or is not available in this gallery."
        />
      </Drawer>
    )
  const association = f.association as GallerySubject,
    name = subjectName(s, association),
    asset = getDemoAsset(f)
  function remove() {
    try {
      update(removeFile(s, role, id, reason, new Date().toISOString()))
      setConfirm(false)
      setError("")
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <Drawer
      title={f.name}
      sub={`${association.scope} · ${name}`}
      onClose={onClose}
      footer={
        !f.removed && (
          <Btn variant="danger" icon="trash" onClick={() => setConfirm(true)}>
            Remove file
          </Btn>
        )
      }
    >
      {f.removed && (
        <Banner tone="danger" title="Logically removed · development only">
          {f.removed.byName} · {formatDateTime(f.removed.at)}. Reason:{" "}
          {f.removed.reason}. Metadata is retained; no storage object was
          deleted.
        </Banner>
      )}
      <div className="ad-file-preview">
        {asset && f.category === "image" ? (
          <FileImage
            src={asset.path}
            name={f.name}
            className="cm-preview-img"
          />
        ) : (
          <span>
            <small>
              {f.removed
                ? "Preview unavailable — file logically removed"
                : "No bundled preview available for this demonstration file"}
            </small>
          </span>
        )}
      </div>
      <KV
        cols={1}
        items={[
          ["Filename", f.name],
          ["Type", f.mimeType],
          ["Size", formatBytes(f.bytes)],
          ["Uploaded by", s.staff.find((e) => e.id === f.uploadedById)?.name],
          ["Uploaded", formatDateTime(f.uploadedAt)],
          ["Description", f.description || "Not provided"],
          [
            "Belongs to",
            <Link
              key="subject"
              className="ad-link"
              href={`/admin/${
                association.scope === "client" ? "clients" : "houses"
              }/${encodeURIComponent(association.targetId)}?tab=files`}
            >
              {name}
            </Link>,
          ],
          [
            "Status",
            f.removed
              ? "Removed"
              : f.availability === "bundled"
                ? "Public demonstration asset"
                : f.availability === "sessionOnly"
                  ? "Session metadata only"
                  : "Demonstration asset unavailable",
          ],
        ]}
      />
      {!f.removed && <DownloadAction file={f} />}
      <p className="ad-faint">
        Private storage, durable removal audit, retention and restoration are
        Future Development. Only genuine harmless public examples can be
        downloaded.
      </p>
      {confirm && (
        <Modal
          title={`Remove ${f.name}?`}
          subtitle={`${association.scope} · ${name}`}
          onClose={() => setConfirm(false)}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setConfirm(false)}>
                Cancel
              </Btn>
              <Btn variant="danger" onClick={remove}>
                Confirm removal
              </Btn>
            </>
          }
        >
          <p>
            Hide this file from ordinary Staff galleries in this development
            session. Original metadata and the removal event remain available to
            management. No real storage object will be deleted. Retention and
            restoration policies are provisional.
          </p>
          <Field
            label="Reason for removal"
            type="textarea"
            required
            value={reason}
            onChange={setReason}
          />
          {error && <p role="alert">{error}</p>}
        </Modal>
      )}
    </Drawer>
  )
}
