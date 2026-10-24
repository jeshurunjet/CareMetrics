"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageHead, DataTable, Pill, Select, useAdmin } from "../ui/core"
import { managedFiles, subjectName } from "../governance/adapter"
import ContextFilters, { useFilters, matches } from "../governance/Filters"
import FilePanel from "./FilePanel"
import { Empty } from "../../staff/ui"
import FileTypeIcon from "../../staff/files/FileTypeIcon"
import FileImage from "../../staff/files/FileImage"
import { getDemoAsset } from "../../staff/files/adapter"
import { formatBytes } from "../../staff/files/policy"
import { formatDateTime } from "@/lib/time"
import type { GallerySubject, FileRecord } from "../../staff/files/types"
export const fileHref = (id: string) =>
  `/admin/files?fileId=${encodeURIComponent(id)}`
export function FileThumbnail({ file: f }: { file: FileRecord }) {
  const asset = getDemoAsset(f)
  return asset && f.category === "image" ? (
    <FileImage src={asset.path} name={f.name} className="ad-file-thumb" />
  ) : (
    <span className="ad-file-ico">
      <FileTypeIcon file={f} />
    </span>
  )
}
export default function FilesPage({ fileId }: { fileId?: string }) {
  const { data: s, role } = useAdmin(),
    router = useRouter(),
    f = useFilters()
  const [type, setType] = useState(""),
    [uploader, setUploader] = useState(""),
    [status, setStatus] = useState("active")
  const rows = managedFiles(s, role)
    .filter((x) => {
      const a = x.association as GallerySubject,
        client = a.scope === "client" ? a.targetId : undefined,
        house =
          a.scope === "house"
            ? a.targetId
            : s.clients.find((c) => c.id === client)?.houseId
      return (
        matches(
          f,
          `${x.name} ${x.description ?? ""} ${subjectName(s, a)}`,
          x.uploadedAt,
          client,
          house,
        ) &&
        (!type || x.category === type) &&
        (!uploader || x.uploadedById === uploader) &&
        (status === "all" || (status === "removed" ? !!x.removed : !x.removed))
      )
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  return (
    <div className="ad-governance">
      <PageHead
        title="Files & Galleries"
        sub="Shared client and house files. Development-only metadata, previews and logical removal."
      />
      <ContextFilters f={f} label="Search files">
        <Select
          label="Type"
          value={type}
          onChange={setType}
          options={[
            { value: "", label: "All types" },
            ...["image", "pdf", "document"].map((value) => ({
              value,
              label: value,
            })),
          ]}
        />
        <Select
          label="Uploaded by"
          value={uploader}
          onChange={setUploader}
          options={[
            { value: "", label: "All uploaders" },
            ...s.staff.map((e) => ({ value: e.id, label: e.name })),
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "active", label: "Available" },
            { value: "removed", label: "Removed" },
            { value: "all", label: "All" },
          ]}
        />
      </ContextFilters>
      <p className="ad-faint">
        Upload-date filters use Pacific/Auckland. Open Client or House Files to
        select files for that exact gallery.
      </p>
      <DataTable
        rows={rows}
        per={12}
        onRow={(x) => router.push(fileHref(x.id))}
        empty={<Empty icon="image" title="No files" />}
        cols={[
          {
            key: "file",
            label: "File",
            sort: (x) => x.name,
            render: (x) => (
              <span className="ad-cell-file">
                <FileThumbnail file={x} />
                <span>
                  <b>{x.name}</b>
                  <small className="ad-block ad-faint">
                    {x.mimeType} · {formatBytes(x.bytes)}
                  </small>
                </span>
              </span>
            ),
          },
          {
            key: "subject",
            label: "Belongs to",
            render: (x) => (
              <>
                {subjectName(s, x.association as GallerySubject)}
                <small className="ad-block ad-faint">
                  {x.association.scope}
                </small>
              </>
            ),
          },
          {
            key: "by",
            label: "Uploaded by",
            render: (x) => s.staff.find((e) => e.id === x.uploadedById)?.name,
          },
          {
            key: "at",
            label: "Uploaded",
            sort: (x) => x.uploadedAt,
            render: (x) => formatDateTime(x.uploadedAt),
          },
          {
            key: "status",
            label: "Status",
            render: (x) => (
              <Pill
                s={x.removed ? "Removed" : "Available"}
                label={
                  x.removed
                    ? "Removed"
                    : x.availability === "sessionOnly"
                      ? "Metadata only"
                      : x.availability === "unavailable"
                        ? "Asset unavailable"
                        : "Public demo"
                }
              />
            ),
          },
          {
            key: "action",
            label: "Actions",
            render: (x) => (
              <Link className="ad-link" href={fileHref(x.id)}>
                Details / preview
              </Link>
            ),
          },
        ]}
      />
      {fileId && (
        <FilePanel
          key={fileId}
          id={fileId}
          onClose={() => router.push("/admin/files")}
        />
      )}
    </div>
  )
}
