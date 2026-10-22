"use client"
import type { FileRecord, GallerySubject } from "./types"
import { Modal, Empty, Banner } from "../ui"
import FileMetadata from "./FileMetadata"
import DownloadAction from "./DownloadAction"
import FileImage from "./FileImage"
import { getDemoAsset } from "./adapter"
export default function FileDetailsPanel({
  file,
  subject,
  preview,
  onClose,
  onPreview,
}: {
  file: FileRecord
  subject: GallerySubject
  preview: boolean
  onClose: () => void
  onPreview: () => void
}) {
  const asset = getDemoAsset(file)
  return (
    <Modal
      wide={preview}
      title={preview ? file.name : "File information"}
      subtitle="Development preview · fictional metadata"
      onClose={onClose}
      footer={
        <>
          <DownloadAction file={file} />
          {!preview && (
            <button
              type="button"
              className="cm-btn cm-btn--primary cm-btn--sm"
              onClick={onPreview}
            >
              Preview file
            </button>
          )}
        </>
      }
    >
      {preview &&
        (asset && file.category === "image" ? (
          <FileImage
            src={asset.path}
            name={file.name}
            className="cm-preview-img"
          />
        ) : (
          <Empty
            icon="file"
            title="Preview not available"
            text={
              file.category === "pdf"
                ? "No bundled PDF is available for this fictional example."
                : "This type has no supported in-browser preview. Download is available only for a bundled demonstration asset."
            }
          />
        ))}
      <Banner tone="info">
        Only harmless public demonstration assets can be downloaded here. Secure
        private file services are not connected.
      </Banner>
      <FileMetadata file={file} subject={subject} />
    </Modal>
  )
}
