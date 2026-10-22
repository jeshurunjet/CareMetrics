import Link from "next/link"
import type { FileRecord, GallerySubject } from "./types"
import { Icon } from "../ui"
import { getDemoAsset } from "./adapter"
import { galleryHref } from "./navigation"
import FileTypeIcon from "./FileTypeIcon"
import FileImage from "./FileImage"
import DownloadAction from "./DownloadAction"
import { formatBytes } from "./policy"
import { formatDate } from "@/lib/time"
export default function FileCard({
  file,
  subject,
  author,
}: {
  file: FileRecord
  subject: GallerySubject
  author: string
}) {
  const asset = getDemoAsset(file)
  return (
    <article className="cm-file" data-file-id={file.id}>
      <Link
        className="cm-file-thumb"
        href={galleryHref(subject, file.id, "preview")}
        aria-label={`Preview ${file.name}`}
      >
        {asset && file.category === "image" ? (
          <FileImage src={asset.path} name={file.name} retry={false} />
        ) : (
          <FileTypeIcon file={file} />
        )}
      </Link>
      <div className="cm-file-meta">
        <strong>{file.name}</strong>
        <span>
          {file.category === "image"
            ? "Image"
            : file.category === "pdf"
              ? "PDF"
              : "Document"}{" "}
          · {formatDate(file.uploadedAt)}
        </span>
        <span>
          {formatBytes(file.bytes)} · {author}
        </span>
        {file.availability === "sessionOnly" && (
          <span>Temporary metadata · contents not retained</span>
        )}
      </div>
      <div className="cm-file-actions">
        <Link
          href={galleryHref(subject, file.id)}
          aria-label={`File information for ${file.name}`}
        >
          <Icon name="info" size={16} />
        </Link>
        <DownloadAction file={file} />
      </div>
    </article>
  )
}
