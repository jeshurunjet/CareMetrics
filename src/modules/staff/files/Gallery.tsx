"use client"
import { useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import type { GallerySubject } from "./types"
import { useStaffData } from "../data/context"
import { getGallerySubject, getGalleryFile, queryGallery } from "./adapter"
import { galleryHref } from "./navigation"
import { Banner, Empty, Btn } from "../ui"
import SearchInput from "../ui/SearchInput"
import Select from "../ui/Select"
import Pagination from "../ui/Pagination"
import FileCard from "./FileCard"
import FileDetailsPanel from "./FileDetailsPanel"
import FileUploadArea from "./FileUploadArea"
export default function Gallery({ subject }: { subject: GallerySubject }) {
  const upload = useRef<HTMLDivElement>(null)
  const s = useStaffData(),
    router = useRouter(),
    params = useSearchParams()
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [page, setPage] = useState(1)
  const context = getGallerySubject(s, subject),
    id = params.get("fileId"),
    action = params.get("action") ?? "info"
  if (!context) return <Empty icon="shield" title="Gallery unavailable" />
  const history = queryGallery(s, subject, query, category, page),
    file = id ? getGalleryFile(s, subject, id) : undefined
  const close = () => router.push(galleryHref(subject))
  return (
    <div className="cm-stack cm-gallery" aria-label={`${context.name} gallery`}>
      <div className="cm-row-between">
        <div>
          <h2 className="cm-h2">
            {subject.scope === "client"
              ? "Client gallery & documents"
              : "House documents & gallery"}
          </h2>
          <p className="cm-muted">
            {context.name} · {queryGallery(s, subject).total} files
          </p>
        </div>
        <Btn
          icon="upload"
          variant="secondary"
          onClick={() => {
            upload.current?.scrollIntoView({ block: "start" })
            upload.current?.querySelector<HTMLButtonElement>("button")?.focus()
          }}
        >
          Upload files
        </Btn>
      </div>
      <Banner tone="info">
        Development gallery · fictional metadata and harmless public demo assets
        only. Secure uploads, private storage and permanent changes are not
        connected. Session additions reset on reload. Only management may remove
        existing files.
      </Banner>
      <div ref={upload}>
        <FileUploadArea subject={subject} />
      </div>
      <div className="cm-toolbar">
        <SearchInput
          label="Search filenames"
          placeholder="Search filenames"
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
        />
        <Select
          label="File type"
          value={category}
          onChange={(v) => {
            setCategory(v)
            setPage(1)
          }}
          options={[
            { value: "all", label: "All file types" },
            { value: "image", label: "Images" },
            { value: "pdf", label: "PDFs" },
            { value: "document", label: "Other documents" },
          ]}
        />
      </div>
      {!history.total ? (
        <Empty
          icon="image"
          title={
            query || category !== "all"
              ? "No matching files"
              : `No documents or photos have been uploaded for this ${subject.scope} yet.`
          }
          text={
            query || category !== "all"
              ? "Try adjusting your search or file-type filter."
              : "Select fictional demonstration files to preview the upload workflow."
          }
        />
      ) : (
        <ul className="cm-file-grid cm-file-list" aria-label="Gallery files">
          {history.items.map((f) => (
            <li key={f.id}>
              <FileCard
                file={f}
                subject={subject}
                author={
                  s.staff.find((e) => e.id === f.uploadedById)?.name ??
                  "Fictional staff member"
                }
              />
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={history.page}
        per={6}
        total={history.total}
        onChange={setPage}
      />
      {id && (!file || (action !== "info" && action !== "preview")) && (
        <Empty
          icon="shield"
          title="File unavailable"
          text="This file is not available in this gallery. Reload removes session-only examples."
          action={<Link href={galleryHref(subject)}>Return to gallery</Link>}
        />
      )}
      {file && (action === "info" || action === "preview") && (
        <FileDetailsPanel
          key={`${file.id}-${action}`}
          file={file}
          subject={subject}
          preview={action === "preview"}
          onClose={close}
          onPreview={() =>
            router.push(galleryHref(subject, file.id, "preview"))
          }
        />
      )}
    </div>
  )
}
