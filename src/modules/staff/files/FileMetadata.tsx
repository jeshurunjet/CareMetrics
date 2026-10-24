import type { FileRecord, GallerySubject } from "./types"
import { useStaffData } from "../data/context"
import { getGallerySubject } from "./adapter"
import { formatBytes } from "./policy"
import { formatDateTime } from "@/lib/time"
export default function FileMetadata({
  file,
  subject,
}: {
  file: FileRecord
  subject: GallerySubject
}) {
  const s = useStaffData()
  return (
    <dl className="cm-dl cm-file-details">
      {[
        ["Filename", file.name],
        ["Description", file.description || "Not provided"],
        ["Type", file.mimeType],
        ["Size", formatBytes(file.bytes)],
        ["Uploaded", `${formatDateTime(file.uploadedAt)} · Pacific/Auckland`],
        [
          "Uploaded by",
          s.staff.find((e) => e.id === file.uploadedById)?.name ??
            "Fictional staff member",
        ],
        [
          subject.scope === "client" ? "Client" : "House",
          getGallerySubject(s, subject)?.name ?? "Unavailable",
        ],
        [
          "Availability",
          file.availability === "bundled"
            ? "Bundled public demonstration asset"
            : file.availability === "sessionOnly"
              ? "Development session metadata only; selected contents were not retained"
              : "Demonstration asset unavailable",
        ],
        [
          "Removal",
          "Management / administrators only; development logical removal is available in Admin",
        ],
      ].map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
